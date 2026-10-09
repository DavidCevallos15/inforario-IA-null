import { ClassSession } from './sgu';

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  career?: string;
}

export interface DBResponseSchedule {
  id: string;
  user_id: string;
  title: string;
  academic_period?: string;
  faculty?: string;
  schedule_data: ClassSession[];
  created_at: string;
}

/** Fila resumida de `schedules` usada en el listado de horarios guardados. */
export interface ScheduleSummary {
  id: string;
  title: string;
  academic_period?: string;
  last_updated: string;
}
