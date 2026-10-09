import { describe, expect, it } from 'vitest';
import { ClassSession } from '../../../types';
import {
  assignSubjectColors,
  normalizeAcademicPeriod,
  normalizeLocation,
  normalizeTeacherName,
  parseSguTextItems,
  resolveConflicts,
} from './sguRegexParser';
import { TextItem } from './pdfText';

const session = (overrides: Partial<ClassSession>): ClassSession => ({
  id: crypto.randomUUID(),
  subject: 'MATERIA',
  teacher: 'Docente',
  location: 'Aula',
  ...overrides,
});

describe('normalizeTeacherName', () => {
  it('convierte "APELLIDO1 APELLIDO2 NOMBRE1 NOMBRE2" en "Nombre Apellido"', () => {
    expect(normalizeTeacherName('PEREZ GOMEZ JUAN CARLOS')).toBe('Juan Perez');
  });

  it('elimina títulos académicos, incluso dobles', () => {
    expect(normalizeTeacherName('ING. PEREZ GOMEZ JUAN')).toBe('Juan Perez');
    expect(normalizeTeacherName('ING. MSC. PEREZ GOMEZ JUAN')).toBe('Juan Perez');
  });

  it('no recorta apellidos o nombres que empiezan como un título', () => {
    expect(normalizeTeacherName('DRAGO SANCHEZ INGRID')).toBe('Ingrid Drago');
    expect(normalizeTeacherName('LICEA MORA PROSPERO')).toBe('Prospero Licea');
  });

  it('maneja vacíos y docentes temporales', () => {
    expect(normalizeTeacherName('')).toBe('Sin asignar');
    expect(normalizeTeacherName('TEMP DOCENTE 01')).toBe('Sin asignar');
  });

  it('invierte nombres de dos palabras', () => {
    expect(normalizeTeacherName('PEREZ JUAN')).toBe('Juan Perez');
  });
});

describe('normalizeLocation', () => {
  it('decodifica el código de ambiente UTM', () => {
    expect(normalizeLocation('1-59-2-04-A')).toBe('Aula 204 - Piso 2');
    expect(normalizeLocation('1-59-3-06-LC')).toBe('Lab. Computación 306 - Piso 3');
  });

  it('usa el TIPO para detectar laboratorios', () => {
    expect(normalizeLocation('1-59-1-02-X', 'LABORATORIO')).toBe('Lab. Computación 102 - Piso 1');
  });

  it('conserva códigos de otras facultades', () => {
    expect(normalizeLocation('ADM-12;', 'AULA')).toBe('AULA ADM-12');
    expect(normalizeLocation('')).toBe('Sin asignar');
  });
});

describe('normalizeAcademicPeriod', () => {
  it('compacta el período del SGU', () => {
    expect(normalizeAcademicPeriod('ABRIL DE 2026 HASTA AGOSTO DE 2026')).toBe('ABRIL 2026 - AGOSTO 2026');
    expect(normalizeAcademicPeriod('septiembre del 2025 hasta enero del 2026')).toBe('SEPTIEMBRE 2025 - ENERO 2026');
  });

  it('devuelve el texto en mayúsculas si no reconoce el formato', () => {
    expect(normalizeAcademicPeriod(' periodo raro ')).toBe('PERIODO RARO');
  });
});

describe('resolveConflicts', () => {
  it('marca solo las sesiones que se solapan el mismo día', () => {
    const a = session({ subject: 'A', day: 'Lunes', startTime: '07:00', endTime: '09:00' });
    const b = session({ subject: 'B', day: 'Lunes', startTime: '08:00', endTime: '10:00' });
    const c = session({ subject: 'C', day: 'Lunes', startTime: '09:00', endTime: '11:00' }); // contiguo a A
    const d = session({ subject: 'D', day: 'Martes', startTime: '07:00', endTime: '09:00' });

    const result = resolveConflicts([a, b, c, d]);
    const bySubject = Object.fromEntries(result.map((s) => [s.subject, s.conflict]));

    expect(bySubject).toEqual({ A: true, B: true, C: true, D: false });
  });

  it('no muta el arreglo recibido y limpia conflictos previos', () => {
    const a = session({ day: 'Lunes', startTime: '07:00', endTime: '08:00', conflict: true });
    const input = [a];
    const result = resolveConflicts(input);

    expect(a.conflict).toBe(true);
    expect(result[0].conflict).toBe(false);
    expect(result[0]).not.toBe(a);
  });

  it('ordena cronológicamente (Lunes antes que Jueves) y deja virtuales al final', () => {
    const virtual = session({ subject: 'V', isVirtual: true });
    const jueves = session({ subject: 'J', day: 'Jueves', startTime: '07:00', endTime: '08:00' });
    const lunes = session({ subject: 'L', day: 'Lunes', startTime: '10:00', endTime: '11:00' });

    expect(resolveConflicts([virtual, jueves, lunes]).map((s) => s.subject)).toEqual(['L', 'J', 'V']);
  });
});

