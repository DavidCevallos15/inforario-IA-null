/**
 * Resaltadores del cuaderno: el único uso del color para identificar materias.
 * El rojo queda reservado para los choques de horario, por eso no está aquí.
 */
export const HIGHLIGHTERS = [
  { name: 'Amarillo', hex: '#f6e84b' },
  { name: 'Verde', hex: '#8fe39a' },
  { name: 'Rosado', hex: '#ff9fcf' },
  { name: 'Naranja', hex: '#ffbd6b' },
  { name: 'Celeste', hex: '#7fd8f3' },
  { name: 'Lila', hex: '#c3b0ff' },
  { name: 'Limón', hex: '#d4f26b' },
] as const;

export const HIGHLIGHTER_HEXES: string[] = HIGHLIGHTERS.map((h) => h.hex);

export const DEFAULT_HIGHLIGHTER = HIGHLIGHTERS[0].hex;

const parseHex = (hex: string) => {
  const cleaned = hex.replace('#', '').trim();
  if (cleaned.length !== 6) return null;
  return {
    r: parseInt(cleaned.slice(0, 2), 16),
    g: parseInt(cleaned.slice(2, 4), 16),
    b: parseInt(cleaned.slice(4, 6), 16),
  };
};

/** Tinta legible sobre un color: oscura sobre resaltadores, blanca sobre colores profundos (horarios antiguos). */
export const inkOn = (hex: string): string => {
  const rgb = parseHex(hex);
  if (!rgb) return '#14213d';
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance > 0.55 ? '#14213d' : '#ffffff';
};

export const hexToRgb = (hex: string) => parseHex(hex) ?? { r: 246, g: 232, b: 75 };
