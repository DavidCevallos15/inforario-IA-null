import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

type RawSession = {
  subject?: unknown;
  teacher?: unknown;
  day?: unknown;
  startTime?: unknown;
  endTime?: unknown;
  location?: unknown;
  floor?: unknown;
  isVirtual?: unknown;
};

type ExtractedPayload = {
  sessions?: unknown;
};

const ALLOWED_DAYS = new Set(['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']);
const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;
// La función es pública (verify_jwt = false): limitar la entrada evita gastar
// la cuota de Groq con textos arbitrariamente grandes. Un reporte SGU ronda 3–8k caracteres.
const MAX_PDF_TEXT_CHARS = 40_000;

const json = (status: number, payload: unknown) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const normalizeString = (value: unknown, fallback: string) => {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
};

const isValidDay = (day: string | undefined) => !!day && ALLOWED_DAYS.has(day);
const isValidTime = (time: string | undefined) => !!time && TIME_REGEX.test(time);
const isVirtualLike = (value: unknown) => String(value ?? '').toUpperCase().includes('VIRTUAL');

const validateSessions = (sessions: unknown) => {
  if (!Array.isArray(sessions)) {
    throw new Error('La respuesta del modelo no contiene un arreglo en sessions.');
  }

  return sessions
    .map((session): RawSession => {
      if (!session || typeof session !== 'object') {
        return {};
      }
      return session as RawSession;
    })
    .map((session) => ({
      subject: normalizeString(session.subject, ''),
      teacher: normalizeString(session.teacher, 'N/A'),
      day: normalizeString(session.day, ''),
      startTime: normalizeString(session.startTime, ''),
      endTime: normalizeString(session.endTime, ''),
      location: normalizeString(session.location, 'Virtual'),
      floor: normalizeString(session.floor, 'N/A'),
      isVirtual:
        session.isVirtual === true ||
        isVirtualLike(session.location) ||
        (!normalizeString(session.day, '') &&
          !normalizeString(session.startTime, '') &&
          !normalizeString(session.endTime, '')),
    }))
    .map((session) => ({
      ...session,
      day: session.isVirtual ? undefined : session.day,
      startTime: session.isVirtual ? undefined : session.startTime,
      endTime: session.isVirtual ? undefined : session.endTime,
      location: session.isVirtual ? 'Virtual' : session.location,
    }))
    .filter(
      (session) =>
        session.subject &&
        (session.isVirtual ||
          (isValidDay(session.day) &&
            isValidTime(session.startTime) &&
            isValidTime(session.endTime)))
    );
};

const systemPrompt = [
  'Eres un experto extrayendo horarios universitarios. Convierte el texto en un JSON estricto.',
  '',
  'REGLAS ABSOLUTAS:',
  '1. Devuelve ÚNICAMENTE un JSON válido con la clave raíz "sessions" que contenga un arreglo.',
  '2. Cada objeto DEBE tener esta estructura:',
  '  - "subject": (string) Nombre de la materia.',
  '  - "teacher": (string) Nombre del docente ("N/A" si no hay).',
  '  - "day": (string, opcional en virtual) Día ("Lunes", "Martes", "Miércoles", "Jueves", "Viernes").',
  '  - "startTime": (string, opcional en virtual) Hora inicio "HH:MM".',
  '  - "endTime": (string, opcional en virtual) Hora fin "HH:MM".',
  '  - "location": (string) Aula. Si es virtual, usa "Virtual".',
  '  - "floor": (string) Piso. Si es virtual, usa "N/A".',
  '  - "isVirtual": (boolean) Pon true SI EL TEXTO DICE EXPRESAMENTE "MATERIA VIRTUAL" o no tiene horario asignado. Pon false si es presencial.',
  '3. NO ignores las materias virtuales, extráelas pero asegúrate de poner isVirtual en true.',
  '',
  'REGLAS ESTRICTAS PARA EL NOMBRE DE LA ASIGNATURA (subject):',
  '1. Extrae SOLO el nombre real de la materia.',
  '2. PROHIBIDO anteponer prefijos como "TECNOLOGÍAS DE LA " o el nombre de la carrera.',
  '3. PROHIBIDO incluir la malla curricular o sufijos entre paréntesis como "(A19)", "(ITINERARIO)" o "(VIRTUAL)".',
  'Ejemplo correcto: "SISTEMAS DISTRIBUIDOS"',
  'Ejemplo INCORRECTO: "TECNOLOGÍAS DE LA SISTEMAS DISTRIBUIDOS (A19)"',
].join('\n');

