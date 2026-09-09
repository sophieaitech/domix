'use client';

import { useRouter, usePathname } from 'next/navigation';
import { Icon } from './ui';
import { useIdioma } from '../context/IdiomaProvider';

const TABS = [
  { clave: 'inicio', path: '/', icon: 'home' },
  { clave: 'servicios', path: '/servicios', icon: 'apps' },
  { clave: 'actividad', path: '/pedidos', icon: 'receipt_long' },
  { clave: 'cuenta', path: '/cuenta', icon: 'person' },
];

/* Barra flotante tipo píldora, como la de Turapp. */
export default function BottomNav({ badges = {} }) {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useIdioma();

  return (
    <div
      style={{
        position: 'absolute', bottom: 16, left: 12, right: 12, height: 62,
        borderRadius: 99, background: 'var(--bg)',
        boxShadow: 'var(--sh3), 0 0 0 1px var(--bd2)',
        display: 'flex', alignItems: 'center', padding: 5, zIndex: 50,
      }}
    >
      {TABS.map((tab) => {
        const active = pathname === tab.path;
        const badge = badges[tab.path];
        return (
          <button
            key={tab.path}
            onClick={() => router.push(tab.path)}
            style={{
              flex: 1, height: 52, borderRadius: 99, position: 'relative',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
              background: active ? 'var(--sf2)' : 'transparent',
              color: active ? 'var(--tx)' : 'var(--mu)',
            }}
          >
            <Icon name={tab.icon} size={21} fill={active} />
            <span style={{ font: '700 10.5px Manrope,sans-serif' }}>{t(`nav.${tab.clave}`)}</span>
            {badge > 0 && (
              <span style={{ position: 'absolute', top: 7, right: '50%', marginRight: -20, minWidth: 17, height: 17, padding: '0 4px', borderRadius: 99, background: 'var(--green)', color: '#fff', font: '800 10px Manrope,sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
