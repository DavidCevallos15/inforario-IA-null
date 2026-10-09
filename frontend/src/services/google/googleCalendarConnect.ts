import { GOOGLE_CLIENT_ID } from '../../constants';
import { supabase } from '../supabase/supabaseClient';

// Permiso mínimo necesario: crear eventos (no leer ni administrar calendarios)
const CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.events';
const GIS_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

interface CodeResponse {
  code?: string;
  error?: string;
  error_description?: string;
}

interface GoogleIdentity {
  accounts: {
    oauth2: {
      initCodeClient: (config: {
        client_id: string;
        scope: string;
        ux_mode: 'popup';
        callback: (response: CodeResponse) => void;
        error_callback?: (error: { type: string; message?: string }) => void;
      }) => { requestCode: () => void };
    };
  };
}

declare global {
  interface Window {
    google?: GoogleIdentity;
  }
}

let gisPromise: Promise<GoogleIdentity> | null = null;

const loadGoogleIdentity = (): Promise<GoogleIdentity> => {
  if (window.google?.accounts?.oauth2) return Promise.resolve(window.google);
  gisPromise ??= new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = GIS_SCRIPT_SRC;
    script.async = true;
    script.onload = () => (window.google ? resolve(window.google) : reject(new Error('Google Identity no disponible.')));
    script.onerror = () => {
      gisPromise = null;
      reject(new Error('No se pudo cargar el servicio de Google. Revisa tu conexión o bloqueadores.'));
    };
    document.head.appendChild(script);
  });
  return gisPromise;
};

/** Abre el popup de consentimiento de Google y devuelve un código de autorización de un solo uso. */
const requestAuthorizationCode = async (): Promise<string> => {
  const google = await loadGoogleIdentity();

  return new Promise((resolve, reject) => {
    const client = google.accounts.oauth2.initCodeClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: CALENDAR_SCOPE,
      ux_mode: 'popup',
      callback: (response) => {
        if (response.code) resolve(response.code);
        else reject(new Error(response.error_description || response.error || 'Google no devolvió autorización.'));
      },
      error_callback: (error) => {
        reject(new Error(error.type === 'popup_closed' ? 'Se cerró la ventana de Google.' : error.message || 'Error de Google.'));
      },
    });
    client.requestCode();
  });
};

/**
 * Vincula Google Calendar a la cuenta: el código se canjea en la Edge Function
 * `google-calendar-connect`, que guarda los tokens en el servidor. El navegador
 * nunca ve ni escribe el refresh token.
 */
export const connectGoogleCalendar = async (): Promise<void> => {
  const code = await requestAuthorizationCode();

  const { data, error } = await supabase.functions.invoke<{ success: boolean; message: string }>(
    'google-calendar-connect',
    { body: { code } }
  );

  if (error) throw new Error(error.message || 'No se pudo vincular Google Calendar.');
  if (!data?.success) throw new Error(data?.message || 'No se pudo vincular Google Calendar.');
};
