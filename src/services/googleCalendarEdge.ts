import { Schedule } from '../types';
import { supabase, isSupabaseConfigured } from './supabase';

export interface CalendarEventInput {
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  recurrence?: string[];
}

interface SyncCalendarPayload {
  calendarId?: string;
  events: CalendarEventInput[];
}

interface SyncCalendarResponse {
  success: boolean;
  message: string;
  events?: Array<{ id: string; htmlLink?: string }>;
}

const getFirstDateOfDay = (startDate: Date, dayName: string): Date => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const targetIndex = days.indexOf(dayName);
  if (targetIndex === -1) return startDate;

  const resultDate = new Date(startDate);
  const currentDay = resultDate.getDay();
  let distance = targetIndex - currentDay;
  if (distance < 0) distance += 7;

  resultDate.setDate(resultDate.getDate() + distance);
  return resultDate;
};

export const buildCalendarEventsFromSchedule = (
  schedule: Schedule,
  semesterStart: Date,
  semesterEnd: Date,
  timeZone: string = Intl.DateTimeFormat().resolvedOptions().timeZone
): CalendarEventInput[] => {
  const untilDate = new Date(semesterEnd);
  untilDate.setHours(23, 59, 59, 0);
  const untilStr = untilDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const events: CalendarEventInput[] = [];

  schedule.sessions.forEach((session) => {
    if (session.conflict) return;

    const firstDate = getFirstDateOfDay(semesterStart, session.day);
    if (firstDate > semesterEnd) return;

    const [startH, startM] = session.startTime.split(':').map(Number);
    const [endH, endM] = session.endTime.split(':').map(Number);

    const startDateTime = new Date(firstDate);
    startDateTime.setHours(startH, startM, 0, 0);

    const endDateTime = new Date(firstDate);
    endDateTime.setHours(endH, endM, 0, 0);

    events.push({
      summary: session.subject,
      description: `Docente: ${session.teacher || 'No especificado'}`,
      location: session.location || undefined,
      start: {
        dateTime: startDateTime.toISOString(),
        timeZone,
      },
      end: {
        dateTime: endDateTime.toISOString(),
        timeZone,
      },
      recurrence: [`RRULE:FREQ=WEEKLY;UNTIL=${untilStr}`],
    });
  });

  return events;
};

export const syncCalendarEvents = async (
  payload: SyncCalendarPayload
): Promise<SyncCalendarResponse> => {
  if (!isSupabaseConfigured()) {
    return { success: false, message: 'Supabase no está configurado.' };
  }

  if (!payload.events.length) {
    return { success: false, message: 'No hay eventos para sincronizar.' };
  }

  const { data, error } = await supabase.functions.invoke('google-calendar-sync', {
    body: {
      calendarId: payload.calendarId || 'primary',
      events: payload.events,
    },
  });

  if (error) {
    return { success: false, message: error.message || 'Falló la llamada a la Edge Function.' };
  }

  return data as SyncCalendarResponse;
};
