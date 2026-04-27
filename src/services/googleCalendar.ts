import { useCallback, useEffect, useRef, useState } from 'react';
import { GOOGLE_CLIENT_ID } from '../constants';
import { Schedule } from '../types';

declare global {
  interface Window {
    gapi?: typeof gapi;
    google?: GoogleIdentityServices;
  }
}

interface GoogleTokenResponse {
  access_token?: string;
  error?: string;
  error_description?: string;
}

interface GoogleTokenClient {
  callback: (resp: GoogleTokenResponse) => void;
  requestAccessToken: (options: { prompt: 'consent' | '' }) => void;
}

interface GoogleIdentityServices {
  accounts: {
    oauth2: {
      initTokenClient: (config: {
        client_id: string;
        scope: string;
        callback: (resp: GoogleTokenResponse) => void;
      }) => GoogleTokenClient;
    };
  };
}

type SyncResult = { success: boolean; message: string };

const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/calendar';
const GAPI_SCRIPT_ID = 'google-api-script';
const GIS_SCRIPT_ID = 'google-identity-script';
const GAPI_SCRIPT_SRC = 'https://apis.google.com/js/api.js';
const GIS_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

const loadScript = (id: string, src: string): Promise<void> => {
  const existingScript = document.getElementById(id) as HTMLScriptElement | null;
  if (existingScript) {
    if (existingScript.dataset.loaded === 'true') {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      existingScript.addEventListener('load', () => resolve(), { once: true });
      existingScript.addEventListener('error', () => reject(new Error(`No se pudo cargar ${src}`)), { once: true });
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.id = id;
    script.src = src;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      script.dataset.loaded = 'true';
      resolve();
    };
    script.onerror = () => reject(new Error(`No se pudo cargar ${src}`));
    document.head.appendChild(script);
  });
};

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return 'Error al sincronizar con Google Calendar.';
};

// Helper: Calculate the first occurrence date of a day of week on or after start date
const getFirstDateOfDay = (startDate: Date, dayName: string): Date => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const targetIndex = days.indexOf(dayName);
  if (targetIndex === -1) return startDate;

  const resultDate = new Date(startDate);
  const currentDay = resultDate.getDay();
  
  let distance = targetIndex - currentDay;
  if (distance < 0) {
    distance += 7;
  }
  
  resultDate.setDate(resultDate.getDate() + distance);
  return resultDate;
};

export const useGoogleCalendar = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const tokenClientRef = useRef<GoogleTokenClient | null>(null);
  const initPromiseRef = useRef<Promise<void> | null>(null);

  const updateAuthState = useCallback(() => {
    const token = window.gapi?.client.getToken();
    setIsAuthenticated(Boolean(token?.access_token));
  }, []);

  const initializeGoogleApi = useCallback(async (): Promise<void> => {
    if (initPromiseRef.current) {
      return initPromiseRef.current;
    }

    initPromiseRef.current = (async () => {
      if (!GOOGLE_CLIENT_ID) {
        throw new Error('Falta el ID de Cliente de Google en la configuración.');
      }

      setIsLoading(true);
      setError(null);

      await Promise.all([
        loadScript(GAPI_SCRIPT_ID, GAPI_SCRIPT_SRC),
        loadScript(GIS_SCRIPT_ID, GIS_SCRIPT_SRC),
      ]);

      if (!window.gapi || !window.google) {
        throw new Error('No se pudo inicializar Google API.');
      }

      await new Promise<void>((resolve) => {
        window.gapi!.load('client', async () => {
          await window.gapi!.client.init({
            discoveryDocs: [DISCOVERY_DOC],
          });
          resolve();
        });
      });

      tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: SCOPES,
        callback: () => undefined,
      });

      updateAuthState();
    })()
      .catch((initError: unknown) => {
        const msg = getErrorMessage(initError);
        setError(msg);
        throw initError;
      })
      .finally(() => {
        setIsLoading(false);
      });

    return initPromiseRef.current;
  }, [updateAuthState]);

  const requestAccessToken = useCallback(async (): Promise<void> => {
    await initializeGoogleApi();

    if (!tokenClientRef.current || !window.gapi) {
      throw new Error('El cliente de Google no se ha inicializado. Por favor recarga la página.');
    }

    return new Promise((resolve, reject) => {
      tokenClientRef.current!.callback = (resp: GoogleTokenResponse) => {
        if (resp.error) {
          const msg = resp.error_description || resp.error;
          setError(msg);
          setIsAuthenticated(false);
          reject(new Error(msg));
          return;
        }

        setError(null);
        setIsAuthenticated(true);
        resolve();
      };

      const existingToken = window.gapi!.client.getToken();
      tokenClientRef.current!.requestAccessToken({ prompt: existingToken ? '' : 'consent' });
    });
  }, [initializeGoogleApi]);

  const syncScheduleToCalendar = useCallback(
    async (schedule: Schedule, semesterStart: Date, semesterEnd: Date): Promise<SyncResult> => {
      try {
        await requestAccessToken();

        if (!window.gapi) {
          throw new Error('Google API no está disponible.');
        }

        const calendarTitle = `Horario UTM - ${schedule.academic_period || 'Clases'}`;
        const calendarRes = await window.gapi.client.calendar.calendars.insert({
          resource: {
            summary: calendarTitle,
            description: `Horario generado por Inforario para la Facultad: ${schedule.faculty || 'General'}`,
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
        });

        const calendarId = calendarRes.result.id;
        if (!calendarId) {
          throw new Error('No se pudo crear el calendario en Google.');
        }

        const batch = window.gapi.client.newBatch();

        const untilDate = new Date(semesterEnd);
        untilDate.setHours(23, 59, 59);
        const untilStr = untilDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

        let eventCount = 0;

        schedule.sessions.forEach((session) => {
          if (session.conflict || session.isVirtual || !session.day || !session.startTime || !session.endTime) return;

          const firstDate = getFirstDateOfDay(semesterStart, session.day);
          if (firstDate > semesterEnd) return;

          const [startH, startM] = session.startTime.split(':').map(Number);
          const [endH, endM] = session.endTime.split(':').map(Number);

          const startDateTime = new Date(firstDate);
          startDateTime.setHours(startH, startM, 0);

          const endDateTime = new Date(firstDate);
          endDateTime.setHours(endH, endM, 0);

          const request = window.gapi!.client.calendar.events.insert({
            calendarId,
            resource: {
              summary: session.subject,
              location: session.location,
              description: `Docente: ${session.teacher}`,
              start: {
                dateTime: startDateTime.toISOString(),
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              },
              end: {
                dateTime: endDateTime.toISOString(),
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              },
              recurrence: [`RRULE:FREQ=WEEKLY;UNTIL=${untilStr}`],
              reminders: {
                useDefault: false,
                overrides: [{ method: 'popup', minutes: 15 }],
              },
              colorId: '5',
            },
          });

          batch.add(request);
          eventCount++;
        });

        if (eventCount > 0) {
          await batch;
        }

        return {
          success: true,
          message: `Calendario "${calendarTitle}" creado con éxito con ${eventCount} clases recurrentes.`,
        };
      } catch (syncError: unknown) {
        console.error('Calendar Sync Error:', syncError);
        const msg = getErrorMessage(syncError);
        setError(msg);
        return { success: false, message: msg };
      }
    },
    [requestAccessToken]
  );

  useEffect(() => {
    void initializeGoogleApi();
  }, [initializeGoogleApi]);

  return {
    isLoading,
    isAuthenticated,
    error,
    initializeGoogleApi,
    syncScheduleToCalendar,
  };
};