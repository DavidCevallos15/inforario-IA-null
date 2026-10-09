import { ClassSession } from '../../../types';

/**
 * Converts a "HH:mm" time string to the number of minutes since midnight.
 */
export const timeToMins = (time: string): number => {
  if (!time) return 0;
  const [h, m] = time.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

/**
 * Checks if two class sessions overlap in time on the same day.
 */
export const detectOverlap = (s1: ClassSession, s2: ClassSession): boolean => {
  if (!s1.day || !s2.day || s1.day !== s2.day) return false;
  if (!s1.startTime || !s1.endTime || !s2.startTime || !s2.endTime) return false;

  const start1 = timeToMins(s1.startTime);
  const end1 = timeToMins(s1.endTime);
  const start2 = timeToMins(s2.startTime);
  const end2 = timeToMins(s2.endTime);

  return start1 < end2 && start2 < end1;
};

/**
 * Gets the active schedule's bounding hours (minimum and maximum).
 */
export const getScheduleHoursRange = (
  sessions: ClassSession[],
  fallbackMin = 7,
  fallbackMax = 18
): { minHour: number; maxHour: number } => {
  const regular = sessions.filter(s => !s.isVirtual && s.day && s.startTime && s.endTime);
  if (regular.length === 0) {
    return { minHour: fallbackMin, maxHour: fallbackMax };
  }

  let min = 24;
  let max = 0;

  regular.forEach(s => {
    if (!s.startTime || !s.endTime) return;
    const startH = parseInt(s.startTime.split(':')[0]);
    const [endHStr, endMStr] = s.endTime.split(':');
    const endH = parseInt(endHStr);
    const endM = parseInt(endMStr);
    
    if (startH < min) min = startH;
    
    let effectiveEnd = endH;
    if (endM > 0) effectiveEnd += 1;
    if (effectiveEnd > max) max = effectiveEnd;
  });

  const finalMin = Math.max(6, min);
  const finalMax = Math.max(finalMin + 4, max + 1);

  return { minHour: finalMin, maxHour: finalMax };
};

/**
 * Reparte en carriles las clases de un mismo día: las que se cruzan quedan lado
 * a lado (manteniendo su hora real de inicio y fin) en lugar de taparse.
 * Devuelve, por id, el carril de cada clase y cuántos carriles tiene su grupo.
 */
export const layoutLanes = (sessions: ClassSession[]): Map<string, { lane: number; lanes: number }> => {
  const result = new Map<string, { lane: number; lanes: number }>();
  const timed = sessions
    .filter((s) => s.startTime && s.endTime)
    .sort((a, b) => timeToMins(a.startTime!) - timeToMins(b.startTime!) || timeToMins(a.endTime!) - timeToMins(b.endTime!));

  let group: ClassSession[] = [];
  let laneEnds: number[] = [];
  let groupEnd = -1;

  const flush = () => {
    for (const s of group) {
      const entry = result.get(s.id)!;
      result.set(s.id, { lane: entry.lane, lanes: laneEnds.length });
    }
    group = [];
    laneEnds = [];
  };

  for (const s of timed) {
    const start = timeToMins(s.startTime!);
    const end = timeToMins(s.endTime!);
    if (group.length && start >= groupEnd) flush();
    let lane = laneEnds.findIndex((laneEnd) => laneEnd <= start);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(end);
    } else {
      laneEnds[lane] = end;
    }
    result.set(s.id, { lane, lanes: 1 });
    group.push(s);
    groupEnd = Math.max(group.length === 1 ? end : groupEnd, end);
  }
  if (group.length) flush();
  return result;
};

/**
 * Plantilla de columnas de la semana: un día con clases en choque se ensancha
 * para que los bloques lado a lado sigan siendo legibles.
 */
export const weekColumnTemplate = (
  timeColumn: string,
  lanesByDay: Record<string, Map<string, { lane: number; lanes: number }>>,
  days: string[]
): string =>
  `${timeColumn} ${days
    .map((day) => {
      const maxLanes = Math.max(1, ...[...(lanesByDay[day]?.values() ?? [])].map((v) => v.lanes));
      return `${Math.min(2, 1 + 0.5 * (maxLanes - 1))}fr`;
    })
    .join(' ')}`;
