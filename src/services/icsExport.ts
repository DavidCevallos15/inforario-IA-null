import { Schedule, ClassSession } from '../types';

const DAY_TO_ICS_DAY: Record<string, string> = {
  'Monday': 'MO',
  'Tuesday': 'TU',
  'Wednesday': 'WE',
  'Thursday': 'TH',
  'Friday': 'FR',
  'Saturday': 'SA',
  'Sunday': 'SU'
};

const DAY_TO_NUM: Record<string, number> = {
  'Sunday': 0,
  'Monday': 1,
  'Tuesday': 2,
  'Wednesday': 3,
  'Thursday': 4,
  'Friday': 5,
  'Saturday': 6
};

// Formats a JS Date to ICS Datetime YYYYMMDDTHHMMSS (Floating local time)
function formatICSDate(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(date.getHours())}${pad(date.getMinutes())}00`;
}

function getFirstOccurrence(startDate: Date, dayName: string, startTime: string): Date {
  const start = new Date(startDate);
  // Parse "HH:MM"
  const [hours, mins] = startTime.split(':').map(Number);
  start.setHours(hours, mins, 0, 0);

  const targetDay = DAY_TO_NUM[dayName];
  const currentDay = start.getDay();
  let daysToAdd = targetDay - currentDay;
  if (daysToAdd < 0) daysToAdd += 7; // Next occurrence

  start.setDate(start.getDate() + daysToAdd);
  return start;
}

export function generateICS(schedule: Schedule, semesterStart: Date, semesterEnd: Date): void {
  const vcalendar = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Inforario UTM//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH'
  ];

  // UNTIL requires UTC format YYYYMMDDTHHMMSSZ for safety
  const untilDateStr = `${semesterEnd.getUTCFullYear()}${String(semesterEnd.getUTCMonth()+1).padStart(2,'0')}${String(semesterEnd.getUTCDate()).padStart(2,'0')}T235959Z`;

  schedule.sessions.forEach(session => {
    // Skip virtual or unassigned classes with no real times
    if (!session.startTime || !session.endTime || session.location === 'MATERIA VIRTUAL') {
      return; 
    }

    // Determine exact first start/end dates
    const firstStart = getFirstOccurrence(semesterStart, session.day, session.startTime);
    const firstEnd = getFirstOccurrence(semesterStart, session.day, session.endTime);

    // Format strings
    const dtStart = formatICSDate(firstStart);
    const dtEnd = formatICSDate(firstEnd);
    const rule = `FREQ=WEEKLY;UNTIL=${untilDateStr};BYDAY=${DAY_TO_ICS_DAY[session.day]}`;

    // Random UID
    const uid = `${crypto.randomUUID()}@inforario.utm`;
    // Add Z for current stamp UTC
    const now = new Date();
    const dtStamp = `${now.getUTCFullYear()}${String(now.getUTCMonth()+1).padStart(2,'0')}${String(now.getUTCDate()).padStart(2,'0')}T${String(now.getUTCHours()).padStart(2,'0')}${String(now.getUTCMinutes()).padStart(2,'0')}${String(now.getUTCSeconds()).padStart(2,'0')}Z`;

    vcalendar.push(
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${dtStamp}`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      `RRULE:${rule}`,
      `SUMMARY:${session.subject}`,
      `LOCATION:${session.location}`,
      `DESCRIPTION:Docente: ${session.teacher}\\nSGA Inforario UTM`,
      'END:VEVENT'
    );
  });

  vcalendar.push('END:VCALENDAR');

  const blob = new Blob([vcalendar.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `horario_${schedule.academic_period.replace(/\\s+/g, '_')}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
