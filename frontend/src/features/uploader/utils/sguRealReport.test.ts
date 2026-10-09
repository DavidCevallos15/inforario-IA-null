import { describe, expect, it } from 'vitest';
import { parseSguTextItems } from './sguRegexParser';
import { TextItem } from './pdfText';
import fixture from './__fixtures__/sguReport.json';

/**
 * Fragmentos extraídos con pdf.js de un reporte real del SGU (2 páginas),
 * con nombres, cédula y código de matrícula anonimizados.
 */
const result = parseSguTextItems(fixture as TextItem[]);

const summary = result.sessions.map((s) => [s.subject, s.day ?? null, s.startTime ?? null, s.endTime ?? null]);

describe('reporte real del SGU', () => {
  it('lee los metadatos del encabezado (etiquetas con tilde y mayúsculas mixtas)', () => {
    expect(result.academic_period).toBe('MAYO 2022 - SEPTIEMBRE 2022');
    expect(result.faculty).toBe('FACULTAD DE CIENCIAS INFORMÁTICAS');
    expect(result.career).toBe('TECNOLOGIAS DE LA INFORMACION');
  });

  it('extrae todas las materias, incluidas las de la página 2 y la que no tiene horario', () => {
    expect(new Set(result.sessions.map((s) => s.subject))).toEqual(
      new Set([
        'FISICA I',
        'CALCULO DE VARIAS VARIABLES',
        'ESTRUCTURAS DE DATOS',
        'INSTALACIONES ELECTRICAS Y DE CABLEADO ESTRUCTURADO',
        'ESTADISTICA',
      ])
    );
  });

  it('extrae cada bloque horario con su día y horas, en orden cronológico', () => {
    expect(summary).toEqual([
      ['INSTALACIONES ELECTRICAS Y DE CABLEADO ESTRUCTURADO', 'Lunes', '08:00', '11:00'],
      ['CALCULO DE VARIAS VARIABLES', 'Lunes', '11:00', '13:00'],
      ['INSTALACIONES ELECTRICAS Y DE CABLEADO ESTRUCTURADO', 'Martes', '08:00', '10:00'],
      ['CALCULO DE VARIAS VARIABLES', 'Martes', '11:00', '13:00'],
      ['ESTRUCTURAS DE DATOS', 'Jueves', '07:00', '11:00'],
      ['FISICA I', 'Jueves', '14:00', '17:00'],
      ['ESTADISTICA', null, null, null],
    ]);
  });

  it('no confunde paralelo/créditos ni la leyenda con el nombre del docente', () => {
    const teachers = Object.fromEntries(result.sessions.map((s) => [s.subject, s.teacher]));
    expect(teachers).toEqual({
      'FISICA I': 'Lucia Torres',
      'CALCULO DE VARIAS VARIABLES': 'Raul Mora',
      'ESTRUCTURAS DE DATOS': 'Pedro Rios',
      'INSTALACIONES ELECTRICAS Y DE CABLEADO ESTRUCTURADO': 'Mario Leon',
      ESTADISTICA: 'Rosa Solis',
    });
  });

  it('incluye aula, piso y edificio', () => {
    const find = (subject: string, day: string) =>
      result.sessions.find((s) => s.subject === subject && s.day === day);

    expect(find('FISICA I', 'Jueves')).toMatchObject({ location: 'Aula 207 - Piso 2 - Ciencias Básicas I', floor: '2' });
    expect(find('CALCULO DE VARIAS VARIABLES', 'Lunes')?.location).toBe('Aula 202 - Piso 2 - Filosofia/Posgrado');
    expect(find('ESTRUCTURAS DE DATOS', 'Jueves')?.location).toBe('Lab. Computación 204 - Piso 2 - Ciencias Informáticas');
    expect(find('INSTALACIONES ELECTRICAS Y DE CABLEADO ESTRUCTURADO', 'Martes')).toMatchObject({
      location: 'Lab. Computación 102 - Piso 1 - Ciencias Informáticas',
      floor: '1',
    });
  });

  it('conserva la materia sin horario asignado y no marca choques falsos', () => {
    expect(result.sessions.find((s) => s.subject === 'ESTADISTICA')).toMatchObject({
      isVirtual: false,
      location: 'Horario no asignado',
    });
    expect(result.sessions.some((s) => s.conflict)).toBe(false);
  });
});
