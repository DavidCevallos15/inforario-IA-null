import { describe, expect, it } from 'vitest';
import { redactPersonalData, textItemsToPlainText, TextItem } from './pdfText';
import fixture from './__fixtures__/sguReport.json';

describe('redactPersonalData', () => {
  it('quita nombre, cédula y código de matrícula pero conserva el horario', () => {
    const text = textItemsToPlainText(redactPersonalData(fixture as TextItem[]));

    expect(text).not.toContain('PEREZ GARCIA ANA MARIA');
    expect(text).not.toContain('0000000000');
    expect(text).not.toMatch(/Estudiante:|Cédula:|Código de matrícula:/);
    expect(text).toContain('FISICA I (A19)');
    expect(text).toContain('JUEVES (14:00:00-17:00:00)');
    expect(text).toContain('MAYO DEL 2022 HASTA SEPTIEMBRE DEL 2022');
  });
});

describe('textItemsToPlainText', () => {
  it('agrupa fragmentos por línea, ordena por x y separa páginas', () => {
    const text = textItemsToPlainText([
      { text: 'mundo', x: 100, y: 10, page: 1 },
      { text: 'Hola', x: 10, y: 11, page: 1 }, // misma línea (tolerancia 2)
      { text: 'Segunda', x: 10, y: 30, page: 1 },
      { text: 'Página 2', x: 10, y: 10, page: 2 },
    ]);

    expect(text).toBe('Hola mundo\nSegunda\n\nPágina 2');
  });
});
