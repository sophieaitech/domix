'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';

const KEY = 'domix_theme';
const ThemeContext = createContext(null);

/* Tres estados: claro, oscuro y automático (sigue al sistema). */
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('auto');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let saved = 'auto';
    try { saved = localStorage.getItem(KEY) || 'auto'; } catch { /* ignorar */ }
    setTheme(saved);
    document.documentElement.setAttribute('data-theme', saved);
    setReady(true);
  }, []);

  const changeTheme = useCallback((next) => {
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem(KEY, next); } catch { /* ignorar */ }
  }, []);

  const cycleTheme = useCallback(() => {
    const order = ['light', 'dark', 'auto'];
    changeTheme(order[(order.indexOf(theme) + 1) % order.length]);
  }, [theme, changeTheme]);

  return (
    <ThemeContext.Provider value={{ theme, ready, changeTheme, cycleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme debe usarse dentro de ThemeProvider');
  return ctx;
}
