import { describe, expect, it } from 'vitest';
import { mapEdgeSessions } from './edgeSessionMapper';

describe('mapEdgeSessions', () => {
  it('normaliza sesiones válidas y limpia el nombre de la materia', () => {
    const [s] = mapEdgeSessions({
      sessions: [
        {
          subject: 'TECNOLOGÍAS DE LA Sistemas Distribuidos (A19)',
          teacher: ' Juan Perez ',
          day: 'Lunes',
          startTime: '07:00',
          endTime: '09:00',
          location: 'Aula 204',
          floor: '2',
        },
      ],
    });

    expect(s).toMatchObject({
      subject: 'SISTEMAS DISTRIBUIDOS',
      teacher: 'Juan Perez',
      day: 'Lunes',
      startTime: '07:00',
      endTime: '09:00',
      isVirtual: false,
      conflict: false,
    });
    expect(s.id).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('descarta sesiones presenciales sin día, con horas inválidas o invertidas', () => {
    const result = mapEdgeSessions({
      sessions: [
        { subject: 'A', day: 'Domingo', startTime: '07:00', endTime: '09:00' },
        { subject: 'B', day: 'Lunes', startTime: '7:00', endTime: '09:00' },
        { subject: 'C', day: 'Lunes', startTime: '10:00', endTime: '09:00' },
        { subject: '', day: 'Lunes', startTime: '07:00', endTime: '09:00' },
      ],
    });
    expect(result).toEqual([]);
  });

  it('acepta virtuales sin horario y les quita día/horas', () => {
    const [s] = mapEdgeSessions({
      sessions: [{ subject: 'Ética', location: 'MATERIA VIRTUAL', day: 'Lunes', startTime: '07:00', endTime: '08:00' }],
    });
    expect(s).toMatchObject({ isVirtual: true, location: 'Virtual', day: undefined, startTime: undefined });
  });

  it('falla si la respuesta no trae sessions', () => {
    expect(() => mapEdgeSessions({})).toThrow(/sessions/);
  });
});
