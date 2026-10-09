import { describe, expect, it } from 'vitest';
import { ClassSession } from '../../../types';
import { detectOverlap, getScheduleHoursRange, timeToMins } from './timeSelectors';

const s = (day: ClassSession['day'], startTime: string, endTime: string): ClassSession => ({
  id: `${day}-${startTime}`,
  subject: 'X',
  teacher: '',
  location: '',
  day,
  startTime,
  endTime,
});

describe('timeSelectors', () => {
  it('timeToMins', () => {
    expect(timeToMins('07:30')).toBe(450);
    expect(timeToMins('')).toBe(0);
  });

  it('detectOverlap considera contiguos como no solapados', () => {
    expect(detectOverlap(s('Lunes', '07:00', '09:00'), s('Lunes', '08:59', '10:00'))).toBe(true);
    expect(detectOverlap(s('Lunes', '07:00', '09:00'), s('Lunes', '09:00', '10:00'))).toBe(false);
    expect(detectOverlap(s('Lunes', '07:00', '09:00'), s('Martes', '07:00', '09:00'))).toBe(false);
  });

  it('getScheduleHoursRange redondea hacia arriba y garantiza un mínimo de 4 horas', () => {
    expect(getScheduleHoursRange([s('Lunes', '07:00', '08:30')])).toEqual({ minHour: 7, maxHour: 11 });
    expect(getScheduleHoursRange([s('Lunes', '07:00', '13:00'), s('Martes', '14:00', '17:30')])).toEqual({
      minHour: 7,
      maxHour: 19,
    });
    expect(getScheduleHoursRange([])).toEqual({ minHour: 7, maxHour: 18 });
  });
});
