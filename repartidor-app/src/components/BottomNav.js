'use client';

import { useRouter, usePathname } from 'next/navigation';

const TABS = [
  { name: 'Inicio', path: '/home' },
  { name: 'Ganancias', path: '/ganancias' },
  { name: 'Entregas', path: '/entregas' },
  { name: 'Cuenta', path: '/cuenta' },
];

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div
      style={{
        position: 'absolute', bottom: 0, left: 0, width: '100%', height: '76px',
        background: 'var(--sf)', borderTop: '1px solid var(--bd)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-around',
        zIndex: 100, paddingBottom: '8px',
      }}
    >
      {TABS.map((tab) => {
        const active = pathname === tab.path;
        return (
          <button
            key={tab.path}
            onClick={() => router.push(tab.path)}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
              padding: '8px 14px', borderRadius: '14px',
              background: active ? 'var(--navyS)' : 'transparent',
              color: active ? 'var(--navy)' : 'var(--mu)',
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: active ? 'var(--navy)' : 'var(--bd)' }} />
            <span style={{ font: '600 11px Manrope,sans-serif', letterSpacing: '-0.01em' }}>{tab.name}</span>
          </button>
        );
      })}
    </div>
  );
}
