import { useEffect, useRef } from 'react';
import type { User } from '@supabase/supabase-js';
import { Schedule } from '../types';
import { saveScheduleToDB } from '../services/supabase/supabaseClient';

const STORAGE_KEY = 'inforario_guest_schedule';

/** Horario del invitado guardado en este navegador (o null si no hay / está corrupto). */
export const loadGuestSchedule = (): Schedule | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Schedule;
    return Array.isArray(parsed?.sessions) && typeof parsed.title === 'string' ? parsed : null;
  } catch {
    return null;
  }
};

const storeGuestSchedule = (schedule: Schedule | null) => {
  try {
    if (schedule) localStorage.setItem(STORAGE_KEY, JSON.stringify(schedule));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Almacenamiento bloqueado o lleno: el horario sigue en memoria
  }
};

interface UseGuestScheduleSyncProps {
  sessionUser: User | null;
  currentSchedule: Schedule | null;
  setCurrentSchedule: React.Dispatch<React.SetStateAction<Schedule | null>>;
  onMigrated: (userId: string) => void;
}

/**
 * - Invitado: persiste el horario actual en localStorage para no perderlo al recargar.
 * - Al iniciar sesión: sube a la cuenta el horario que aún no tiene id en la BD.
 */
export const useGuestScheduleSync = ({
  sessionUser,
  currentSchedule,
  setCurrentSchedule,
  onMigrated,
}: UseGuestScheduleSyncProps) => {
  // Evita insertar dos veces el mismo horario (StrictMode ejecuta los efectos dos veces)
  const migratingRef = useRef<Schedule | null>(null);

  useEffect(() => {
    if (sessionUser) return;
    storeGuestSchedule(currentSchedule && !currentSchedule.id ? currentSchedule : null);
  }, [sessionUser, currentSchedule]);

  useEffect(() => {
    if (!sessionUser || !currentSchedule || currentSchedule.id) return;
    if (migratingRef.current === currentSchedule) return;
    migratingRef.current = currentSchedule;

    const userId = sessionUser.id;
    void saveScheduleToDB(userId, currentSchedule).then((saved) => {
      const id = saved?.[0]?.id as string | undefined;
      if (!id) return;
      storeGuestSchedule(null);
      setCurrentSchedule((prev) => (prev && !prev.id ? { ...prev, id } : prev));
      onMigrated(userId);
    });
  }, [sessionUser, currentSchedule, setCurrentSchedule, onMigrated]);
};
