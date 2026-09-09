'use client';

import { useIdioma } from '../context/IdiomaProvider';

/* Dos letras y ya: ES / EN.

   Deliberadamente discreto. Quien lo necesita lo busca y lo encuentra;
   quien no, no debería tropezarse con él. Por eso no lleva bandera:
   una bandera dice país, no idioma, y aquí el inglés no es de ningún
   país en particular. */
export default function IdiomaToggle({ compact = false }) {
  const { idioma, alternar, ready } = useIdioma();
  const alto = compact ? 34 : 38;
  const otro = idioma === 'es' ? 'English' : 'Español';

  return (
    <button
      onClick={alternar}
      title={`Cambiar a ${otro}`}
      aria-label={`Cambiar a ${otro}`}
      style={{
        height: alto, minWidth: alto, padding: '0 10px', borderRadius: 'var(--sh-sm)', flex: 'none',
        background: 'var(--surface-container)', border: '1px solid var(--outline-variant)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        font: `700 ${compact ? 11.5 : 12.5}px Manrope, sans-serif`,
        letterSpacing: '.06em', color: 'var(--on-surface-variant)',
        opacity: ready ? 1 : 0, transition: 'opacity .2s var(--ease)',
      }}
    >
      {idioma === 'es' ? 'ES' : 'EN'}
    </button>
  );
}
