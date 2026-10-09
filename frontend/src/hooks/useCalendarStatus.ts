import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../services/supabase/supabaseClient';

interface UseCalendarStatusResult {
  isLinked: boolean;
  isLoading: boolean;
  error: string | null;
  refreshStatus: () => Promise<void>;
}

/**
 * Indica si el usuario autenticado ya vinculó Google Calendar. Solo lee la
 * existencia de la fila: los tokens se escriben exclusivamente desde el servidor.
 */
export const useCalendarStatus = (): UseCalendarStatusResult => {
  const [isLinked, setIsLinked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshStatus = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setIsLinked(false);
        return;
      }

      const { data, error: tokensError } = await supabase
        .from('user_calendar_tokens')
        .select('user_id')
        .eq('user_id', session.user.id)
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

  useEffect(() => {
    void refreshStatus();
  }, [refreshStatus]);

  return { isLinked, isLoading, error, refreshStatus };
};
