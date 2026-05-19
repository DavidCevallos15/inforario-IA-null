import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Schedule, ClassSession, ScheduleTheme } from '../types';
import { 
  saveScheduleToDB, 
  getUserSchedules, 
  getScheduleById, 
  deleteSchedule as deleteScheduleFromDB 
} from '../services/supabase';

// Default color palette for subjects
export const DEFAULT_SUBJECT_COLORS = [
  '#22C55E', // Green
  '#3B82F6', // Blue
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#14B8A6', // Teal
  '#F97316', // Orange
  '#6366F1', // Indigo
  '#84CC16', // Lime
];

interface ScheduleState {
  currentSchedule: Schedule | null;
  savedSchedules: Schedule[];
  theme: ScheduleTheme;
  fontScale: number;
  subjectColors: Record<string, string>;
  isLoading: boolean;
  
  // Actions
  setCurrentSchedule: (schedule: Schedule | null) => void;
  setSavedSchedules: (schedules: Schedule[]) => void;
  setTheme: (theme: ScheduleTheme) => void;
  setFontScale: (scale: number) => void;
  
  // Color management
  setSubjectColor: (subject: string, color: string) => void;
  resetColors: () => void;
  initializeColorsFromSchedule: (schedule: Schedule) => void;
  
  // Database operations
  fetchSchedules: (deviceId: string) => Promise<void>;
  saveSchedule: (deviceId: string, schedule: Schedule) => Promise<Schedule | null>;
  openSchedule: (id: string) => Promise<Schedule | null>;
  deleteSchedule: (id: string) => Promise<void>;
  
  // Schedule modifications
  updateScheduleTitle: (title: string) => void;
  updateSessionColor: (subject: string, color: string) => void;
}

export const useScheduleStore = create<ScheduleState>()(
  persist(
    (set, get) => ({
      currentSchedule: null,
      savedSchedules: [],
      theme: 'DEFAULT',
      fontScale: 1,
      subjectColors: {},
      isLoading: false,

      setCurrentSchedule: (schedule) => {
        set({ currentSchedule: schedule });
        if (schedule) {
          get().initializeColorsFromSchedule(schedule);
        }
      },
      
      setSavedSchedules: (schedules) => set({ savedSchedules: schedules }),
      
      setTheme: (theme) => set({ theme }),
      
      setFontScale: (scale) => set({ fontScale: Math.max(0.7, Math.min(1.5, scale)) }),

      setSubjectColor: (subject, color) => {
        set((state) => ({
          subjectColors: { ...state.subjectColors, [subject]: color }
        }));
      },

      resetColors: () => {
        const { currentSchedule } = get();
        if (!currentSchedule) return;

        // Get unique subjects
        const subjects = [...new Set(currentSchedule.sessions.map(s => s.subject))];
        
        // Assign default colors
        const newColors: Record<string, string> = {};
        subjects.forEach((subject, index) => {
          newColors[subject] = DEFAULT_SUBJECT_COLORS[index % DEFAULT_SUBJECT_COLORS.length];
        });

        // Update sessions with new colors
        const updatedSessions = currentSchedule.sessions.map(session => ({
          ...session,
          color: newColors[session.subject]
        }));

        set({ 
          subjectColors: newColors,
          currentSchedule: { ...currentSchedule, sessions: updatedSessions }
        });
      },

      initializeColorsFromSchedule: (schedule) => {
        const subjects = [...new Set(schedule.sessions.map(s => s.subject))];
        const colors: Record<string, string> = {};
        
        subjects.forEach((subject, index) => {
          // Use existing color from session or assign default
          const existingSession = schedule.sessions.find(s => s.subject === subject);
          colors[subject] = existingSession?.color || DEFAULT_SUBJECT_COLORS[index % DEFAULT_SUBJECT_COLORS.length];
        });

        set({ subjectColors: colors });
      },

      fetchSchedules: async (deviceId) => {
        set({ isLoading: true });
        try {
          const data = await getUserSchedules(deviceId);
          set({ savedSchedules: data || [] });
        } catch (error) {
          console.error('Error fetching schedules:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      saveSchedule: async (deviceId, schedule) => {
        try {
          const saved = await saveScheduleToDB(deviceId, schedule);
          if (saved && saved[0]) {
            const updatedSchedule = { ...schedule, id: saved[0].id };
            set({ currentSchedule: updatedSchedule });
            await get().fetchSchedules(deviceId);
            return updatedSchedule;
          }
          return null;
        } catch (error) {
          console.error('Error saving schedule:', error);
          return null;
        }
      },

      openSchedule: async (id) => {
        set({ isLoading: true });
        try {
          const fullSchedule = await getScheduleById(id);
          if (fullSchedule && fullSchedule.schedule_data) {
            const schedule: Schedule = {
              id: fullSchedule.id,
              title: fullSchedule.title,
              academic_period: fullSchedule.academic_period,
              faculty: fullSchedule.faculty,
              sessions: fullSchedule.schedule_data,
              lastUpdated: new Date(),
            };
            set({ currentSchedule: schedule });
            get().initializeColorsFromSchedule(schedule);
            return schedule;
          }
          return null;
        } catch (error) {
          console.error('Error opening schedule:', error);
          return null;
        } finally {
          set({ isLoading: false });
        }
      },

      deleteSchedule: async (id) => {
        try {
          await deleteScheduleFromDB(id);
          set((state) => ({
            savedSchedules: state.savedSchedules.filter(s => s.id !== id),
            currentSchedule: state.currentSchedule?.id === id ? null : state.currentSchedule
          }));
        } catch (error) {
          console.error('Error deleting schedule:', error);
          throw error;
        }
      },

      updateScheduleTitle: (title) => {
        set((state) => ({
          currentSchedule: state.currentSchedule 
            ? { ...state.currentSchedule, title }
            : null
        }));
      },

      updateSessionColor: (subject, color) => {
        set((state) => {
          if (!state.currentSchedule) return state;
          
          const updatedSessions = state.currentSchedule.sessions.map(s =>
            s.subject === subject ? { ...s, color } : s
          );
          
          return {
            currentSchedule: { ...state.currentSchedule, sessions: updatedSessions },
            subjectColors: { ...state.subjectColors, [subject]: color }
          };
        });
      },
    }),
    {
      name: 'inforario-schedule',
      partialize: (state) => ({ 
        theme: state.theme,
        fontScale: state.fontScale,
        subjectColors: state.subjectColors,
      }),
    }
  )
);
