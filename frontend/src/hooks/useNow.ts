import { useEffect, useState } from 'react';

/** Hora actual, actualizada cada minuto (para los estados Ahora / Siguiente). */
export const useNow = (intervalMs = 60_000): Date => {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
};
