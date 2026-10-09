import { describe, expect, it } from 'vitest';
import { getSemesterRange } from './semesterRange';

const ymd = (d: Date) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;

describe('getSemesterRange', () => {
  it('usa el período del SGU cuando aún no empieza', () => {
    const { start, end } = getSemesterRange('ABRIL 2026 - AGOSTO 2026', new Date(2026, 1, 10));
    expect(ymd(start)).toBe('2026-4-1');
    expect(ymd(end)).toBe('2026-8-31');
  });

  it('arranca desde hoy si el período ya está en curso', () => {
    const { start, end } = getSemesterRange('SEPTIEMBRE 2026 - ENERO 2027', new Date(2026, 9, 8, 15, 30));
    expect(ymd(start)).toBe('2026-10-8');
    expect(ymd(end)).toBe('2027-1-31');
  });

  it('usa el rango por defecto si el período terminó o no se reconoce', () => {
    const today = new Date(2026, 9, 8); // jueves
    for (const period of ['ABRIL 2026 - AGOSTO 2026', undefined, 'TEXTO RARO']) {
      const { start, end } = getSemesterRange(period, today);
      expect(ymd(start)).toBe('2026-10-12'); // próximo lunes
      expect(end > start).toBe(true);
    }
  });
});
