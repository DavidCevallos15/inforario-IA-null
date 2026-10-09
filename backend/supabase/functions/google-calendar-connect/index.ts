import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// Canjea el código de autorización de Google (flujo "code" de Google Identity
// Services en modo popup) y guarda los tokens del usuario. Solo esta función y
// google-calendar-sync escriben en user_calendar_tokens (con service role).

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';

const json = (status: number, payload: unknown) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return json(405, { success: false, message: 'Método no permitido.' });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const googleClientId = Deno.env.get('GOOGLE_CLIENT_ID');
    const googleClientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');

    if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
      return json(500, { success: false, message: 'Faltan variables de entorno de Supabase.' });
    }
    if (!googleClientId || !googleClientSecret) {
      return json(500, { success: false, message: 'Faltan los secretos GOOGLE_CLIENT_ID o GOOGLE_CLIENT_SECRET.' });
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return json(401, { success: false, message: 'Falta el token de autenticación.' });
    }

    // Identificar al usuario con su propio JWT
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return json(401, { success: false, message: 'Usuario no autenticado.' });
    }

    const { code } = (await req.json().catch(() => ({}))) as { code?: unknown };
    if (typeof code !== 'string' || !code || code.length > 2048) {
      return json(400, { success: false, message: 'Código de autorización inválido.' });
    }

    const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: googleClientId,
        client_secret: googleClientSecret,
        // Valor requerido por Google para códigos obtenidos con ux_mode "popup"
        redirect_uri: 'postmessage',
        grant_type: 'authorization_code',
      }),
    });
    const tokens = await tokenResponse.json();

    if (!tokenResponse.ok || !tokens.access_token) {
      console.error('[google-calendar-connect] Error al canjear el código', tokens?.error);
      return json(400, {
        success: false,
        message: tokens?.error_description || 'Google rechazó la autorización. Intenta de nuevo.',
      });
    }

    const admin = createClient(supabaseUrl, serviceRoleKey);

    // Google solo envía refresh_token en el primer consentimiento: conservar el anterior si no llega
    const { data: existing } = await admin
      .from('user_calendar_tokens')
      .select('refresh_token')
      .eq('user_id', user.id)
      .maybeSingle();

    const expiresIn = Number(tokens.expires_in || 3600);
    const { error: upsertError } = await admin.from('user_calendar_tokens').upsert(
      {
        user_id: user.id,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token ?? existing?.refresh_token ?? null,
        expiry_date: new Date(Date.now() + expiresIn * 1000).toISOString(),
      },
      { onConflict: 'user_id' }
    );

    if (upsertError) {
      console.error('[google-calendar-connect] Error guardando tokens', upsertError.message);
      return json(500, { success: false, message: 'No se pudieron guardar los tokens.' });
    }

    return json(200, { success: true, message: 'Google Calendar vinculado correctamente.' });
  } catch (error) {
    console.error('[google-calendar-connect]', error);
    return json(500, { success: false, message: 'Error inesperado al vincular Google Calendar.' });
  }
});
