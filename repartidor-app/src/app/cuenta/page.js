'use client';

import { useEffect, useState } from 'react';
import RequireSession from '../../components/RequireSession';
import BottomNav from '../../components/BottomNav';
import { Icon, Card, HeroCard, Overline, Button, Chip } from '../../components/ui';
import { useCourierSession } from '../../context/CourierSessionProvider';
import { useAppMode } from '../../context/AppModeProvider';
import { useTheme } from '../../context/ThemeProvider';
import ModeSwitch from '../../components/ModeSwitch';
import ThemeToggle from '../../components/ThemeToggle';
import { DEMO_DOCS, DEMO_VEHICLE } from '../../lib/demo';
import { supabase } from '../../lib/supabaseClient';

const DOCS = [
  { type: 'cedula', label: 'Cédula', icon: 'badge' },
  { type: 'licencia', label: 'Licencia de conducción', icon: 'directions_car' },
  { type: 'soat', label: 'SOAT', icon: 'health_and_safety' },
  { type: 'tarjeta_propiedad', label: 'Tarjeta de propiedad', icon: 'description' },
];

const DOC_STATUS = {
  approved: { label: 'Aprobada', color: 'var(--secondary)', icon: 'check_circle' },
  pending: { label: 'Pendiente', color: 'var(--on-surface-variant)', icon: 'schedule' },
  expiring_soon: { label: 'Vence pronto', color: 'var(--tertiary)', icon: 'error' },
  rejected: { label: 'Rechazada', color: 'var(--error)', icon: 'cancel' },
};

const VEHICLES = { moto: 'Moto', bicicleta: 'Bicicleta', a_pie: 'A pie', carro: 'Carro' };

