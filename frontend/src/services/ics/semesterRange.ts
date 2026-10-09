const MONTHS_ES: Record<string, number> = {
  ENERO: 0,
  FEBRERO: 1,
  MARZO: 2,
  ABRIL: 3,
  MAYO: 4,
  JUNIO: 5,
  JULIO: 6,
  AGOSTO: 7,
  SEPTIEMBRE: 8,
  SETIEMBRE: 8,
  OCTUBRE: 9,
  NOVIEMBRE: 10,
  DICIEMBRE: 11,
};

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

/** Rango por defecto: desde el próximo lunes, ~4,5 meses (duración típica de un ciclo). */
const defaultRange = (today: Date) => {
  const start = startOfDay(today);
  start.setDate(start.getDate() + ((1 + 7 - start.getDay()) % 7));
  const end = new Date(start);
  end.setMonth(end.getMonth() + 4);
  end.setDate(end.getDate() + 15);
  return { start, end };
};

/**
 * Calcula las fechas de inicio/fin para exportar el horario a un calendario.
 * Usa el período del SGU ("ABRIL 2026 - AGOSTO 2026") cuando es válido y no
 * ha terminado; si ya empezó, arranca desde hoy para no crear clases pasadas.
 */
export function getSemesterRange(academicPeriod: string | undefined, today: Date = new Date()): { start: Date; end: Date } {
  const match = academicPeriod
    ?.toUpperCase()
    .match(/([A-Z]+)\s+(\d{4})\s*-\s*([A-Z]+)\s+(\d{4})/);

  if (match) {
    const startMonth = MONTHS_ES[match[1]];
    const endMonth = MONTHS_ES[match[3]];
    if (startMonth !== undefined && endMonth !== undefined) {
      const periodStart = new Date(Number(match[2]), startMonth, 1);
      const periodEnd = new Date(Number(match[4]), endMonth + 1, 0); // último día del mes
      const todayStart = startOfDay(today);

      if (periodEnd >= todayStart && periodEnd > periodStart) {
        return { start: periodStart > todayStart ? periodStart : todayStart, end: periodEnd };
      }
    }
  }

  return defaultRange(today);
}