describe('assignSubjectColors', () => {
  it('asigna el mismo color a todas las sesiones de una materia y respeta los existentes', () => {
    const result = assignSubjectColors([
      session({ subject: 'REDES', color: '#123456' }),
      session({ subject: 'redes' }),
      session({ subject: 'BASES' }),
      session({ subject: 'BASES' }),
    ]);

    expect(result[1].color).toBe('#123456');
    expect(result[2].color).toBeTruthy();
    expect(result[2].color).toBe(result[3].color);
    expect(result[2].color).not.toBe('#123456');
  });
});

/**
 * Reproduce la disposición por columnas del reporte del SGU:
 * ASIGNATURA (x<170) · DOCENTE (260–415) · HORARIO Y AMBIENTE (x≥495).
 */
const sguLayout = (): TextItem[] => [
  { text: 'PERIODO:', x: 40, y: 100, page: 1 },
  { text: 'ABRIL DE 2026 HASTA AGOSTO DE 2026', x: 120, y: 100, page: 1 },
  { text: 'FACULTAD:', x: 40, y: 115, page: 1 },
  { text: 'FACULTAD DE CIENCIAS INFORMÁTICAS', x: 120, y: 115, page: 1 },
  { text: 'ESTUDIANTE:', x: 40, y: 130, page: 1 },
  { text: 'ALUMNO DE PRUEBA', x: 120, y: 130, page: 1 },

  { text: 'ASIGNATURA', x: 40, y: 220, page: 1 },
  { text: 'DOCENTE', x: 363, y: 220, page: 1 },
  { text: 'HORARIO Y AMBIENTE', x: 500, y: 220, page: 1 },

  // Materia 1: dos bloques presenciales
  { text: 'SISTEMAS DISTRIBUIDOS (A19)', x: 40, y: 250, page: 1 },
  { text: 'ING. PEREZ GOMEZ JUAN CARLOS', x: 330, y: 250, page: 1 },
  { text: '- LUNES (07:00:00-09:00:00)', x: 500, y: 245, page: 1 },
  { text: 'COD. AMB.: 1-59-2-04-A; TIPO: AULA', x: 500, y: 255, page: 1 },
  { text: '- MIERCOLES (07:00:00-09:00:00)', x: 500, y: 265, page: 1 },

  // Materia 2: choca con la materia 1 el lunes
  { text: 'INGENIERIA DE SOFTWARE', x: 40, y: 300, page: 1 },
  { text: 'LIC. LOPEZ DIAZ MARIA', x: 330, y: 300, page: 1 },
  { text: '- LUNES (08:00:00-10:00:00)', x: 500, y: 300, page: 1 },
  { text: 'COD. AMB.: 1-59-3-06-LC; TIPO: LABORATORIO', x: 500, y: 310, page: 1 },

  // Materia 3: virtual
  { text: 'ETICA PROFESIONAL', x: 40, y: 350, page: 1 },
  { text: 'TEMP DOCENTE', x: 330, y: 350, page: 1 },
  { text: 'MATERIA VIRTUAL', x: 500, y: 350, page: 1 },

  { text: 'LEYENDAS', x: 40, y: 420, page: 1 },
];

describe('parseSguTextItems (layout SGU)', () => {
  const result = parseSguTextItems(sguLayout());

  it('lee los metadatos del encabezado', () => {
    expect(result.academic_period).toBe('ABRIL 2026 - AGOSTO 2026');
    expect(result.faculty).toBe('FACULTAD DE CIENCIAS INFORMÁTICAS');
    expect(result.student_name).toBe('ALUMNO DE PRUEBA');
  });

  it('extrae cada bloque horario asociado a su materia y docente', () => {
    const presencial = result.sessions.filter((s) => !s.isVirtual);
    expect(presencial.map((s) => [s.subject, s.day, s.startTime, s.endTime])).toEqual([
      ['SISTEMAS DISTRIBUIDOS', 'Lunes', '07:00', '09:00'],
      ['INGENIERIA DE SOFTWARE', 'Lunes', '08:00', '10:00'],
      ['SISTEMAS DISTRIBUIDOS', 'Miércoles', '07:00', '09:00'],
    ]);

    const sd = presencial[0];
    expect(sd.teacher).toBe('Juan Perez');
    expect(sd.location).toBe('Aula 204 - Piso 2');
    expect(sd.floor).toBe('2');

    expect(presencial[1].location).toBe('Lab. Computación 306 - Piso 3');
  });

  it('detecta el choque de horario del lunes', () => {
    const conflicts = result.sessions.filter((s) => s.conflict).map((s) => s.subject);
    expect(conflicts.sort()).toEqual(['INGENIERIA DE SOFTWARE', 'SISTEMAS DISTRIBUIDOS']);
    expect(result.sessions.find((s) => s.day === 'Miércoles')?.conflict).toBe(false);
  });

  it('incluye las materias virtuales sin horario', () => {
    const virtual = result.sessions.filter((s) => s.isVirtual);
    expect(virtual).toHaveLength(1);
    expect(virtual[0]).toMatchObject({ subject: 'ETICA PROFESIONAL', location: 'Virtual', teacher: 'Sin asignar' });
  });

  it('usa el mismo color para todos los bloques de una materia', () => {
    const sd = result.sessions.filter((s) => s.subject === 'SISTEMAS DISTRIBUIDOS');
    expect(new Set(sd.map((s) => s.color)).size).toBe(1);
  });
});
