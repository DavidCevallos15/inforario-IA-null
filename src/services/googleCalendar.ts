import { GOOGLE_CLIENT_ID } from '../constants';
import { Schedule, ClassSession, DAYS } from '../types';

declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/calendar';

let tokenClient: any;
let gapiInited = false;
let gisInited = false;

// Initialize the Google API client library
export const initializeGoogleApi = async (): Promise<void> => {
  return new Promise((resolve) => {
    // Check if scripts are loaded
    const checkGapi = setInterval(() => {
      if (typeof window.gapi !== 'undefined' && typeof window.google !== 'undefined') {
        clearInterval(checkGapi);
        
        window.gapi.load('client', async () => {
          await window.gapi.client.init({
            discoveryDocs: [DISCOVERY_DOC],
          });
          gapiInited = true;
          if (gisInited) resolve();
        });

        tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: SCOPES,
          callback: '', // defined later
        });
        gisInited = true;
        if (gapiInited) resolve();
      }
    }, 100);
  });
};

// Request Access Token
export const requestAccessToken = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!tokenClient) {
        // Fallback or retry init
        reject("El cliente de Google no se ha inicializado. Por favor recarga la página.");
        return;
    }
    
    tokenClient.callback = async (resp: any) => {
      if (resp.error !== undefined) {
        reject(resp);
      }
      resolve();
    };

    if (window.gapi.client.getToken() === null) {
      // Prompt the user to select a Google Account and ask for consent to share their data
      // when establishing a new session.
      tokenClient.requestAccessToken({prompt: 'consent'});
    } else {
      // Skip display of account chooser and consent dialog for an existing session.
      tokenClient.requestAccessToken({prompt: ''});
    }
  });
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

// Main Sync Function
export const syncScheduleToCalendar = async (
  schedule: Schedule, 
  semesterStart: Date, 
  semesterEnd: Date
): Promise<{ success: boolean; message: string }> => {
  try {
    if (!GOOGLE_CLIENT_ID) {
        throw new Error("Falta el ID de Cliente de Google en la configuración.");
    }
    
    await requestAccessToken();

    // 1. Create a dedicated Calendar
    const calendarTitle = `Horario UTM - ${schedule.academic_period || 'Clases'}`;
    const calendarRes = await window.gapi.client.calendar.calendars.insert({
      resource: {
        summary: calendarTitle,
        description: `Horario generado por Inforario para la Facultad: ${schedule.faculty || 'General'}`,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      }
    });
    
    const calendarId = calendarRes.result.id;
    
    // 2. Prepare Events Batch
    const batch = window.gapi.client.newBatch();
    
    // Format End Date for Recurrence Rule (YYYYMMDDTHHMMSSZ)
    // Add 1 day to end date to ensure the last day is included in UNTIL
    const untilDate = new Date(semesterEnd);
    untilDate.setHours(23, 59, 59);
    const untilStr = untilDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    let eventCount = 0;

    schedule.sessions.forEach((session) => {
      if (session.conflict) return; // Skip conflicts

      const firstDate = getFirstDateOfDay(semesterStart, session.day);
      
      // Stop if first date is after semester end
      if (firstDate > semesterEnd) return;

      const [startH, startM] = session.startTime.split(':').map(Number);
      const [endH, endM] = session.endTime.split(':').map(Number);

      const startDateTime = new Date(firstDate);
      startDateTime.setHours(startH, startM, 0);

      const endDateTime = new Date(firstDate);
      endDateTime.setHours(endH, endM, 0);

      const event = {
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
        recurrence: [
          `RRULE:FREQ=WEEKLY;UNTIL=${untilStr}`
        ],
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'popup', minutes: 15 }
          ]
        },
        colorId: '5' // Yellow/Orange default, could map colors later
      };

      const request = window.gapi.client.calendar.events.insert({
        calendarId: calendarId,
        resource: event
      });
      
      batch.add(request);
      eventCount++;
    });

    if (eventCount > 0) {
      await batch.then();
    }

    return { success: true, message: `Calendario "${calendarTitle}" creado con éxito con ${eventCount} clases recurrentes.` };

  } catch (error: any) {
    console.error("Calendar Sync Error:", error);
    return { success: false, message: error.message || "Error al sincronizar con Google Calendar." };
  }
};