// Límites de uso: por cliente (IP anonimizada) y global, para proteger la cuota de Groq
const PER_CLIENT_LIMIT = 15;
const GLOBAL_LIMIT = 300;
const RATE_WINDOW_SECONDS = 60 * 60;

const sha256Hex = async (value: string) => {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
};

/** Devuelve una respuesta 429 si se superó algún límite, o null si la petición puede seguir. */
const checkRateLimit = async (req: Request): Promise<Response | null> => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) {
    console.warn('[WARN] Sin credenciales de servicio: límite de uso desactivado');
    return null;
  }

  const admin = createClient(supabaseUrl, serviceRoleKey);
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  // Se guarda un hash, nunca la IP en claro
  const clientKey = `ip:${await sha256Hex(ip)}`;

  for (const [key, limit] of [[clientKey, PER_CLIENT_LIMIT], ['global', GLOBAL_LIMIT]] as const) {
    const { data: allowed, error } = await admin.rpc('consume_ai_extraction_quota', {
      p_client_key: key,
      p_limit: limit,
      p_window_seconds: RATE_WINDOW_SECONDS,
    });
    if (error) {
      // Si el control falla no se bloquea al estudiante: el parser local es el respaldo igualmente
      console.error('[ERROR] Límite de uso no disponible', error.message);
      return null;
    }
    if (allowed === false) {
      return json(429, { error: 'Demasiadas solicitudes. Intenta de nuevo más tarde.' });
    }
  }
  return null;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  console.log(`[LOG] Recibida petición: ${req.method} ${req.url}`);

  if (req.method !== 'POST') {
    console.error('[ERROR] Método no permitido');
    return json(405, { error: 'Método no permitido.' });
  }

  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return json(400, { error: 'El cuerpo debe ser JSON válido.' });
    }
    const { pdfText } = (body ?? {}) as { pdfText?: unknown };

    if (typeof pdfText !== 'string' || !pdfText.trim()) {
      console.error('[ERROR] Falta pdfText');
      return json(400, { error: 'pdfText es obligatorio.' });
    }

    if (pdfText.length > MAX_PDF_TEXT_CHARS) {
      return json(413, { error: `pdfText excede ${MAX_PDF_TEXT_CHARS} caracteres.` });
    }

    const groqApiKey = Deno.env.get('GROQ_API_KEY');
    const groqModel = Deno.env.get('GROQ_MODEL') || 'llama-3.3-70b-versatile';

    if (!groqApiKey) {
      console.error('[ERROR] Falta GROQ_API_KEY');
      return json(500, { error: 'Falta GROQ_API_KEY' });
    }

    const rateLimit = await checkRateLimit(req);
    if (rateLimit) return rateLimit;

    console.log('[LOG] Llamando a Groq...');

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: groqModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Extrae el horario del siguiente texto:\n${pdfText}` },
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMessage = data?.error?.message || 'Error al llamar a Groq.';
      console.error('[ERROR] Groq respondió con error', {
        status: response.status,
        message: errorMessage,
      });
      return json(502, { error: errorMessage });
    }

    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== 'string' || !content.trim()) {
      console.error('[ERROR] Groq respondió sin contenido parseable');
      return json(502, { error: 'Groq respondió sin contenido parseable.' });
    }

    let parsed: ExtractedPayload;
    try {
      parsed = JSON.parse(content) as ExtractedPayload;
    } catch {
      console.error('[ERROR] Groq devolvió contenido no JSON', { length: content.length });
      return json(502, { error: 'Groq devolvió contenido no JSON.' });
    }

    const sessions = validateSessions(parsed.sessions);
    console.log(`[LOG] Extracción correcta. Sesiones válidas: ${sessions.length}`);

    return json(200, { sessions });
  } catch (error) {
    console.error('[CRITICAL ERROR]', error);
    const message = error instanceof Error ? error.message : 'Error inesperado.';
    return json(500, { error: message });
  }
});
