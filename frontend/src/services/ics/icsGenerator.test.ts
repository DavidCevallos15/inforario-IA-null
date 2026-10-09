import { describe, expect, it } from 'vitest';
import { Schedule } from '../../types';
import { buildICS, escapeICSText, foldICSLine } from './icsGenerator';

const schedule: Schedule = {
  title: 'Mi Horario',
  academic_period: 'ABRIL 2026 - AGOSTO 2026',
  lastUpdated: new Date(),
  sessions: [
    {
      id: '1',
      subject: 'REDES, SEGURIDAD; Y MÁS',
      teacher: 'Juan Perez',
      location: 'Aula 204 - Piso 2',
      day: 'Miércoles',
      startTime: '07:00',
      endTime: '09:00',
    },
    { id: '2', subject: 'VIRTUAL', teacher: 'N/A', location: 'Virtual', isVirtual: true },
  ],
};

describe('icsGenerator', () => {
  it('escapa caracteres especiales (RFC 5545)', () => {
    expect(escapeICSText('a,b;c\\d\ne')).toBe('a\\,b\\;c\\\\d\\ne');
  });

  it('pliega líneas largas a 75 octetos sin partir caracteres multibyte', () => {
    const line = `SUMMARY:${'ñ'.repeat(60)}`;
    const folded = foldICSLine(line);
    const encoder = new TextEncoder();

    for (const part of folded.split('\r\n')) {
      expect(encoder.encode(part).length).toBeLessThanOrEqual(75);
    }
    expect(folded.split('\r\n').map((p, i) => (i === 0 ? p : p.slice(1))).join('')).toBe(line);
  });

  it('genera un VEVENT semanal por clase presencial a partir del primer día correspondiente', () => {
    // 2026-04-13 es lunes → la primera clase de miércoles es el 15
    const ics = buildICS(schedule, new Date(2026, 3, 13), new Date(2026, 7, 14), new Date(Date.UTC(2026, 0, 1, 12, 30)));

    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(1);
    expect(ics).toContain('DTSTART:20260415T070000');
    expect(ics).toContain('DTEND:20260415T090000');
    expect(ics).toContain('RRULE:FREQ=WEEKLY;UNTIL=');
    expect(ics).toContain(';BYDAY=WE');
    expect(ics).toContain('DTSTAMP:20260101T123000Z');
    expect(ics).toContain('SUMMARY:REDES\\, SEGURIDAD\\; Y MÁS');
    expect(ics).toContain('DESCRIPTION:Docente: Juan Perez\\nSGU Inforario UTM');
    expect(ics.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true);
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true);
  });
});
