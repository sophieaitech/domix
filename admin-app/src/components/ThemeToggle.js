'use client';

import { useTheme } from '../context/ThemeProvider';
import { Icon } from './ui';

const MODES = {
  light: { icon: 'light_mode', label: 'Claro' },
  dark: { icon: 'dark_mode', label: 'Oscuro' },
  auto: { icon: 'brightness_auto', label: 'Automático' },
};

/* Un solo botón que rota entre claro → oscuro → automático. */
export default function ThemeToggle({ compact = false }) {
  const { theme, cycleTheme, ready } = useTheme();
  const m = MODES[theme] || MODES.auto;
  const size = compact ? 34 : 38;

  return (
    <button
      onClick={cycleTheme}
      title={`Tema: ${m.label} (clic para cambiar)`}
      aria-label={`Cambiar tema, actualmente ${m.label}`}
      style={{
        width: size, height: size, borderRadius: 'var(--sh-sm)', flex: 'none',
        background: 'var(--surface-container)', border: '1px solid var(--outline-variant)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        opacity: ready ? 1 : 0, transition: 'opacity .2s var(--ease)',
      }}
    >
      <Icon name={m.icon} size={compact ? 18 : 20} fill color="var(--on-surface-variant)" />
    </button>
  );
}
