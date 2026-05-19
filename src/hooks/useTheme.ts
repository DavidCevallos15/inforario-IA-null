import { useState, useCallback } from 'react';
import { ScheduleTheme, SCHEDULE_THEMES } from '../types';

interface UseThemeReturn {
  theme: ScheduleTheme;
  fontScale: number;
  setTheme: (theme: ScheduleTheme) => void;
  setFontScale: (scale: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetTheme: () => void;
  availableThemes: readonly ScheduleTheme[];
}

const MIN_FONT_SCALE = 0.7;
const MAX_FONT_SCALE = 1.5;
const FONT_SCALE_STEP = 0.1;
const DEFAULT_FONT_SCALE = 1;
const DEFAULT_THEME: ScheduleTheme = 'DEFAULT';

export function useTheme(): UseThemeReturn {
  const [theme, setThemeState] = useState<ScheduleTheme>(DEFAULT_THEME);
  const [fontScale, setFontScaleState] = useState(DEFAULT_FONT_SCALE);

  const setTheme = useCallback((newTheme: ScheduleTheme) => {
    if (SCHEDULE_THEMES.includes(newTheme)) {
      setThemeState(newTheme);
    }
  }, []);

  const setFontScale = useCallback((scale: number) => {
    const clampedScale = Math.min(MAX_FONT_SCALE, Math.max(MIN_FONT_SCALE, scale));
    setFontScaleState(clampedScale);
  }, []);

  const zoomIn = useCallback(() => {
    setFontScaleState(prev => Math.min(prev + FONT_SCALE_STEP, MAX_FONT_SCALE));
  }, []);

  const zoomOut = useCallback(() => {
    setFontScaleState(prev => Math.max(prev - FONT_SCALE_STEP, MIN_FONT_SCALE));
  }, []);

  const resetTheme = useCallback(() => {
    setThemeState(DEFAULT_THEME);
    setFontScaleState(DEFAULT_FONT_SCALE);
  }, []);

  return {
    theme,
    fontScale,
    setTheme,
    setFontScale,
    zoomIn,
    zoomOut,
    resetTheme,
    availableThemes: SCHEDULE_THEMES,
  };
}
