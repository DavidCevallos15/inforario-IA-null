import { ClassSession, DAYS, DayOfWeek } from '../../../types';
import { timeToMins } from './timeSelectors';

export type TimeState = 'past' | 'now' | 'next' | 'later' | 'other-day';

// Date.getDay(): 0 = domingo … 6 = sábado
const JS_DAY_TO_DAY: Record<number, DayOfWeek | undefined> = {
  1: 'Lunes',
  2: 'Martes',
  3: 'Miércoles',
  4: 'Jueves',
  5: 'Viernes',
};

export const todayOf = (now: Date): DayOfWeek | undefined => JS_DAY_TO_DAY[now.getDay()];

/**
 * Clase "viva" de hoy: la que está en curso o, si no hay ninguna, la próxima.
 * Es la única señal destacada por pantalla.
 */
export const getLiveSessionId = (sessions: ClassSession[], now: Date): { id: string; kind: 'now' | 'next' } | null => {
  const today = todayOf(now);
  if (!today) return null;
  const minutes = now.getHours() * 60 + now.getMinutes();

  const todays = sessions
    .filter((s) => s.day === today && s.startTime && s.endTime)
    .sort((a, b) => timeToMins(a.startTime!) - timeToMins(b.startTime!));

  const current = todays.find((s) => timeToMins(s.startTime!) <= minutes && minutes < timeToMins(s.endTime!));
  if (current) return { id: current.id, kind: 'now' };

  const upcoming = todays.find((s) => timeToMins(s.startTime!) > minutes);
  return upcoming ? { id: upcoming.id, kind: 'next' } : null;
};

/** Estado de una clase respecto al momento actual (solo las de hoy tienen pasado/ahora/siguiente). */
export const getTimeState = (session: ClassSession, now: Date, live: ReturnType<typeof getLiveSessionId>): TimeState => {
  if (!session.day || !session.startTime || !session.endTime) return 'other-day';
  if (session.day !== todayOf(now)) return 'other-day';
  if (live?.id === session.id) return live.kind;
  const minutes = now.getHours() * 60 + now.getMinutes();
  return timeToMins(session.endTime) <= minutes ? 'past' : 'later';
};

/** Días con clases presenciales, en orden de la semana. */
export const daysWithClasses = (sessions: ClassSession[]): DayOfWeek[] =>
  DAYS.filter((day) => sessions.some((s) => s.day === day && s.startTime && s.endTime));
