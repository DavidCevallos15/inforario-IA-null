import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL as DEFAULT_SUPABASE_URL, SUPABASE_KEY as DEFAULT_SUPABASE_KEY } from '../../constants';
import { UserProfile, Schedule, ClassSession, DBResponseSchedule, ScheduleSummary } from '../../types';
import { mapEdgeSessions, ExtractScheduleEdgeResponse } from '../../features/uploader/utils/edgeSessionMapper';

// --- Client Initialization ---

// Priorizar variables de entorno de Vite (.env.local) sobre las constantes por defecto
const activeUrl = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const activeKey = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_KEY;

export const supabase = createClient(activeUrl, activeKey);

export const isSupabaseConfigured = (): boolean => Boolean(activeUrl && activeKey);

// --- Database Operations ---

// Helper para validar si un string es un UUID válido
export const isUUID = (id: string) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

export const saveScheduleToDB = async (userId: string, schedule: Schedule) => {
  if (!isSupabaseConfigured() || !isUUID(userId)) return null;

  try {
    if (schedule.id) {
      // Update
      const { data, error } = await supabase
        .from('schedules')
        .update({
          title: schedule.title,
          academic_period: schedule.academic_period,
          schedule_data: schedule.sessions,
          faculty: schedule.faculty,
          last_updated: new Date().toISOString()
        })
        .eq('id', schedule.id)
        .eq('user_id', userId)
        .select();

      if (error) throw error;
      return data;
    } else {
      // Insert
      const { data, error } = await supabase
        .from('schedules')
        .insert({
          user_id: userId,
          title: schedule.title,
          academic_period: schedule.academic_period,
          schedule_data: schedule.sessions,
          faculty: schedule.faculty,
          last_updated: new Date().toISOString()
        })
        .select();

      if (error) throw error;
      return data;
    }
  } catch (err) {
    console.error("Save schedule error:", err);
    return null;
  }
};

export const getUserSchedules = async (userId: string): Promise<ScheduleSummary[]> => {
  if (!isSupabaseConfigured() || !userId) return [];
  
  // Si el ID es de desarrollo/invitado (no UUID), no consultamos la DB para evitar error 400
  if (!isUUID(userId)) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('schedules')
      .select('id, title, academic_period, last_updated')
      .eq('user_id', userId)
      .order('last_updated', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error("Get schedules error:", err);
    return [];
  }
};

export const getScheduleById = async (scheduleId: string): Promise<DBResponseSchedule | null> => {
  if (!isSupabaseConfigured()) return null;

  try {
    const { data, error } = await supabase
      .from('schedules')
      .select('*')
      .eq('id', scheduleId)
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error("Get schedule by ID error:", err);
    return null;
  }
};

const toFriendlyDeleteError = (err: { message?: string }): Error => {
  const message = err.message || '';
  if (message.includes("Invalid login credentials") || message.includes("JWT")) {
    return new Error("Credenciales inválidas o sesión expirada. Por favor cierra sesión y vuelve a ingresar.");
  }
  if (message === "Script error." || message.includes("Failed to fetch")) {
    return new Error("Error de conexión. Por favor verifica tu internet o intenta más tarde.");
  }
  return new Error(message || "No se pudo eliminar el horario.");
};

/** Elimina uno o varios horarios en una sola petición. */
export const deleteSchedules = async (scheduleIds: string[]): Promise<void> => {
  if (!isSupabaseConfigured() || scheduleIds.length === 0) return;

  const { error } = await supabase.from('schedules').delete().in('id', scheduleIds);
  if (error) {
    console.error("Delete error:", error);
    throw toFriendlyDeleteError(error);
  }
};

export const deleteSchedule = (scheduleId: string) => deleteSchedules([scheduleId]);

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  if (!isSupabaseConfigured() || !isUUID(userId)) return null;

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) return null;
    return data;
  } catch (err) {
    console.error("Get profile error:", err);
    return null;
  }
};

// --- Authentication Helpers ---

export const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin }
  });
  if (error) throw error;
  return data;
};

export const signInWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
};

export const signUpWithEmail = async (email: string, password: string, fullName: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: window.location.origin,
      data: { full_name: fullName }
    }
  });
  if (error) throw error;
  return data;
};

export const resetPasswordForEmail = async (email: string) => {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin,
  });
  if (error) throw error;
  return data;
};

// --- AI Extraction Edge Service ---

/** Límite alineado con la Edge Function para evitar peticiones abusivas. */
export const MAX_AI_INPUT_CHARS = 40_000;

/**
 * Envía el texto plano del PDF a la Edge Function `extract-schedule` (Groq)
 * y devuelve las sesiones validadas.
 */
export const extractScheduleWithAI = async (pdfText: string): Promise<ClassSession[]> => {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase no está configurado para usar extracción por IA.');
  }
  if (!pdfText.trim()) {
    throw new Error('No se pudo extraer texto del PDF.');
  }
  if (pdfText.length > MAX_AI_INPUT_CHARS) {
    throw new Error('El documento es demasiado grande para la extracción por IA.');
  }

  const { data, error } = await supabase.functions.invoke<ExtractScheduleEdgeResponse>('extract-schedule', {
    body: { pdfText },
  });

  if (error) {
    throw new Error(error.message || 'No se pudo invocar extract-schedule.');
  }

  const payload = data ?? {};
  if (payload.error) {
    throw new Error(payload.error);
  }

  const sessions = mapEdgeSessions(payload);
  if (!sessions.length) {
    throw new Error('La IA no devolvió sesiones válidas.');
  }

  return sessions;
};
