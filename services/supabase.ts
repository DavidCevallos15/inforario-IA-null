import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL as DEFAULT_SUPABASE_URL, SUPABASE_KEY as DEFAULT_SUPABASE_KEY } from '../constants';
import { UserProfile, Schedule } from '../types';

// --- Client Initialization ---

const activeUrl = DEFAULT_SUPABASE_URL;
const activeKey = DEFAULT_SUPABASE_KEY;

// Robust initialization: fallback to a dummy object if keys are missing to prevent white-screen crashes.
const isConfigured = !!(activeUrl && activeKey && !activeUrl.includes("placeholder"));

// Dummy builder that allows chaining for any operation without crashing
const createDummyBuilder = () => {
  const errorResult = { data: null, error: { message: "Database not configured" } };
  const promise = Promise.resolve(errorResult);

  const builder: any = {
    select: () => builder,
    insert: () => builder,
    update: () => builder,
    delete: () => builder,
    eq: () => builder,
    neq: () => builder,
    gt: () => builder,
    lt: () => builder,
    gte: () => builder,
    lte: () => builder,
    in: () => builder,
    is: () => builder,
    like: () => builder,
    ilike: () => builder,
    contains: () => builder,
    match: () => builder,
    order: () => builder,
    limit: () => builder,
    single: () => promise,
    maybeSingle: () => promise,
    // Complete Promise Interface to ensure await works correctly
    then: (onfulfilled?: (value: any) => any, onrejected?: (reason: any) => any) => promise.then(onfulfilled, onrejected),
    catch: (onrejected?: (reason: any) => any) => promise.catch(onrejected),
    finally: (onfinally?: (() => void) | null) => promise.finally(onfinally)
  };
  return builder;
};

let client: any = null;
try {
  if (isConfigured) {
    client = createClient(activeUrl, activeKey);
  }
} catch (e) {
  console.error("Critical: Supabase client initialization failed:", e);
  client = null;
}

// Ensure the exported supabase object has the expected structure even if client fails
export const supabase = client || {
  from: () => createDummyBuilder(),
  auth: {
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } }, error: null }),
    signInWithPassword: () => Promise.resolve({ error: { message: "Database not configured" } }),
    signUp: () => Promise.resolve({ error: { message: "Database not configured" } }),
    resetPasswordForEmail: () => Promise.resolve({ error: { message: "Database not configured" } }),
    signInWithOAuth: () => Promise.resolve({ error: { message: "Database not configured" } }),
    signOut: () => Promise.resolve({ error: null })
  }
} as any;

export const isSupabaseConfigured = () => {
  return isConfigured && !!client;
};

// --- Database Operations ---

export const saveScheduleToDB = async (userId: string, schedule: Schedule) => {
  if (!isSupabaseConfigured()) return null;

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
  } catch (err: any) {
    console.error("Save schedule error:", err);
    return null;
  }
};

export const getUserSchedules = async (userId: string) => {
  if (!isSupabaseConfigured()) return [];

  try {
    const { data, error } = await supabase
      .from('schedules')
      .select('id, title, academic_period, last_updated')
      .eq('user_id', userId)
      .order('last_updated', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (err: any) {
    console.error("Get schedules error:", err);
    return [];
  }
};

export const getScheduleById = async (scheduleId: string) => {
  if (!isSupabaseConfigured()) return null;

  try {
    const { data, error } = await supabase
      .from('schedules')
      .select('*')
      .eq('id', scheduleId)
      .single();

    if (error) throw error;
    return data;
  } catch (err: any) {
    console.error("Get schedule by ID error:", err);
    return null;
  }
};

export const deleteSchedule = async (scheduleId: string) => {
  if (!isSupabaseConfigured()) return;

  try {
    const { error } = await supabase
      .from('schedules')
      .delete()
      .eq('id', scheduleId);

    if (error) throw error;
  } catch (err: any) {
    console.error("Delete error:", err);
    if (err.message && (err.message.includes("Invalid login credentials") || err.message.includes("JWT"))) {
      throw new Error("Credenciales inválidas o sesión expirada. Por favor cierra sesión y vuelve a ingresar.");
    }
    if (err.message === "Script error.") {
      throw new Error("Error de conexión. Por favor verifica tu internet o intenta más tarde.");
    }
    throw err;
  }
};

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  if (!isSupabaseConfigured()) return null;

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) return null;
    return data;
  } catch (err: any) {
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
}
