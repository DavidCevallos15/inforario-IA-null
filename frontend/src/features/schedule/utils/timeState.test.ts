import { describe, expect, it } from 'vitest';
import { ClassSession } from '../../../types';
import { daysWithClasses, getLiveSessionId, getTimeState, todayOf } from './timeState';

const s = (id: string, day: ClassSession['day'], startTime?: string, endTime?: string): ClassSession => ({
  id,
  subject: id,
  teacher: '',
  location: '',
  day,
  startTime,
  endTime,
});

// 2026-10-08 es jueves
const at = (h: number, m = 0) => new Date(2026, 9, 8, h, m);

const sessions = [
  s('estructuras', 'Jueves', '07:00', '11:00'),
  s('fisica', 'Jueves', '14:00', '17:00'),
  s('calculo', 'Lunes', '11:00', '13:00'),
  s('estadistica', undefined),
];

describe('timeState', () => {
  it('todayOf solo devuelve días de clase', () => {
    expect(todayOf(at(9))).toBe('Jueves');
    expect(todayOf(new Date(2026, 9, 10))).toBeUndefined(); // sábado
  });

  it('la clase en curso es la señal viva', () => {
    expect(getLiveSessionId(sessions, at(9, 30))).toEqual({ id: 'estructuras', kind: 'now' });
  });

  it('entre clases, la señal es la siguiente; al terminar el día no hay señal', () => {
    expect(getLiveSessionId(sessions, at(12))).toEqual({ id: 'fisica', kind: 'next' });
    expect(getLiveSessionId(sessions, at(18))).toBeNull();
  });

  it('el fin de una clase es exclusivo: a las 11:00 ya terminó Estructuras', () => {
    const live = getLiveSessionId(sessions, at(11));
    expect(live).toEqual({ id: 'fisica', kind: 'next' });
    expect(getTimeState(sessions[0], at(11), live)).toBe('past');
  });

  it('clasifica cada clase de hoy y deja las demás como otro día', () => {
    const now = at(15);
    const live = getLiveSessionId(sessions, now);
    expect(sessions.map((x) => getTimeState(x, now, live))).toEqual(['past', 'now', 'other-day', 'other-day']);
  });

  it('daysWithClasses ignora materias sin horario', () => {
    expect(daysWithClasses(sessions)).toEqual(['Lunes', 'Jueves']);
  });
});
