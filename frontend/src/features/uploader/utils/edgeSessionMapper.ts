import { ClassSession, DAYS, DayOfWeek } from '../../../types';

/** Forma de la respuesta de la Edge Function `extract-schedule`. */
export interface ExtractScheduleEdgeResponse {
  sessions?: Array<{
    subject?: string;
    teacher?: string;
    day?: string;
    startTime?: string;
    endTime?: string;
    location?: string;
    floor?: string;
    isVirtual?: boolean;
  }>;
  error?: string;
}

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

const isDay = (value: string | undefined): value is DayOfWeek =>
  !!value && (DAYS as string[]).includes(value);

/**
 * Valida y normaliza las sesiones devueltas por la IA. Descarta las que no
 * tengan materia o (si son presenciales) día/horas válidos.
 */
export const mapEdgeSessions = (payload: ExtractScheduleEdgeResponse): ClassSession[] => {
  if (!Array.isArray(payload.sessions)) {
    throw new Error('La respuesta de la IA no contiene sessions.');
  }

  return payload.sessions
    .map((item): ClassSession | null => {
      const isVirtual = item.isVirtual === true || (item.location || '').toUpperCase().includes('VIRTUAL');
      const day = isDay(item.day) ? item.day : undefined;
      const startTime = item.startTime?.trim();
      const endTime = item.endTime?.trim();
      const subject = item.subject
        ?.replace(/^(TECNOLOG[IÍ]AS DE LA\s*)+/i, '')
        .replace(/\s*\((A19|ITINERARIO|[A-Z0-9]+)\)\s*/gi, '')
        .trim()
        .toUpperCase() || '';
      const hasValidTime =
        !!startTime && !!endTime && TIME_REGEX.test(startTime) && TIME_REGEX.test(endTime) && startTime < endTime;

      if (!subject) return null;
      if (!isVirtual && (!day || !hasValidTime)) return null;

      return {
        id: crypto.randomUUID(),
        subject,
        day: isVirtual ? undefined : day,
        startTime: isVirtual ? undefined : startTime,
        endTime: isVirtual ? undefined : endTime,
        teacher: item.teacher?.trim() || 'N/A',
        location: isVirtual ? 'Virtual' : item.location?.trim() || 'N/A',
        floor: item.floor?.trim() || 'N/A',
        isVirtual,
        conflict: false,
      };
    })
    .filter((session): session is ClassSession => session !== null);
};
