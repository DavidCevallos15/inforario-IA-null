import { useState, useCallback } from 'react';
import { 
  Schedule, 
  ClassSession, 
  SavedSchedule, 
  LoadingState,
  createScheduleId 
} from '../types';
import {
  saveScheduleToDB,
  getUserSchedules,
  getScheduleById,
  deleteSchedule as deleteScheduleFromDB,
} from '../services/supabase';

interface UseScheduleReturn {
  // Current schedule state
  currentSchedule: Schedule | null;
  setCurrentSchedule: React.Dispatch<React.SetStateAction<Schedule | null>>;
  
  // Saved schedules
  savedSchedules: SavedSchedule[];
  schedulesState: LoadingState<SavedSchedule[]>;
  
  // Actions
  fetchSchedules: (userId: string) => Promise<void>;
  openSchedule: (id: string) => Promise<void>;
  saveSchedule: (userId: string, schedule: Schedule) => Promise<Schedule | null>;
  deleteSchedule: (id: string) => Promise<boolean>;
  bulkDeleteSchedules: (ids: string[]) => Promise<void>;
  updateScheduleTitle: (userId: string, title: string) => Promise<void>;
  updateSessionColor: (userId: string, subject: string, color: string) => Promise<void>;
  clearCurrentSchedule: () => void;
}

export function useSchedule(): UseScheduleReturn {
  const [currentSchedule, setCurrentSchedule] = useState<Schedule | null>(null);
  const [savedSchedules, setSavedSchedules] = useState<SavedSchedule[]>([]);
  const [schedulesState, setSchedulesState] = useState<LoadingState<SavedSchedule[]>>({ status: 'idle' });

  // Fetch all schedules for a user
  const fetchSchedules = useCallback(async (userId: string) => {
    setSchedulesState({ status: 'loading' });
    try {
      const data = await getUserSchedules(userId);
      const schedules = (data || []).map((s: any) => ({
        ...s,
        id: createScheduleId(s.id),
      })) as SavedSchedule[];
      setSavedSchedules(schedules);
      setSchedulesState({ status: 'success', data: schedules });
    } catch (err) {
      console.error('Error fetching schedules:', err);
      setSchedulesState({ status: 'error', error: 'Error al cargar horarios' });
    }
  }, []);

  // Open a specific schedule by ID
  const openSchedule = useCallback(async (id: string) => {
    try {
      const fullSchedule = await getScheduleById(id);
      if (fullSchedule && fullSchedule.schedule_data) {
        setCurrentSchedule({
          id: createScheduleId(fullSchedule.id),
          title: fullSchedule.title,
          academic_period: fullSchedule.academic_period,
          faculty: fullSchedule.faculty,
          sessions: fullSchedule.schedule_data,
          lastUpdated: new Date(),
        });
      }
    } catch (e) {
      console.error('Error opening schedule:', e);
      throw new Error('Error al abrir el horario');
    }
  }, []);

  // Save a schedule (create or update)
  const saveSchedule = useCallback(async (userId: string, schedule: Schedule): Promise<Schedule | null> => {
    try {
      const saved = await saveScheduleToDB(userId, schedule);
      if (saved && saved[0]) {
        const updatedSchedule = { 
          ...schedule, 
          id: createScheduleId(saved[0].id) 
        };
        setCurrentSchedule(updatedSchedule);
        return updatedSchedule;
      }
      return null;
    } catch (err) {
      console.error('Error saving schedule:', err);
      return null;
    }
  }, []);

  // Delete a schedule
  const deleteSchedule = useCallback(async (id: string): Promise<boolean> => {
    try {
      await deleteScheduleFromDB(id);
      setSavedSchedules(prev => prev.filter(s => s.id !== id));
      if (currentSchedule?.id === id) {
        setCurrentSchedule(null);
      }
      return true;
    } catch (e: any) {
      console.error('Error removing schedule:', e);
      throw new Error(
        e.message || 'No se pudo eliminar el horario. Por favor intente de nuevo.'
      );
    }
  }, [currentSchedule?.id]);

  // Bulk delete schedules
  const bulkDeleteSchedules = useCallback(async (ids: string[]) => {
    try {
      await Promise.all(ids.map(id => deleteScheduleFromDB(id)));
      setSavedSchedules(prev => prev.filter(s => !ids.includes(s.id)));
      if (currentSchedule?.id && ids.includes(currentSchedule.id)) {
        setCurrentSchedule(null);
      }
    } catch (e) {
      console.error('Bulk delete error:', e);
      throw new Error('Ocurrio un error al eliminar los horarios');
    }
  }, [currentSchedule?.id]);

  // Update schedule title
  const updateScheduleTitle = useCallback(async (userId: string, title: string) => {
    if (!currentSchedule) return;
    
    const updatedSchedule = { ...currentSchedule, title };
    setCurrentSchedule(updatedSchedule);

    if (userId && updatedSchedule.id) {
      await saveScheduleToDB(userId, updatedSchedule);
    }
  }, [currentSchedule]);

  // Update session color by subject name
  const updateSessionColor = useCallback(async (userId: string, subject: string, color: string) => {
    if (!currentSchedule) return;

    const updatedSessions = currentSchedule.sessions.map(s =>
      s.subject === subject ? { ...s, color } : s
    );

    const updatedSchedule = { ...currentSchedule, sessions: updatedSessions };
    setCurrentSchedule(updatedSchedule);

    if (userId && updatedSchedule.id) {
      await saveScheduleToDB(userId, updatedSchedule);
    }
  }, [currentSchedule]);

  // Clear current schedule
  const clearCurrentSchedule = useCallback(() => {
    setCurrentSchedule(null);
  }, []);

  return {
    currentSchedule,
    setCurrentSchedule,
    savedSchedules,
    schedulesState,
    fetchSchedules,
    openSchedule,
    saveSchedule,
    deleteSchedule,
    bulkDeleteSchedules,
    updateScheduleTitle,
    updateSessionColor,
    clearCurrentSchedule,
  };
}
