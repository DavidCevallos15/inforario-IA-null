import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_URL as DEFAULT_SUPABASE_URL, SUPABASE_KEY as DEFAULT_SUPABASE_KEY } from '../constants';
import type { UserProfile, Schedule, DatabaseSchedule, DatabaseProfile, ApiResponse } from '../types';

// ============================================
// CONFIGURATION
// ============================================

const activeUrl = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const activeKey = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_KEY;

const isConfigured = !!(activeUrl && activeKey && !activeUrl.includes("placeholder"));

// ============================================
// ERROR TYPES
// ============================================

export class SupabaseError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly originalError?: unknown
  ) {
    super(message);
    this.name = 'SupabaseError';
  }
}

export class AuthenticationError extends SupabaseError {
  constructor(message: string, originalError?: unknown) {
    super(message, 'AUTH_ERROR', originalError);
    this.name = 'AuthenticationError';
  }
}

export class NetworkError extends SupabaseError {
  constructor(message: string, originalError?: unknown) {
    super(message, 'NETWORK_ERROR', originalError);
    this.name = 'NetworkError';
  }
}

// ============================================
// RETRY LOGIC
// ============================================

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

async function withRetry<T>(
  operation: () => Promise<T>,
  retries = MAX_RETRIES
): Promise<T> {
  let lastError: unknown;
  
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      
      // Don't retry auth errors or validation errors
      if (
        error?.message?.includes('Invalid login') ||
        error?.message?.includes('JWT') ||
        error?.code === '400'
      ) {
        throw error;
      }
      
      // Wait before retrying (exponential backoff)
      if (attempt < retries - 1) {
        await new Promise(resolve => 
          setTimeout(resolve, RETRY_DELAY_MS * Math.pow(2, attempt))
        );
      }
    }
  }
  
  throw lastError;
}

// ============================================
// DUMMY CLIENT FOR UNCONFIGURED STATE
// ============================================

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
    then: (onfulfilled?: (value: any) => any, onrejected?: (reason: any) => any) => promise.then(onfulfilled, onrejected),
    catch: (onrejected?: (reason: any) => any) => promise.catch(onrejected),
    finally: (onfinally?: (() => void) | null) => promise.finally(onfinally)
  };
  return builder;
};

// ============================================
// CLIENT INITIALIZATION
// ============================================

let client: SupabaseClient | null = null;

try {
  if (isConfigured) {
    client = createClient(activeUrl, activeKey);
  }
} catch (e) {
  console.error("Critical: Supabase client initialization failed:", e);
  client = null;
}

export const supabase = client || {
  from: () => createDummyBuilder(),
  functions: {
    invoke: () => Promise.resolve({ data: null, error: { message: "Database not configured" } })
  },
  auth: {
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    getUser: () => Promise.resolve({ data: { user: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } }, error: null }),
    signInWithPassword: () => Promise.resolve({ error: { message: "Database not configured" } }),
    signUp: () => Promise.resolve({ error: { message: "Database not configured" } }),
    resetPasswordForEmail: () => Promise.resolve({ error: { message: "Database not configured" } }),
    signInWithOAuth: () => Promise.resolve({ error: { message: "Database not configured" } }),
    signOut: () => Promise.resolve({ error: null })
  }
} as any;

export const isSupabaseConfigured = (): boolean => {
  return isConfigured && !!client;
};

// ============================================
// VALIDATION HELPERS
// ============================================

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isUUID = (id: string): boolean => UUID_REGEX.test(id);

const validateScheduleData = (schedule: Schedule): boolean => {
  if (!schedule.title || typeof schedule.title !== 'string') {
    return false;
  }
  if (!Array.isArray(schedule.sessions)) {
    return false;
  }
  return true;
};

// ============================================
// DATABASE OPERATIONS
// ============================================

