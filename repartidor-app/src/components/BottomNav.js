'use client';

import { useRouter, usePathname } from 'next/navigation';
import Icon from './Icon';

const TABS = [
  { name: 'Inicio', path: '/home', icon: 'home' },
  { name: 'Ganancias', path: '/ganancias', icon: 'payments' },
  { name: 'Entregas', path: '/entregas', icon: 'receipt_long' },
  { name: 'Cuenta', path: '/cuenta', icon: 'person' },
];

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', padding: '8px 14px 22px', pointerEvents: 'none', zIndex: 80 }}>
      <div
        style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          height: 60, borderRadius: 999, background: 'rgba(255,255,255,.88)', backdropFilter: 'blur(16px)',
          border: '1px solid var(--border)', boxShadow: 'var(--shadow)', padding: '0 6px', pointerEvents: 'auto',
        }}
      >
        {TABS.map((tab) => {
          const active = pathname === tab.path;
          return (
            <button
              key={tab.path}
              onClick={() => router.push(tab.path)}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: 2, height: 48, borderRadius: 999,
                background: active ? 'var(--navySoft)' : 'transparent',
                color: active ? 'var(--navy)' : 'var(--muted)',
              }}
            >
              <Icon name={tab.icon} size={22} fill={active} />
              <span style={{ fontSize: 10.5, fontWeight: 700 }}>{tab.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
