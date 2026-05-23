import { useState, useEffect } from 'react';
import type { JSX, ReactNode } from 'react';
import { ThemeModeContext, STORAGE_KEY, getInitialMode } from './ThemeModeContext';

export function ThemeModeProvider({ children }: { children: ReactNode }): JSX.Element {
  const [mode, setModeState] = useState(getInitialMode);

  const setMode = (next: 'light' | 'dark') => {
    setModeState(next);
    localStorage.setItem(STORAGE_KEY, next);
  };

  const toggle = () => {
    setModeState(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', mode);
  }, [mode]);

  return (
    <ThemeModeContext.Provider value={{ mode, isDark: mode === 'dark', setMode, toggle }}>
      {children}
    </ThemeModeContext.Provider>
  );
}
