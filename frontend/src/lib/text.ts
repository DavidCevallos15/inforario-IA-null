const LOWERCASE_WORDS = new Set(['de', 'del', 'la', 'las', 'los', 'y', 'e', 'en', 'a']);

/**
 * El SGU escribe todo en mayúsculas ("FACULTAD DE CIENCIAS INFORMÁTICAS").
 * Para leerlo de un vistazo se muestra en tipo título: "Facultad de Ciencias Informáticas".
 */
export const toDisplayCase = (text: string): string =>
  text
    .toLocaleLowerCase('es')
    .split(/\s+/)
    .filter(Boolean)
    .map((word, i) =>
      i > 0 && LOWERCASE_WORDS.has(word) ? word : word.replace(/^\p{L}/u, (c) => c.toLocaleUpperCase('es'))
    )
    .join(' ');
