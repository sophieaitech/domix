'use client';

import { useRouter, usePathname } from 'next/navigation';
import { Icon } from './ui';
import { useIdioma } from '../context/IdiomaProvider';

const TABS = [
  { clave: 'inicio', path: '/home', icon: 'home' },
  { clave: 'ganancias', path: '/ganancias', icon: 'payments' },
  { clave: 'entregas', path: '/entregas', icon: 'receipt_long' },
  { clave: 'cuenta', path: '/cuenta', icon: 'person' },
];

export default function BottomNav({ badges = {} }) {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useIdioma();

  return (
    <nav
      style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 80,
        display: 'flex', alignItems: 'center', justifyContent: 'space-around',
        height: 74, paddingBottom: 8,
        /* Con un color claro fijo, en modo oscuro la barra salía blanca
           al pie de una pantalla negra. Va por variable de tema. */
        background: 'var(--dx-nav-fondo)', backdropFilter: 'blur(18px)',
        borderTop: '1px solid var(--outline-variant)',
      }}
    >
      {TABS.map((tab) => {
        const active = pathname === tab.path;
        const badge = badges[tab.path];
        return (
          <button
            key={tab.path}
            onClick={() => router.push(tab.path)}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, paddingTop: 8, background: 'transparent' }}
          >
            {/* Indicador píldora de Material 3 */}
            <span
              style={{
                position: 'relative', width: 60, height: 32, borderRadius: 'var(--sh-full)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: active ? 'var(--primary-container)' : 'transparent',
                transition: 'background .2s var(--ease)',
              }}
            >
              <Icon name={tab.icon} size={22} fill={active} color={active ? 'var(--on-primary-container)' : 'var(--on-surface-variant)'} />
              {badge > 0 && (
                <span style={{ position: 'absolute', top: 1, right: 11, minWidth: 16, height: 16, padding: '0 4px', borderRadius: 'var(--sh-full)', background: 'var(--error)', color: '#fff', fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {badge}
                </span>
              )}
            </span>
            <span style={{ fontSize: 11, fontWeight: active ? 800 : 600, color: active ? 'var(--on-surface)' : 'var(--on-surface-variant)' }}>
              {t(`nav.${tab.clave}`)}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
