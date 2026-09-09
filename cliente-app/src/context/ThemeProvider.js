'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';

const KEY = 'domix_theme';
const ThemeContext = createContext(null);

/* Dos estados: claro y oscuro. Nada más.

   El "automático" se quitó porque no se podía explicar en un botón: la
   gente lo tocaba, no veía cambiar nada (porque su sistema ya estaba en
   ese modo) y lo volvía a tocar. Un interruptor de dos posiciones no
   tiene ese problema.

   El sistema sigue contando, pero solo la primera vez: quien nunca ha
   elegido arranca en el modo de su teléfono. Desde que elige, manda su
   elección.

   Quién pinta primero: el guion que va en el <head> ya dejó puesto
   data-theme antes de que el navegador pintara. Aquí solo se lee lo que
   ese guion decidió, para no encender la app en claro y voltearla a
   oscuro un instante después. */
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const puesto = document.documentElement.getAttribute('data-theme');
    setTheme(puesto === 'dark' ? 'dark' : 'light');
    setReady(true);
  }, []);

  const changeTheme = useCallback((next) => {
    const valor = next === 'dark' ? 'dark' : 'light';
    setTheme(valor);
    document.documentElement.setAttribute('data-theme', valor);
    try { localStorage.setItem(KEY, valor); } catch { /* ignorar */ }
  }, []);

  const cycleTheme = useCallback(() => {
    changeTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, changeTheme]);

  return (
    <ThemeContext.Provider value={{ theme, ready, changeTheme, cycleTheme, esOscuro: theme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme debe usarse dentro de ThemeProvider');
  return ctx;
}
