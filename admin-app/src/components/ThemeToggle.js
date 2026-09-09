'use client';

import { useTheme } from '../context/ThemeProvider';
import { Icon } from './ui';

/* Un interruptor de dos posiciones. Muestra la luna cuando está en
   claro (lo que va a pasar si lo tocas) y el sol cuando está en oscuro.
   Es la convención de casi todas las apps: el icono anuncia el destino,
   no el estado actual. */
export default function ThemeToggle({ compact = false }) {
  const { esOscuro, cycleTheme, ready } = useTheme();
  const size = compact ? 34 : 38;
  const destino = esOscuro ? 'Claro' : 'Oscuro';

  return (
    <button
      onClick={cycleTheme}
      title={`Cambiar a modo ${destino.toLowerCase()}`}
      aria-label={`Cambiar a modo ${destino.toLowerCase()}`}
      style={{
        width: size, height: size, borderRadius: 'var(--sh-sm)', flex: 'none',
        background: 'var(--surface-container)', border: '1px solid var(--outline-variant)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        opacity: ready ? 1 : 0, transition: 'opacity .2s var(--ease)',
      }}
    >
      <Icon
        name={esOscuro ? 'light_mode' : 'dark_mode'}
        size={compact ? 18 : 20}
        fill
        color="var(--on-surface-variant)"
      />
    </button>
  );
}
