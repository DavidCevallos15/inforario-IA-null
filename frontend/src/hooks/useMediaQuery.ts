import { useState, useEffect } from 'react';

const getMatches = (query: string): boolean =>
  typeof window !== 'undefined' && window.matchMedia(query).matches;

export const useMediaQuery = (query: string): boolean => {
  // Valor inicial real: evita renderizar la vista de escritorio un instante en móviles
  const [matches, setMatches] = useState<boolean>(() => getMatches(query));

  useEffect(() => {
    const media = window.matchMedia(query);
    setMatches(media.matches);
    const listener = (event: MediaQueryListEvent) => setMatches(event.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [query]);

  return matches;
};
