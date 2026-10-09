import { describe, expect, it } from 'vitest';
import { hyphenateEs, hyphenateWord } from './hyphenate';

// Muestra los guiones suaves como "-" para leer los casos
const show = (s: string) => s.replace(/­/g, '-');

describe('hyphenateWord', () => {
  it('separa por sílabas las materias reales del SGU', () => {
    expect(show(hyphenateWord('ESTADISTICA'))).toBe('ES-TA-DIS-TI-CA');
    expect(show(hyphenateWord('INSTALACIONES'))).toBe('INS-TA-LA-CIO-NES');
    expect(show(hyphenateWord('ELECTRICAS'))).toBe('ELEC-TRI-CAS');
    expect(show(hyphenateWord('ESTRUCTURADO'))).toBe('ES-TRUC-TU-RA-DO');
    expect(show(hyphenateWord('VARIABLES'))).toBe('VA-RIA-BLES');
  });

  it('respeta grupos inseparables y dígrafos', () => {
    expect(show(hyphenateWord('CABLEADO'))).toBe('CA-BLEA-DO');
    expect(show(hyphenateWord('PROGRAMACION'))).toBe('PRO-GRA-MA-CION');
  });

  it('nunca deja una letra sola en un extremo', () => {
    expect(show(hyphenateWord('ACADEMIA'))).not.toMatch(/^.-|-.$/);
    expect(show(hyphenateWord('OCEANO'))).not.toMatch(/^.-|-.$/);
  });

  it('no toca palabras cortas ni códigos', () => {
    expect(hyphenateWord('DE')).toBe('DE');
    expect(show(hyphenateWord('FISICA'))).toBe('FI-SI-CA');
    expect(show(hyphenateEs('A19 FISICA I'))).toBe('A19 FI-SI-CA I');
  });
});
