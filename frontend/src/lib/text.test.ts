import { describe, expect, it } from 'vitest';
import { toDisplayCase } from './text';

describe('toDisplayCase', () => {
  it('convierte las mayúsculas del SGU en tipo título con artículos en minúscula', () => {
    expect(toDisplayCase('FACULTAD DE CIENCIAS INFORMÁTICAS')).toBe('Facultad de Ciencias Informáticas');
    expect(toDisplayCase('MAYO 2022 - SEPTIEMBRE 2022')).toBe('Mayo 2022 - Septiembre 2022');
    expect(toDisplayCase('ÉTICA Y LEGISLACIÓN')).toBe('Ética y Legislación');
  });
});
