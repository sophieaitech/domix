'use client';

import { useRouter, usePathname } from 'next/navigation';
import { Icon } from './ui';

const TABS = [
  { name: 'Inicio', path: '/', icon: 'home' },
  { name: 'Pedir', path: '/pedir', icon: 'add_circle' },
  { name: 'Mis pedidos', path: '/pedidos', icon: 'receipt_long' },
];

export default function BottomNav({ badges = {} }) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <nav
      style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 80,
        display: 'flex', alignItems: 'center', justifyContent: 'space-around',
        height: 74, paddingBottom: 8,
        background: 'rgba(251,250,248,.92)', backdropFilter: 'blur(18px)',
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
            <span style={{ position: 'relative', width: 62, height: 32, borderRadius: 'var(--sh-full)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: active ? 'var(--primary-container)' : 'transparent', transition: 'background .2s var(--ease)' }}>
              <Icon name={tab.icon} size={22} fill={active} color={active ? 'var(--on-primary-container)' : 'var(--on-surface-variant)'} />
              {badge > 0 && (
                <span style={{ position: 'absolute', top: 1, right: 12, minWidth: 16, height: 16, padding: '0 4px', borderRadius: 'var(--sh-full)', background: 'var(--tertiary)', color: '#fff', fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {badge}
                </span>
              )}
            </span>
            <span style={{ fontSize: 11, fontWeight: active ? 800 : 600, color: active ? 'var(--on-surface)' : 'var(--on-surface-variant)' }}>{tab.name}</span>
          </button>
        );
      })}
    </nav>
  );
}
