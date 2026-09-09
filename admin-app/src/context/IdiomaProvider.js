'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { TEXTOS } from '../lib/textos';

const KEY = 'domix_idioma';
const IdiomaContext = createContext(null);

/* Español e inglés.

   Buenaventura es puerto: llegan tripulaciones, operadores logísticos y
   gente de paso que no lee español. Para ellos el cambio de idioma es la
   diferencia entre usar la app y cerrarla.

   Se decide una sola vez y se recuerda. Quien nunca ha elegido arranca
   en el idioma de su teléfono, y si ese idioma no es inglés, en español:
   el público de todos los días es local.

   Falta a propósito un "automático": igual que con el tema, un ajuste
   que cambia solo confunde más de lo que ayuda. */
export function IdiomaProvider({ children }) {
  const [idioma, setIdioma] = useState('es');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let elegido = null;
    try { elegido = localStorage.getItem(KEY); } catch { /* ignorar */ }

    if (elegido !== 'es' && elegido !== 'en') {
      elegido = (navigator.language || '').toLowerCase().startsWith('en') ? 'en' : 'es';
    }

    setIdioma(elegido);
    document.documentElement.lang = elegido === 'en' ? 'en' : 'es-CO';
    setReady(true);
  }, []);

  const cambiarIdioma = useCallback((next) => {
    const valor = next === 'en' ? 'en' : 'es';
    setIdioma(valor);
    document.documentElement.lang = valor === 'en' ? 'en' : 'es-CO';
    try { localStorage.setItem(KEY, valor); } catch { /* ignorar */ }
  }, []);

  const alternar = useCallback(() => {
    cambiarIdioma(idioma === 'es' ? 'en' : 'es');
  }, [idioma, cambiarIdioma]);

  /* Busca por camino con puntos. Si al inglés le falta una frase se cae
     al español en vez de mostrar la clave cruda: es preferible una
     palabra en español que un "inicio.saludo" en pantalla. */
  const t = useCallback((camino, reemplazos) => {
    const buscar = (dic) => camino.split('.').reduce((o, k) => (o == null ? undefined : o[k]), dic);
    let texto = buscar(TEXTOS[idioma]);
    if (texto == null) texto = buscar(TEXTOS.es);
    if (texto == null) return camino;

    if (reemplazos) {
      for (const [k, v] of Object.entries(reemplazos)) texto = texto.split(`{${k}}`).join(v);
    }
    return texto;
  }, [idioma]);

  return (
    <IdiomaContext.Provider value={{ idioma, ready, t, cambiarIdioma, alternar, esIngles: idioma === 'en' }}>
      {children}
    </IdiomaContext.Provider>
  );
}

export function useIdioma() {
  const ctx = useContext(IdiomaContext);
  if (!ctx) throw new Error('useIdioma debe usarse dentro de IdiomaProvider');
  return ctx;
}