export const saveScheduleToDB = async (
  userId: string, 
  schedule: Schedule
): Promise<DatabaseSchedule[] | null> => {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase not configured, skipping save');
    return null;
  }
  
  if (!isUUID(userId)) {
    console.warn('Invalid user ID format, skipping save');
    return null;
  }

  if (!validateScheduleData(schedule)) {
    throw new SupabaseError('Invalid schedule data');
  }

  return withRetry(async () => {
    if (schedule.id) {
      // Update existing schedule
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

      if (error) {
        throw new SupabaseError(error.message, error.code);
      }
      return data;
    } else {
      // Insert new schedule
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

      if (error) {
        throw new SupabaseError(error.message, error.code);
      }
      return data;
    }
  });
};

export const getUserSchedules = async (
  userId: string
): Promise<Partial<DatabaseSchedule>[]> => {
  if (!isSupabaseConfigured() || !userId) {
    return [];
  }
  
  if (!isUUID(userId)) {
    console.log("Guest user: skipping remote database query");
    return [];
  }

  return withRetry(async () => {
    const { data, error } = await supabase
      .from('schedules')
      .select('id, title, academic_period, last_updated')
      .eq('user_id', userId)
      .order('last_updated', { ascending: false });

    if (error) {
      throw new SupabaseError(error.message, error.code);
    }
    return data || [];
  });
};

export const getScheduleById = async (
  scheduleId: string
): Promise<DatabaseSchedule | null> => {
  if (!isSupabaseConfigured()) {
    return null;
  }

  if (!isUUID(scheduleId)) {
    throw new SupabaseError('Invalid schedule ID format');
  }

  return withRetry(async () => {
    const { data, error } = await supabase
      .from('schedules')
      .select('*')
      .eq('id', scheduleId)
      .single();

    if (error) {
      throw new SupabaseError(error.message, error.code);
    }
    return data;
  });
};

export const deleteSchedule = async (scheduleId: string): Promise<void> => {
  if (!isSupabaseConfigured()) {
    return;
  }

  if (!isUUID(scheduleId)) {
    throw new SupabaseError('Invalid schedule ID format');
  }

  return withRetry(async () => {
    const { error } = await supabase
      .from('schedules')
      .delete()
      .eq('id', scheduleId);

    if (error) {
      // Handle specific error types
      if (error.message?.includes('Invalid login credentials') || error.message?.includes('JWT')) {
        throw new AuthenticationError(
          'Credenciales invalidas o sesion expirada. Por favor cierra sesion y vuelve a ingresar.'
        );
      }
      if (error.message === 'Script error.') {
        throw new NetworkError(
          'Error de conexion. Por favor verifica tu internet o intenta mas tarde.'
        );
      }
      throw new SupabaseError(error.message, error.code);
    }
  });
};

export const getUserProfile = async (
  userId: string
): Promise<UserProfile | null> => {
  if (!isSupabaseConfigured()) {
    return null;
  }
  
  if (!isUUID(userId)) {
    return null;
  }

  return withRetry(async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      // Profile might not exist yet, don't throw
      return null;
    }
    return data;
  });
};

// ============================================
// AUTHENTICATION HELPERS
// ============================================

export const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin }
  });
  
  if (error) {
    throw new AuthenticationError(error.message, error);
  }
  return data;
};

export const signInWithEmail = async (email: string, password: string) => {
  // Validate input
  if (!email || !password) {
    throw new AuthenticationError('Email y contrasena son requeridos');
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  
  if (error) {
    throw new AuthenticationError(error.message, error);
  }
  return data;
};

export const signUpWithEmail = async (
  email: string, 
  password: string, 
  fullName: string
) => {
  // Validate input
  if (!email || !password) {
    throw new AuthenticationError('Email y contrasena son requeridos');
  }
  if (password.length < 6) {
    throw new AuthenticationError('La contrasena debe tener al menos 6 caracteres');
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: window.location.origin,
      data: { full_name: fullName }
    }
  });
  
  if (error) {
    throw new AuthenticationError(error.message, error);
  }
  return data;
};

export const resetPasswordForEmail = async (email: string) => {
  if (!email) {
    throw new AuthenticationError('Email es requerido');
  }

  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin,
  });
  
  if (error) {
    throw new AuthenticationError(error.message, error);
  }
  return data;
};