function CuentaContent() {
  const { profile, courierProfile, signOut } = useCourierSession();
  const { isDemo } = useAppMode();
  const { theme, changeTheme } = useTheme();
  const [docs, setDocs] = useState([]);
  const [vehicle, setVehicle] = useState(null);

  useEffect(() => {
    if (isDemo) {
      setDocs(DEMO_DOCS);
      setVehicle(DEMO_VEHICLE);
      return;
    }
    if (!courierProfile?.id) return;
    supabase.from('courier_documents').select('*').eq('courier_id', courierProfile.id).then(({ data }) => setDocs(data || []));
    supabase.from('vehicles').select('*').eq('courier_id', courierProfile.id).eq('is_active', true).maybeSingle().then(({ data }) => setVehicle(data || null));
  }, [courierProfile?.id, isDemo]);

  const approved = docs.filter((d) => d.status === 'approved').length;
  const expiring = docs.find((d) => d.status === 'expiring_soon');
  const inits = ((profile?.first_name?.[0] || 'D') + (profile?.last_name?.[0] || '')).toUpperCase();

  const rows = [
    { icon: 'two_wheeler', label: 'Mi vehículo', value: vehicle ? `${VEHICLES[vehicle.vehicle_type] || vehicle.vehicle_type} ${vehicle.plate || ''}`.trim() : 'Sin registrar' },
    { icon: 'account_balance', label: 'Cuenta para retiros', value: courierProfile?.payout_account || 'Sin registrar' },
    { icon: 'map', label: 'Zona de trabajo', value: courierProfile?.work_zone || 'Centro' },
    { icon: 'schedule', label: 'Horario preferido', value: courierProfile?.preferred_schedule || 'Sin definir' },
    { icon: 'support_agent', label: 'Ayuda y soporte', value: '' },
  ];

  return (
    <>
      <header className="dx-topbar" style={{ justifyContent: 'space-between' }}>
        <span className="dsp" style={{ fontWeight: 800, fontSize: 25 }}>Cuenta</span>
        <ThemeToggle compact />
        <ModeSwitch compact />
      </header>

      <div className="dx-page sc">
        <HeroCard glow="orange" style={{ padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(255,255,255,.14)', border: '2px solid rgba(255,255,255,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 18, flex: 'none' }}>
              {inits}
            </span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span className="dsp" style={{ display: 'block', fontWeight: 700, fontSize: 19 }}>{profile?.first_name} {profile?.last_name}</span>
              <span style={{ display: 'block', fontSize: 12.5, color: 'rgba(255,255,255,.6)', marginTop: 2 }}>{profile?.phone_number}</span>
            </span>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            {[
              { v: Number(courierProfile?.rating || 5).toFixed(1), l: 'Calificación' },
              { v: courierProfile?.total_deliveries || 0, l: 'Entregas' },
              { v: `${approved}/4`, l: 'Documentos' },
            ].map((s) => (
              <span key={s.l} style={{ flex: 1, background: 'rgba(255,255,255,.09)', borderRadius: 'var(--sh-sm)', padding: '11px 8px', textAlign: 'center' }}>
                <span className="num" style={{ display: 'block', fontWeight: 700, fontSize: 17 }}>{s.v}</span>
                <span style={{ display: 'block', fontSize: 10.5, fontWeight: 700, color: 'rgba(255,255,255,.55)', marginTop: 2 }}>{s.l}</span>
              </span>
            ))}
          </div>
        </HeroCard>

        <Card style={{ padding: 16, marginTop: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 14, fontWeight: 800 }}>Documentos</span>
            <Chip icon={approved === 4 ? 'verified' : 'pending'} bg={approved === 4 ? 'var(--secondary-container)' : 'var(--surface-container)'} color={approved === 4 ? 'var(--on-secondary-container)' : 'var(--on-surface-variant)'}>
              {approved} de 4
            </Chip>
          </div>

          {DOCS.map((d) => {
            const doc = docs.find((x) => x.doc_type === d.type);
            const st = DOC_STATUS[doc?.status || 'pending'];
            return (
              <div key={d.type} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderTop: '1px solid var(--outline-variant)' }}>
                <span style={{ width: 36, height: 36, borderRadius: 'var(--sh-sm)', background: 'var(--surface-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
                  <Icon name={d.icon} size={18} color="var(--on-surface-variant)" />
                </span>
                <span style={{ flex: 1, fontSize: 13.5, fontWeight: 700 }}>{d.label}</span>
                <Icon name={st.icon} size={19} fill color={st.color} />
                <span style={{ fontSize: 11.5, fontWeight: 800, color: st.color, minWidth: 68, textAlign: 'right' }}>{st.label}</span>
              </div>
            );
          })}

          {expiring && (
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginTop: 12, padding: 12, borderRadius: 'var(--sh-sm)', background: 'var(--tertiary-container)' }}>
              <Icon name="error" size={19} fill color="var(--on-tertiary-container)" />
              <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: 'var(--on-tertiary-container)', lineHeight: 1.45 }}>
                Tu {DOCS.find((d) => d.type === expiring.doc_type)?.label} vence pronto. Súbelo actualizado para no quedar inactivo.
              </span>
            </div>
          )}
        </Card>

        <Card style={{ padding: 0, marginTop: 14, overflow: 'hidden' }}>
          {rows.map((row, i) => (
            <button key={row.label} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 13, padding: '14px 15px', borderTop: i ? '1px solid var(--outline-variant)' : 'none', textAlign: 'left', background: 'transparent' }}>
              <span style={{ width: 38, height: 38, borderRadius: 'var(--sh-sm)', background: 'var(--primary-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
                <Icon name={row.icon} size={19} color="var(--on-primary-container)" />
              </span>
              <span style={{ flex: 1, minWidth: 0, fontSize: 13.5, fontWeight: 700 }}>{row.label}</span>
              {row.value && <span style={{ fontSize: 12.5, color: 'var(--on-surface-variant)', fontWeight: 600 }}>{row.value}</span>}
              <Icon name="chevron_right" size={20} color="var(--outline)" />
            </button>
          ))}
        </Card>

        {/* Apariencia */}
        <Card style={{ padding: 16, marginTop: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 12 }}>Apariencia</div>
          <div style={{ display: 'flex', gap: 9 }}>
            {[
              { id: 'light', label: 'Claro', icon: 'light_mode' },
              { id: 'dark', label: 'Oscuro', icon: 'dark_mode' },
              { id: 'auto', label: 'Auto', icon: 'brightness_auto' },
            ].map((t) => {
              const on = theme === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => changeTheme(t.id)}
                  style={{
                    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, padding: '14px 8px',
                    borderRadius: 'var(--sh-md)', fontSize: 12.5, fontWeight: 800,
                    background: on ? 'var(--primary)' : 'var(--surface-container)',
                    color: on ? 'var(--on-primary)' : 'var(--on-surface-variant)',
                  }}
                >
                  <Icon name={t.icon} size={20} fill={on} />
                  {t.label}
                </button>
              );
            })}
          </div>
        </Card>

        <Button full variant="outlined" icon="swap_horiz" color="var(--error)" onClick={signOut} style={{ marginTop: 14, borderColor: 'var(--outline-variant)' }}>
          Cambiar de repartidor
        </Button>

        <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--on-surface-variant)', marginTop: 16 }}>
          Domix · Mensajería &amp; Logística · Buenaventura
        </div>
      </div>

      <BottomNav />
    </>
  );
}

export default function CuentaPage() {
  return <RequireSession><CuentaContent /></RequireSession>;
}
