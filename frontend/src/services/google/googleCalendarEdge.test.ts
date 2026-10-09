import { describe, expect, it } from 'vitest';
import { Schedule } from '../../types';
import { buildCalendarEventsFromSchedule } from './googleCalendarEdge';

describe('buildCalendarEventsFromSchedule', () => {
  const schedule: Schedule = {
    title: 'H',
    lastUpdated: new Date(),
    sessions: [
      { id: '1', subject: 'A', teacher: 'T', location: 'Aula', day: 'Viernes', startTime: '10:00', endTime: '12:00' },
      { id: '2', subject: 'B', teacher: 'T', location: 'Aula', day: 'Lunes', startTime: '10:00', endTime: '11:00', conflict: true },
      { id: '3', subject: 'C', teacher: 'T', location: 'Virtual', isVirtual: true },
    ],
  };

  it('crea eventos recurrentes solo para clases presenciales sin conflicto', () => {
    const events = buildCalendarEventsFromSchedule(schedule, new Date(2026, 3, 13), new Date(2026, 7, 14), 'America/Guayaquil');

    expect(events).toHaveLength(1);
    const [e] = events;
    expect(e.summary).toBe('A');
    expect(e.start.timeZone).toBe('America/Guayaquil');
    expect(new Date(e.start.dateTime).getDay()).toBe(5);
    expect(new Date(e.end.dateTime).getTime() - new Date(e.start.dateTime).getTime()).toBe(2 * 3600 * 1000);
    expect(e.recurrence?.[0]).toMatch(/^RRULE:FREQ=WEEKLY;UNTIL=\d{8}T\d{6}Z$/);
  });
});
