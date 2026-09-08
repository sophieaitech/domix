'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';

const KEY = 'domix_mode';
const AppModeContext = createContext(null);

/* DEMO: operación simulada, con métricas e historial para mostrar el sistema.
   EN VIVO: solo datos reales de Supabase (arranca en ceros). */
export function AppModeProvider({ children, defaultMode = 'demo' }) {
  const [mode, setMode] = useState(defaultMode);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved === 'demo' || saved === 'live') setMode(saved);
    } catch { /* almacenamiento no disponible */ }
    setReady(true);
  }, []);

  const changeMode = useCallback((next) => {
    setMode(next);
    try { localStorage.setItem(KEY, next); } catch { /* ignorar */ }
  }, []);

  const toggleMode = useCallback(() => changeMode(mode === 'demo' ? 'live' : 'demo'), [mode, changeMode]);

  return (
    <AppModeContext.Provider value={{ mode, isDemo: mode === 'demo', isLive: mode === 'live', ready, changeMode, toggleMode }}>
      {children}
    </AppModeContext.Provider>
  );
}

export function useAppMode() {
  const ctx = useContext(AppModeContext);
  if (!ctx) throw new Error('useAppMode debe usarse dentro de AppModeProvider');
  return ctx;
}
