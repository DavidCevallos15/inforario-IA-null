import { Schedule } from '../../types';

const DAY_TO_ICS_DAY: Record<string, string> = {
  'Lunes': 'MO',
  'Martes': 'TU',
  'Miércoles': 'WE',
  'Jueves': 'TH',
  'Viernes': 'FR',
  'Sábado': 'SA',
  'Domingo': 'SU'
};

const DAY_TO_NUM: Record<string, number> = {
  'Domingo': 0,
  'Lunes': 1,
  'Martes': 2,
  'Miércoles': 3,
  'Jueves': 4,
  'Viernes': 5,
  'Sábado': 6
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

/** Escapa texto según RFC 5545 §3.3.11 (barra invertida, ; , y saltos de línea). */
export function escapeICSText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/** Pliega líneas de más de 75 octetos (RFC 5545 §3.1) sin partir caracteres UTF-8. */
export function foldICSLine(line: string): string {
  const encoder = new TextEncoder();
  if (encoder.encode(line).length <= 75) return line;

  const parts: string[] = [];
  let current = '';
  let currentBytes = 0;
  for (const char of line) {
    const charBytes = encoder.encode(char).length;
    // La primera línea admite 75 octetos; las de continuación, 74 + el espacio inicial
    const limit = parts.length === 0 ? 75 : 74;
    if (currentBytes + charBytes > limit) {
      parts.push(current);
      current = '';
      currentBytes = 0;
    }
    current += char;
    currentBytes += charBytes;
  }
  parts.push(current);
  return parts.join('\r\n ');
}

const formatUTCStamp = (date: Date): string =>
  date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

/** Construye el contenido .ics (función pura, testeable). */
export function buildICS(schedule: Schedule, semesterStart: Date, semesterEnd: Date, now: Date = new Date()): string {
  const vcalendar = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Inforario UTM//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH'
  ];

  // UNTIL en UTC (YYYYMMDDTHHMMSSZ)
  const untilDateStr = `${semesterEnd.getUTCFullYear()}${String(semesterEnd.getUTCMonth()+1).padStart(2,'0')}${String(semesterEnd.getUTCDate()).padStart(2,'0')}T235959Z`;
  const dtStamp = formatUTCStamp(now);

  schedule.sessions.forEach(session => {
    // Omitir clases virtuales o sin horario real
    if (!session.day || !session.startTime || !session.endTime || session.isVirtual) {
      return;
    }

    const firstStart = getFirstOccurrence(semesterStart, session.day, session.startTime);
    const firstEnd = getFirstOccurrence(semesterStart, session.day, session.endTime);
    const byday = DAY_TO_ICS_DAY[session.day] || 'MO';

    vcalendar.push(
      'BEGIN:VEVENT',
      `UID:${crypto.randomUUID()}@inforario.utm`,
      `DTSTAMP:${dtStamp}`,
      `DTSTART:${formatICSDate(firstStart)}`,
      `DTEND:${formatICSDate(firstEnd)}`,
      `RRULE:FREQ=WEEKLY;UNTIL=${untilDateStr};BYDAY=${byday}`,
      `SUMMARY:${escapeICSText(session.subject)}`,
      `LOCATION:${escapeICSText(session.location)}`,
      `DESCRIPTION:${escapeICSText(`Docente: ${session.teacher}\nSGU Inforario UTM`)}`,
      'END:VEVENT'
    );
  });

  vcalendar.push('END:VCALENDAR');
  return vcalendar.map(foldICSLine).join('\r\n') + '\r\n';
}

export function generateICS(schedule: Schedule, semesterStart: Date, semesterEnd: Date): void {
  const blob = new Blob([buildICS(schedule, semesterStart, semesterEnd)], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;

  const cleanPeriod = (schedule.academic_period || 'horario').replace(/\s+/g, '_');
  a.download = `horario_${cleanPeriod}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
