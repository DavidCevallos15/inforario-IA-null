import { useCallback, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabase';

export interface CalendarTokens {
  access_token: string;
  refresh_token?: string | null;
  expiry_date?: string | null;
}

interface UseCalendarStatusResult {
  isLinked: boolean;
  isLoading: boolean;
  error: string | null;
  saveTokens: (tokens: CalendarTokens) => Promise<void>;
  refreshStatus: () => Promise<void>;
}

export const useCalendarStatus = (): UseCalendarStatusResult => {
  const [isLinked, setIsLinked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshStatus = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setIsLinked(false);
      setIsLoading(false);
      setError('Supabase no está configurado.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;
      if (!user) {
        setIsLinked(false);
        return;
      }

      const { data, error: tokensError } = await supabase
        .from('user_calendar_tokens')
        .select('user_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (tokensError) throw tokensError;
      setIsLinked(Boolean(data));
    } catch (statusError: unknown) {
      const msg = statusError instanceof Error ? statusError.message : 'No se pudo validar el estado de Google Calendar.';
      setError(msg);
      setIsLinked(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveTokens = useCallback(async (tokens: CalendarTokens) => {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase no está configurado.');
    }

    setError(null);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) throw userError;
    if (!user) throw new Error('Debes iniciar sesión para conectar Google Calendar.');

    const { data: existing, error: existingError } = await supabase
      .from('user_calendar_tokens')
      .select('refresh_token')
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingError) throw existingError;

    const refreshTokenToSave = tokens.refresh_token ?? existing?.refresh_token ?? null;

    const { error: upsertError } = await supabase
      .from('user_calendar_tokens')
      .upsert(
        {
          user_id: user.id,
          access_token: tokens.access_token,
          refresh_token: refreshTokenToSave,
          expiry_date: tokens.expiry_date ?? null,
        },
        { onConflict: 'user_id' }
      );

    if (upsertError) throw upsertError;

    setIsLinked(true);
  }, []);

  useEffect(() => {
    void refreshStatus();
  }, [refreshStatus]);

  return {
    isLinked,
    isLoading,
    error,
    saveTokens,
    refreshStatus,
  };
};
