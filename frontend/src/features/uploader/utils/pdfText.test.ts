import { describe, expect, it } from 'vitest';
import { textItemsToPlainText } from './pdfText';

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
