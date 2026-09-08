'use client';

import { useRouter, usePathname } from 'next/navigation';
import { Icon, Chip } from './ui';
import { useOps } from '../context/OpsProvider';

const GROUPS = [
  {
    label: 'Operación',
    items: [
      { label: 'Panel general', path: '/', icon: 'dashboard' },
      { label: 'Pedidos en vivo', path: '/pedidos', icon: 'receipt_long', badge: 'pending' },
      { label: 'Mapa de flota', path: '/mapa', icon: 'explore' },
    ],
  },
  {
    label: 'Red Domix',
    items: [
      { label: 'Repartidores', path: '/repartidores', icon: 'two_wheeler' },
      { label: 'Sedes y ciudades', path: '/sedes', icon: 'location_city' },
    ],
  },
  {
    label: 'Configuración',
    items: [
      { label: 'Motor de despacho', path: '/despacho', icon: 'tune' },
      { label: 'Domix Turbo', path: '/turbo', icon: 'bolt', tag: 'PRO' },
    ],
  },
  {
    label: 'Seguridad y equipo',
    items: [
      { label: 'Roles y permisos', path: '/equipo', icon: 'shield_person' },
    ],
  },
];

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { stats } = useOps();

  return (
    <aside className="dx-sidebar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '0 8px 20px' }}>
        <span style={{ width: 42, height: 42, borderRadius: 'var(--sh-sm)', background: 'linear-gradient(150deg,#57A82F,#43922B)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none', boxShadow: '0 4px 14px rgba(67,146,43,.34)' }}>
          <Icon name="two_wheeler" size={23} fill color="#fff" />
        </span>
        <span style={{ minWidth: 0 }}>
          <span className="dsp" style={{ display: 'block', fontWeight: 800, fontSize: 19, lineHeight: 1 }}>
            Domi<span style={{ color: '#8CCB6E' }}>X</span>
          </span>
          <span style={{ display: 'block', fontSize: 9, fontWeight: 800, letterSpacing: '.1em', color: 'rgba(255,255,255,.5)', marginTop: 3 }}>
            PANEL INTERNO
          </span>
        </span>
      </div>

      <nav className="sc" style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
        {GROUPS.map((g) => (
          <div key={g.label} style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '.11em', color: 'rgba(255,255,255,.38)', padding: '0 12px 7px' }}>
              {g.label.toUpperCase()}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {g.items.map((n) => {
                const active = pathname === n.path;
                const badge = n.badge === 'pending' ? stats.pending : 0;
                return (
                  <button key={n.path} className="dx-navitem" data-active={active} onClick={() => router.push(n.path)}>
                    <Icon name={n.icon} size={20} fill={active} />
                    <span style={{ flex: 1 }}>{n.label}</span>
                    {badge > 0 && (
                      <span style={{ minWidth: 20, height: 20, padding: '0 6px', borderRadius: 999, background: 'var(--primary)', color: '#fff', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {badge}
                      </span>
                    )}
                    {n.tag && (
                      <span style={{ padding: '2px 7px', borderRadius: 999, background: 'rgba(123,198,83,.2)', color: '#A9D98F', fontSize: 9, fontWeight: 800, letterSpacing: '.05em' }}>
                        {n.tag}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div style={{ borderRadius: 'var(--sh-md)', padding: 13, background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.12)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: stats.online ? '#8CCB6E' : '#8A8D91', animation: stats.online ? 'dxGlow 1.4s infinite' : 'none' }} />
          <span style={{ fontSize: 12, fontWeight: 800 }}>{stats.online} en línea</span>
        </div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,.55)', marginTop: 4 }}>
          {stats.open} pedidos activos · WhatsApp 315 792 4906
        </div>
      </div>
    </aside>
  );
}
