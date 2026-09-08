'use client';

import { useEffect, useState } from 'react';
import { Icon, Button, Chip } from './ui';
import ModeSwitch from './ModeSwitch';
import ThemeToggle from './ThemeToggle';
import { useOps } from '../context/OpsProvider';
import { useAppMode } from '../context/AppModeProvider';
import { requestNotificationPermission, notificationPermission } from '../lib/notify';

export default function TopBar({ title, subtitle, actions }) {
  const { simulateIncoming, stats, branches } = useOps();
  const { isDemo } = useAppMode();
  const [perm, setPerm] = useState('default');
  const [open, setOpen] = useState(false);

  useEffect(() => { setPerm(notificationPermission()); }, []);

  const activeBranches = branches.filter((b) => b.is_active);

  return (
    <header style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
      <div style={{ minWidth: 0 }}>
        <h1 className="dsp" style={{ fontWeight: 800, fontSize: 27, margin: 0 }}>{title}</h1>
        <div style={{ fontSize: 13, color: 'var(--on-surface-variant)', fontWeight: 600, marginTop: 4 }}>{subtitle}</div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        {activeBranches.length > 0 && (
          <Chip icon="location_city" style={{ height: 34, fontSize: 12.5 }}>
            {activeBranches.length === 1 ? activeBranches[0].city : `${activeBranches.length} sedes`}
          </Chip>
        )}

        <Chip
          icon="wifi_tethering"
          bg={stats.online ? 'var(--secondary-container)' : 'var(--surface-container)'}
          color={stats.online ? 'var(--on-secondary-container)' : 'var(--on-surface-variant)'}
          style={{ height: 34, fontSize: 12.5 }}
        >
          {stats.online} en línea
        </Chip>

        {perm !== 'granted' && perm !== 'unsupported' && (
          <button
            onClick={async () => setPerm(await requestNotificationPermission())}
            title="Activar alertas"
            style={{ width: 38, height: 38, borderRadius: 'var(--sh-sm)', background: 'var(--tertiary-container)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Icon name="notifications_off" size={19} color="var(--on-tertiary-container)" />
          </button>
        )}

        <ThemeToggle />

        <ModeSwitch />

        {isDemo && (
          <div style={{ position: 'relative' }}>
            <Button icon="bolt" color="var(--primary)" onClick={() => setOpen((o) => !o)} style={{ height: 44 }}>
              Simular pedido
            </Button>
            {open && (
              <div
                style={{ position: 'absolute', right: 0, top: '100%', marginTop: 8, zIndex: 70, width: 230, borderRadius: 'var(--sh-md)', background: 'var(--surface-lowest)', border: '1px solid var(--outline-variant)', boxShadow: 'var(--elev-3)', overflow: 'hidden', animation: 'dxDrop .16s var(--ease-out)' }}
                onMouseLeave={() => setOpen(false)}
              >
                <button
                  onClick={() => { simulateIncoming({ turbo: false }); setOpen(false); }}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '13px 14px', textAlign: 'left', background: 'transparent' }}
                >
                  <Icon name="add_alert" size={19} color="var(--primary)" />
                  <span style={{ fontSize: 13, fontWeight: 700 }}>Pedido normal</span>
                </button>
                <button
                  onClick={() => { simulateIncoming({ turbo: true }); setOpen(false); }}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '13px 14px', textAlign: 'left', background: 'transparent', borderTop: '1px solid var(--outline-variant)' }}
                >
                  <Icon name="bolt" size={19} fill color="var(--secondary)" />
                  <span style={{ fontSize: 13, fontWeight: 700 }}>Pedido Turbo</span>
                </button>
              </div>
            )}
          </div>
        )}

        {actions}
      </div>
    </header>
  );
}
