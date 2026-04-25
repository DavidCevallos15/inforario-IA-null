import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

type CalendarEventInput = {
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  recurrence?: string[];
};

type CalendarTokenRow = {
  user_id: string;
  access_token: string;
  refresh_token: string | null;
  expiry_date: string | null;
};

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_CALENDAR_BASE_URL = 'https://www.googleapis.com/calendar/v3';
const REFRESH_MARGIN_MS = 60 * 1000;

const json = (status: number, payload: unknown) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const needsRefresh = (expiryDate: string | null): boolean => {
  if (!expiryDate) return true;
  const parsed = Date.parse(expiryDate);
  if (Number.isNaN(parsed)) return true;
  return parsed <= Date.now() + REFRESH_MARGIN_MS;
};

const refreshGoogleAccessToken = async (
  refreshToken: string,
  clientId: string,
  clientSecret: string
): Promise<{ accessToken: string; expiryDate: string; refreshToken?: string }> => {
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  });

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error_description || data?.error || 'No se pudo refrescar el token de Google.');
  }

  const expiresIn = Number(data.expires_in || 3600);
  const expiryDate = new Date(Date.now() + expiresIn * 1000).toISOString();

  return {
    accessToken: data.access_token,
    expiryDate,
    refreshToken: data.refresh_token,
  };
};

const insertGoogleEvent = async (
  accessToken: string,
  calendarId: string,
  event: CalendarEventInput
) => {
  const response = await fetch(
    `${GOOGLE_CALENDAR_BASE_URL}/calendars/${encodeURIComponent(calendarId)}/events`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    const errorCode = data?.error?.code || response.status;
    const errorMessage = data?.error?.message || 'Error al crear evento en Google Calendar.';
    const err = new Error(errorMessage) as Error & { status?: number };
    err.status = Number(errorCode);
    throw err;
  }

  return {
    id: data.id,
    htmlLink: data.htmlLink,
  };
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return json(405, { success: false, message: 'Método no permitido.' });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const googleClientId = Deno.env.get('GOOGLE_CLIENT_ID');
    const googleClientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');

    if (!supabaseUrl || !supabaseAnonKey) {
      return json(500, { success: false, message: 'Faltan variables SUPABASE_URL o SUPABASE_ANON_KEY.' });
    }

    if (!googleClientId || !googleClientSecret) {
      return json(500, { success: false, message: 'Faltan secretos GOOGLE_CLIENT_ID o GOOGLE_CLIENT_SECRET.' });
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return json(401, { success: false, message: 'Falta el token de autenticación.' });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return json(401, { success: false, message: 'Usuario no autenticado.' });
    }

    const payload = (await req.json()) as { calendarId?: string; events?: CalendarEventInput[] };
    const calendarId = payload.calendarId || 'primary';
    const events = Array.isArray(payload.events) ? payload.events : [];

    if (!events.length) {
      return json(400, { success: false, message: 'Debes enviar al menos un evento.' });
    }

    const { data: tokenRow, error: tokenError } = await supabase
      .from('user_calendar_tokens')
      .select('user_id, access_token, refresh_token, expiry_date')
      .eq('user_id', user.id)
      .single();

    if (tokenError || !tokenRow) {
      return json(400, { success: false, message: 'No hay tokens de Google Calendar para este usuario. Conecta Google primero.' });
    }

    let tokens = tokenRow as CalendarTokenRow;

    if (needsRefresh(tokens.expiry_date)) {
      if (!tokens.refresh_token) {
        return json(400, {
          success: false,
          message: 'Tu cuenta no tiene refresh token. Reconecta Google Calendar para continuar.',
        });
      }

      const refreshed = await refreshGoogleAccessToken(tokens.refresh_token, googleClientId, googleClientSecret);

      const preservedRefreshToken = refreshed.refreshToken || tokens.refresh_token;

      const { error: updateError } = await supabase
        .from('user_calendar_tokens')
        .update({
          access_token: refreshed.accessToken,
          expiry_date: refreshed.expiryDate,
          refresh_token: preservedRefreshToken,
        })
        .eq('user_id', user.id);

      if (updateError) {
        return json(500, { success: false, message: 'No se pudieron actualizar los tokens refrescados.' });
      }

      tokens = {
        ...tokens,
        access_token: refreshed.accessToken,
        expiry_date: refreshed.expiryDate,
        refresh_token: preservedRefreshToken,
      };
    }

    const createdEvents: Array<{ id: string; htmlLink?: string }> = [];

    for (const event of events) {
      try {
        const created = await insertGoogleEvent(tokens.access_token, calendarId, event);
        createdEvents.push(created);
      } catch (insertError) {
        const status = (insertError as Error & { status?: number }).status;

        // Retry once on auth failure if we can refresh.
        if ((status === 401 || status === 403) && tokens.refresh_token) {
          const refreshed = await refreshGoogleAccessToken(tokens.refresh_token, googleClientId, googleClientSecret);
          const preservedRefreshToken = refreshed.refreshToken || tokens.refresh_token;

          const { error: updateError } = await supabase
            .from('user_calendar_tokens')
            .update({
              access_token: refreshed.accessToken,
              expiry_date: refreshed.expiryDate,
              refresh_token: preservedRefreshToken,
            })
            .eq('user_id', user.id);

          if (updateError) {
            throw new Error('No se pudo guardar el token refrescado después de un 401.');
          }

          tokens = {
            ...tokens,
            access_token: refreshed.accessToken,
            expiry_date: refreshed.expiryDate,
            refresh_token: preservedRefreshToken,
          };

          const created = await insertGoogleEvent(tokens.access_token, calendarId, event);
          createdEvents.push(created);
          continue;
        }

        throw insertError;
      }
    }

    return json(200, {
      success: true,
      message: `Se crearon ${createdEvents.length} evento(s) en Google Calendar.`,
      events: createdEvents,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error inesperado al sincronizar Google Calendar.';
    return json(500, { success: false, message });
  }
});
