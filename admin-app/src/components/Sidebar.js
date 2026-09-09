'use client';

import { useRouter, usePathname } from 'next/navigation';
import { Icon } from './ui';
import { useOps } from '../context/OpsProvider';

const NAV = [
  {
    title: 'OPERACIÓN',
    items: [
      { label: 'Dashboard', path: '/', icon: 'dashboard' },
      { label: 'Pedidos en vivo', path: '/pedidos', icon: 'receipt_long', badge: 'pending' },
      { label: 'Mapa en vivo', path: '/mapa', icon: 'explore' },
      { label: 'Bandeja WhatsApp', path: '/bandeja', icon: 'chat', tag: 'IA' },
    ],
  },
  {
    title: 'RED DOMIX',
    items: [
      { label: 'Repartidores', path: '/repartidores', icon: 'two_wheeler' },
      { label: 'Sedes y ciudades', path: '/sedes', icon: 'location_city' },
    ],
  },
  {
    title: 'DINERO',
    items: [
      { label: 'Motor de despacho', path: '/despacho', icon: 'tune' },
      { label: 'Domix Turbo', path: '/turbo', icon: 'bolt', tag: 'PRO' },
    ],
  },
  {
    title: 'SISTEMA',
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
      {/* Marca */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '0 10px 20px' }}>
        <span style={{ width: 38, height: 38, borderRadius: 11, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none', overflow: 'hidden' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/domix-logo.jpg" alt="Domix" style={{ width: 42, height: 42, objectFit: 'contain' }} />
        </span>
        <span style={{ minWidth: 0 }}>
          <span style={{ display: 'flex', alignItems: 'flex-end', gap: 2.5 }}>
            <span style={{ font: '800 17px/1 Manrope,sans-serif', letterSpacing: '-.05em' }}>
              Domi<span style={{ color: '#5FBF45' }}>X</span>
            </span>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#5FBF45', marginBottom: 3 }} />
          </span>
          <span style={{ display: 'block', font: '600 9px Manrope,sans-serif', letterSpacing: '.12em', color: 'rgba(255,255,255,.45)', marginTop: 4 }}>
            EQUIPO · BUENAVENTURA
          </span>
        </span>
      </div>

      {/* Navegación agrupada */}
      <nav className="sb" style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
        {NAV.map((group) => (
          <div key={group.title} style={{ marginBottom: 16 }}>
            <div style={{ font: '600 9.5px Manrope,sans-serif', letterSpacing: '.12em', color: 'rgba(255,255,255,.34)', padding: '0 11px 7px' }}>
              {group.title}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {group.items.map((n) => {
                const active = pathname === n.path;
                const badge = n.badge === 'pending' ? stats.pending : 0;
                return (
                  <button key={n.path} className="dx-navitem" data-active={active} onClick={() => router.push(n.path)}>
                    <Icon name={n.icon} size={19} fill={active} />
                    <span style={{ flex: 1 }}>{n.label}</span>
                    {badge > 0 && (
                      <span className="num" style={{ minWidth: 19, height: 19, padding: '0 5px', borderRadius: 99, background: '#c98a1e', color: '#fff', font: "700 10.5px 'IBM Plex Mono',monospace", display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {badge}
                      </span>
                    )}
                    {n.tag && (
                      <span style={{ padding: '2px 6px', borderRadius: 99, background: 'rgba(95,191,69,.18)', color: '#8FD46E', font: '800 8.5px Manrope,sans-serif', letterSpacing: '.06em' }}>
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

      {/* Pie: quién está operando */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 11px 0', borderTop: '1px solid rgba(255,255,255,.09)' }}>
        <span style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '700 12px Manrope,sans-serif', flex: 'none' }}>
          DX
        </span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: 'block', font: '700 12px Manrope,sans-serif' }}>Equipo Domix</span>
          <span style={{ display: 'block', font: '500 10.5px Manrope,sans-serif', color: 'rgba(255,255,255,.45)', marginTop: 1 }}>Operaciones</span>
        </span>
      </div>
    </aside>
  );
}
