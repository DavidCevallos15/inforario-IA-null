import { describe, expect, it } from 'vitest';
import { ClassSession } from '../../../types';
import { detectOverlap, getScheduleHoursRange, layoutLanes, timeToMins, weekColumnTemplate } from './timeSelectors';

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

describe('layoutLanes', () => {
  it('deja en un carril las clases que no se cruzan (contiguas incluidas)', () => {
    const lanes = layoutLanes([s('Lunes', '08:00', '10:00'), s('Lunes', '10:00', '12:00')]);
    expect([...lanes.values()]).toEqual([
      { lane: 0, lanes: 1 },
      { lane: 0, lanes: 1 },
    ]);
  });

  it('pone lado a lado las que se cruzan y reutiliza carriles libres', () => {
    const a = { ...s('Lunes', '08:00', '11:00'), id: 'a' };
    const b = { ...s('Lunes', '10:00', '12:00'), id: 'b' };
    const c = { ...s('Lunes', '11:00', '13:00'), id: 'c' };
    const lanes = layoutLanes([a, b, c]);
    expect(lanes.get('a')).toEqual({ lane: 0, lanes: 2 });
    expect(lanes.get('b')).toEqual({ lane: 1, lanes: 2 });
    expect(lanes.get('c')).toEqual({ lane: 0, lanes: 2 });
  });
});

describe('weekColumnTemplate', () => {
  it('ensancha solo el día que tiene clases lado a lado', () => {
    const lunes = [
      { ...s('Lunes', '08:00', '11:00'), id: 'a' },
      { ...s('Lunes', '10:00', '12:00'), id: 'b' },
    ];
    const lanesByDay = { Lunes: layoutLanes(lunes), Martes: layoutLanes([s('Martes', '08:00', '10:00')]) };
    expect(weekColumnTemplate('56px', lanesByDay, ['Lunes', 'Martes', 'Miércoles'])).toBe('56px 1.5fr 1fr 1fr');
  });
});
