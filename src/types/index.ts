// ============================================
// BRANDED TYPES - Para type safety mejorado
// ============================================

declare const __brand: unique symbol;
type Brand<T, B> = T & { [__brand]: B };

export type UserId = Brand<string, 'UserId'>;
export type ScheduleId = Brand<string, 'ScheduleId'>;
export type SessionId = Brand<string, 'SessionId'>;

// Helpers para crear branded types
export const createUserId = (id: string): UserId => id as UserId;
export const createScheduleId = (id: string): ScheduleId => id as ScheduleId;
export const createSessionId = (id: string): SessionId => id as SessionId;

// ============================================
// DISCRIMINATED UNIONS - Para estados de UI
// ============================================

export type LoadingState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: string };

export type AuthState =
  | { status: 'unauthenticated' }
  | { status: 'loading' }
  | { status: 'authenticated'; user: UserProfile; profile: UserProfileData | null };

// ============================================
// CORE TYPES
// ============================================

export interface UserProfile {
  id: UserId;
  email: string;
  full_name?: string;
  avatar_url?: string;
  career?: string;
}

export interface UserProfileData {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  career?: string;
}

export interface ClassSession {
  id: SessionId;
  subject: string;
  subject_faculty?: string;
  day?: DayOfWeek;
  startTime?: string; // HH:mm format
  endTime?: string;   // HH:mm format
  teacher: string;
  location: string;
  floor?: string;
  isVirtual?: boolean;
  color?: string;
  conflict?: boolean;
}

export interface Schedule {
  id?: ScheduleId;
  title: string;
  academic_period?: string;
  faculty?: string;
  sessions: ClassSession[];
  lastUpdated: Date;
}

export interface SavedSchedule {
  id: ScheduleId;
  title: string;
  academic_period?: string;
  faculty?: string;
  last_updated: string;
}

// ============================================
// THEME TYPES
// ============================================

export const SCHEDULE_THEMES = ['DEFAULT', 'MINIMALIST', 'SCHOOL', 'NEON'] as const;
export type ScheduleTheme = typeof SCHEDULE_THEMES[number];

// ============================================
// VIEW TYPES
// ============================================

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

// ============================================
// DAYS TYPES
// ============================================

export type DayOfWeek = 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes';
export const DAYS: DayOfWeek[] = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'] as const;

// ============================================
// API RESPONSE TYPES
// ============================================

export type ApiResponse<T> = 
  | { success: true; data: T }
  | { success: false; error: string };

export interface ScheduleParseResult {
  sessions: ClassSession[];
  faculty?: string;
  academic_period?: string;
}

// ============================================
// SUPABASE DATABASE TYPES
// ============================================

export interface DatabaseSchedule {
  id: string;
  user_id: string;
  title: string;
  academic_period: string | null;
  faculty: string | null;
  schedule_data: ClassSession[];
  last_updated: string;
  created_at: string;
}

export interface DatabaseProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  career: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// UTILITY TYPES
// ============================================

export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;

// Make all properties of T optional except for keys in K
export type PartialExcept<T, K extends keyof T> = Partial<T> & Pick<T, K>;

// Make specific properties required
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
