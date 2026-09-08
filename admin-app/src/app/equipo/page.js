'use client';

import { useEffect, useState } from 'react';
import TopBar from '../../components/TopBar';
import { Icon, Card, Overline, Button, Chip, Switch } from '../../components/ui';
import { useTheme } from '../../context/ThemeProvider';
import { useOps } from '../../context/OpsProvider';
import { notificationPermission, requestNotificationPermission } from '../../lib/notify';

const ROLES = [
  { id: 'admin', label: 'Administrador', icon: 'shield_person', desc: 'Control total: tarifas, sedes, repartidores y pagos.', color: 'var(--primary-container)', fg: 'var(--on-primary-container)' },
  { id: 'despachador', label: 'Despachador', icon: 'headset_mic', desc: 'Recibe pedidos, los asigna y hace seguimiento. No cambia tarifas.', color: 'var(--tertiary-container)', fg: 'var(--on-tertiary-container)' },
  { id: 'courier', label: 'Repartidor', icon: 'two_wheeler', desc: 'Solo su app: ve sus pedidos, su ruta y sus ganancias.', color: 'var(--secondary-container)', fg: 'var(--on-secondary-container)' },
];

const TEMAS = [
  { id: 'light', label: 'Claro', icon: 'light_mode' },
  { id: 'dark', label: 'Oscuro', icon: 'dark_mode' },
  { id: 'auto', label: 'Automático', icon: 'brightness_auto' },
];

