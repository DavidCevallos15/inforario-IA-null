/**
 * Separación silábica para títulos en español: inserta guiones suaves (U+00AD)
 * donde una palabra puede partirse. El navegador solo corta en esos puntos y
 * muestra el guion, sin depender de `hyphens: auto` (que no todos aplican).
 *
 * Reglas (simplificadas y conservadoras):
 * - Vocales seguidas se tratan como una sola sílaba: se pierden cortes en hiatos, nunca se corta mal.
 * - Una consonante entre vocales va con la vocal siguiente (CA-SA).
 * - Dos consonantes se separan (AS-TA), salvo grupos inseparables (TR, BL, CH, LL, RR…).
 * - Tres o más: el grupo inseparable final pasa a la sílaba siguiente (ELEC-TRI-CA, INS-TA-LA).
 * - Nunca deja menos de dos letras en un extremo (sin letras huérfanas como "A").
 */

const SOFT_HYPHEN = '­';
const VOWELS = new Set('aeiouáéíóúü');
const INSEPARABLE = new Set(['bl', 'br', 'cl', 'cr', 'dr', 'fl', 'fr', 'gl', 'gr', 'kl', 'kr', 'pl', 'pr', 'tr', 'tl', 'ch', 'll', 'rr']);

const isVowel = (c: string) => VOWELS.has(c);

/** Índices (en la palabra) donde puede empezar una sílaba nueva. */
const breakPoints = (word: string): number[] => {
  const lower = word.toLocaleLowerCase('es');
  const points: number[] = [];
  let i = 0;
  // Avanzar hasta la primera vocal
  while (i < lower.length && !isVowel(lower[i])) i++;
  while (i < lower.length) {
    // Saltar el núcleo vocálico
    while (i < lower.length && isVowel(lower[i])) i++;
    const start = i;
    while (i < lower.length && !isVowel(lower[i])) i++;
    if (i >= lower.length) break; // consonantes finales: se quedan en la última sílaba
    const cluster = lower.slice(start, i);
    let cut: number;
    if (cluster.length <= 1) cut = start;
    else if (INSEPARABLE.has(cluster.slice(-2))) cut = i - 2;
    else cut = i - 1;
    points.push(cut);
  }
  return points.filter((p) => p >= 2 && word.length - p >= 2);
};

export const hyphenateWord = (word: string): string => {
  if (word.length < 5 || !/^\p{L}+$/u.test(word)) return word;
  const points = breakPoints(word);
  let out = '';
  let last = 0;
  for (const p of points) {
    out += word.slice(last, p) + SOFT_HYPHEN;
    last = p;
  }
  return out + word.slice(last);
};

/** Aplica la separación silábica a cada palabra de un texto. */
export const hyphenateEs = (text: string): string => text.replace(/\p{L}+/gu, hyphenateWord);
