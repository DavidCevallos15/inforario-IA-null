export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  career?: string;
}

export interface ClassSession {
  id: string;
  subject: string;
  subject_faculty?: string; // 👈 NUEVO: Facultad específica de la materia
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  teacher: string;
  location: string;
  // Se eliminó la propiedad 'type' ('Teoría' | 'Práctica' | 'Unknown')
  color?: string;
  conflict?: boolean;
}

export interface Schedule {
  id?: string;
  title: string;
  academic_period?: string;
  faculty?: string; // Se mantiene la facultad principal del horario (de la carrera)
  sessions: ClassSession[];
  lastUpdated: Date;
}

export type ScheduleTheme = 'DEFAULT' | 'MINIMALIST' | 'SCHOOL' | 'NEON';

export enum AppView {
  LANDING = 'LANDING',
  DASHBOARD = 'DASHBOARD',
  ABOUT = 'ABOUT',
  LOGIN = 'LOGIN',
  PROFILE = 'PROFILE',
}

export enum Feature {
  UPLOAD = 'UPLOAD',
  PROCESS = 'PROCESS',
  RESOLVE_CONFLICT = 'RESOLVE_CONFLICT',
  EDIT_NAME = 'EDIT_NAME',
  SAVE_CLOUD = 'SAVE_CLOUD',
  CUSTOMIZE_COLOR = 'CUSTOMIZE_COLOR',
  DOWNLOAD_PDF = 'DOWNLOAD_PDF',
  SYNC_CALENDAR = 'SYNC_CALENDAR',
}

export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';

export const DAYS: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];