export default function EquipoPage() {
  const { theme, changeTheme } = useTheme();
  const { couriers, isDemo } = useOps();
  const [perm, setPerm] = useState('default');
  const [sound, setSound] = useState(true);

  useEffect(() => { setPerm(notificationPermission()); }, []);

  return (
    <>
      <TopBar title="Seguridad y equipo" subtitle="Quién entra al panel, cómo se ve y qué alertas recibe" />

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 16, alignItems: 'start' }}>
        <Card style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 15, fontWeight: 800 }}>Roles y permisos</span>
            <Chip icon="workspace_premium" bg="var(--tertiary-container)" color="var(--on-tertiary-container)">PRO</Chip>
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--on-surface-variant)', marginTop: 5, lineHeight: 1.5 }}>
            Cada persona ve solo lo que necesita para su trabajo.
          </div>

          <div style={{ marginTop: 16 }}>
            {ROLES.map((r, i) => {
              const count = r.id === 'courier' ? couriers.length : r.id === 'admin' ? 1 : 0;
              return (
                <div key={r.id} style={{ display: 'flex', gap: 13, padding: '14px 0', borderTop: i ? '1px solid var(--outline-variant)' : 'none' }}>
                  <span style={{ width: 42, height: 42, borderRadius: 'var(--sh-sm)', background: r.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
                    <Icon name={r.icon} size={21} fill color={r.fg} />
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: 13.5, fontWeight: 800 }}>{r.label}</span>
                    <span style={{ display: 'block', fontSize: 11.5, color: 'var(--on-surface-variant)', marginTop: 2, lineHeight: 1.45 }}>{r.desc}</span>
                  </span>
                  <Chip>{count} {count === 1 ? 'persona' : 'personas'}</Chip>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 16, padding: 14, borderRadius: 'var(--sh-md)', background: 'var(--surface-container)', display: 'flex', gap: 10 }}>
            <Icon name="info" size={18} fill color="var(--on-surface-variant)" />
            <span style={{ flex: 1, fontSize: 11.5, color: 'var(--on-surface-variant)', lineHeight: 1.5 }}>
              Hoy el sistema opera sin inicio de sesión para simplificar el arranque. Antes de salir a producción
              con dinero real hay que activar claves de acceso por rol.
            </span>
          </div>
        </Card>

        <div>
          <Card style={{ padding: 20 }}>
            <span style={{ fontSize: 15, fontWeight: 800 }}>Apariencia</span>
            <div style={{ fontSize: 12.5, color: 'var(--on-surface-variant)', marginTop: 5, lineHeight: 1.5 }}>
              Modo claro para el día, oscuro para la noche, o que siga al sistema.
            </div>
            <div style={{ display: 'flex', gap: 9, marginTop: 16 }}>
              {TEMAS.map((t) => {
                const on = theme === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => changeTheme(t.id)}
                    style={{
                      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '16px 10px',
                      borderRadius: 'var(--sh-md)', fontSize: 12.5, fontWeight: 800,
                      background: on ? 'var(--primary)' : 'var(--surface-container)',
                      color: on ? 'var(--on-primary)' : 'var(--on-surface-variant)',
                      border: `1px solid ${on ? 'var(--primary)' : 'var(--outline-variant)'}`,
                      boxShadow: on ? 'var(--elev-2)' : 'none',
                    }}
                  >
                    <Icon name={t.icon} size={22} fill={on} />
                    {t.label}
                  </button>
                );
              })}
            </div>
          </Card>

          <Card style={{ padding: 20, marginTop: 16 }}>
            <span style={{ fontSize: 15, fontWeight: 800 }}>Alertas</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 13, marginTop: 16 }}>
              <span style={{ width: 42, height: 42, borderRadius: 'var(--sh-sm)', background: perm === 'granted' ? 'var(--secondary-container)' : 'var(--tertiary-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
                <Icon name={perm === 'granted' ? 'notifications_active' : 'notifications_off'} size={21} fill color={perm === 'granted' ? 'var(--on-secondary-container)' : 'var(--on-tertiary-container)'} />
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 13.5, fontWeight: 800 }}>Notificaciones del navegador</span>
                <span style={{ display: 'block', fontSize: 11.5, color: 'var(--on-surface-variant)', marginTop: 2, lineHeight: 1.45 }}>
                  Aviso inmediato cuando entra un pedido, aunque el panel esté en otra pestaña.
                </span>
              </span>
              {perm === 'granted'
                ? <Chip icon="check_circle" bg="var(--secondary-container)" color="var(--on-secondary-container)">Activas</Chip>
                : <Button onClick={async () => setPerm(await requestNotificationPermission())} style={{ height: 40, fontSize: 12.5 }}>Activar</Button>}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 13, marginTop: 4, paddingTop: 14, borderTop: '1px solid var(--outline-variant)' }}>
              <span style={{ width: 42, height: 42, borderRadius: 'var(--sh-sm)', background: sound ? 'var(--secondary-container)' : 'var(--surface-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
                <Icon name={sound ? 'volume_up' : 'volume_off'} size={21} fill color={sound ? 'var(--on-secondary-container)' : 'var(--on-surface-variant)'} />
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 13.5, fontWeight: 800 }}>Sonido de pedido nuevo</span>
                <span style={{ display: 'block', fontSize: 11.5, color: 'var(--on-surface-variant)', marginTop: 2 }}>Campanita corta al entrar un servicio.</span>
              </span>
              <span style={{ background: 'var(--surface-high)', borderRadius: 999, padding: 2, display: 'flex' }}>
                <Switch checked={sound} onChange={() => setSound((s) => !s)} />
              </span>
            </div>
          </Card>

          <Card style={{ padding: 20, marginTop: 16 }}>
            <span style={{ fontSize: 15, fontWeight: 800 }}>Soporte Domix</span>
            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <a href="https://wa.me/573157924906" target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 13, borderRadius: 'var(--sh-md)', background: 'var(--secondary-container)', color: 'var(--on-secondary-container)' }}>
                <Icon name="chat" size={20} fill />
                <span style={{ flex: 1, fontSize: 13, fontWeight: 800 }}>WhatsApp 315 792 4906</span>
                <Icon name="open_in_new" size={17} />
              </a>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 13, borderRadius: 'var(--sh-md)', background: 'var(--surface-container)' }}>
                <Icon name="menu_book" size={20} color="var(--on-surface-variant)" />
                <span style={{ flex: 1, fontSize: 13, fontWeight: 700 }}>Documentación Domix</span>
                <Chip>Pronto</Chip>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
