'use client';

import { useEffect, useState } from 'react';
import RequireSession from '../../components/RequireSession';
import BottomNav from '../../components/BottomNav';
import Icon from '../../components/Icon';
import { useCourierSession } from '../../context/CourierSessionProvider';
import { supabase } from '../../lib/supabaseClient';

const DOCS = [
  { type: 'cedula', label: 'Cédula' },
  { type: 'licencia', label: 'Licencia de conducción' },
  { type: 'soat', label: 'SOAT' },
  { type: 'tarjeta_propiedad', label: 'Tarjeta de propiedad' },
];

const DOC_STATUS = {
  approved: { label: 'Aprobada', color: 'var(--greenDark)', icon: 'check_circle' },
  pending: { label: 'Pendiente', color: 'var(--muted)', icon: 'schedule' },
  expiring_soon: { label: 'Vence pronto', color: 'var(--amber)', icon: 'error' },
  rejected: { label: 'Rechazada', color: 'var(--red)', icon: 'cancel' },
};

const VEHICLE_LABELS = { moto: 'Moto', bicicleta: 'Bicicleta', a_pie: 'A pie', carro: 'Carro' };

function initials(profile) {
  return ((profile?.first_name?.[0] || 'D') + (profile?.last_name?.[0] || '')).toUpperCase();
}

function CuentaContent() {
  const { profile, courierProfile, signOut } = useCourierSession();
  const [documents, setDocuments] = useState([]);
  const [vehicle, setVehicle] = useState(null);

  useEffect(() => {
    if (!courierProfile?.id) return;
    supabase.from('courier_documents').select('*').eq('courier_id', courierProfile.id).then(({ data }) => setDocuments(data || []));
    supabase.from('vehicles').select('*').eq('courier_id', courierProfile.id).eq('is_active', true).maybeSingle().then(({ data }) => setVehicle(data || null));
  }, [courierProfile?.id]);

  const expiring = documents.find((d) => d.status === 'expiring_soon');

  const rows = [
    { icon: 'two_wheeler', label: 'Mi vehículo', value: vehicle ? `${VEHICLE_LABELS[vehicle.vehicle_type] || vehicle.vehicle_type} ${vehicle.plate || ''}`.trim() : 'Sin registrar' },
    { icon: 'account_balance', label: 'Cuenta para retiros', value: courierProfile?.payout_account || 'Sin registrar' },
    { icon: 'map', label: 'Zona de trabajo', value: courierProfile?.work_zone || 'Centro' },
    { icon: 'schedule', label: 'Horario preferido', value: courierProfile?.preferred_schedule || 'Sin definir' },
    { icon: 'support_agent', label: 'Ayuda y soporte', value: '' },
  ];

  const stats = [
    { value: Number(courierProfile?.rating || 5).toFixed(1), label: 'Calificación' },
    { value: courierProfile?.total_deliveries || 0, label: 'Entregas' },
    { value: courierProfile?.status === 'online' ? 'En línea' : 'Fuera', label: 'Estado' },
  ];

  return (
    <>
      <div style={{ flex: 'none', padding: '20px 20px 10px' }}>
        <div className="dsp" style={{ fontWeight: 800, fontSize: 26 }}>Cuenta</div>
      </div>

      <div className="sc" style={{ flex: 1, overflowY: 'auto', padding: '6px 20px 108px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 54, height: 54, borderRadius: '50%', background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 17, color: 'var(--muted)', flex: 'none' }}>
            {initials(profile)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="dsp" style={{ fontWeight: 700, fontSize: 19 }}>{profile?.first_name} {profile?.last_name}</div>
            <div style={{ fontSize: 12.5, color: 'var(--muted)', fontWeight: 600, marginTop: 2 }}>{profile?.phone_number}</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 11, marginTop: 16 }}>
          {stats.map((s) => (
            <div key={s.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, padding: '15px 12px', textAlign: 'center', boxShadow: 'var(--shadowSm)' }}>
              <div className="dsp" style={{ fontWeight: 800, fontSize: 18 }}>{s.value}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', marginTop: 3 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 22, padding: 16, marginTop: 14, boxShadow: 'var(--shadowSm)' }}>
          <div style={{ fontSize: 13.5, fontWeight: 800, marginBottom: 6 }}>Documentos</div>
          {DOCS.map((d) => {
            const doc = documents.find((x) => x.doc_type === d.type);
            const meta = DOC_STATUS[doc?.status || 'pending'];
            return (
              <div key={d.type} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '11px 0', borderTop: '1px solid var(--border)' }}>
                <Icon name={meta.icon} size={20} fill color={meta.color} />
                <span style={{ flex: 1, fontSize: 13.5, fontWeight: 700 }}>{d.label}</span>
                <span style={{ fontSize: 12, fontWeight: 800, color: meta.color }}>{meta.label}</span>
              </div>
            );
          })}

          {expiring && (
            <div style={{ display: 'flex', gap: 9, alignItems: 'flex-start', marginTop: 12, padding: 12, borderRadius: 13, background: '#FFF7E6' }}>
              <Icon name="error" size={18} fill color="#A8730B" />
              <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: '#7A5608', lineHeight: 1.45 }}>
                Tu {DOCS.find((d) => d.type === expiring.doc_type)?.label} vence pronto. Súbelo actualizado para no quedar inactivo.
              </span>
            </div>
          )}
        </div>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 22, marginTop: 14, overflow: 'hidden', boxShadow: 'var(--shadowSm)' }}>
          {rows.map((row, i) => (
            <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '14px 16px', borderTop: i === 0 ? 'none' : '1px solid var(--border)' }}>
              <span style={{ width: 38, height: 38, borderRadius: 12, background: 'var(--navySoft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
                <Icon name={row.icon} size={19} color="var(--navy)" />
              </span>
              <span style={{ flex: 1, minWidth: 0, fontSize: 13.5, fontWeight: 700 }}>{row.label}</span>
              {row.value && <span style={{ fontSize: 12.5, color: 'var(--muted)', fontWeight: 600, flex: 'none' }}>{row.value}</span>}
              <Icon name="chevron_right" size={20} color="var(--faint)" />
            </div>
          ))}
        </div>

        <button
          onClick={signOut}
          style={{ width: '100%', height: 50, borderRadius: 16, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--red)', fontWeight: 700, fontSize: 14, marginTop: 14 }}
        >
          Cambiar de repartidor
        </button>
      </div>

      <BottomNav />
    </>
  );
}

export default function CuentaPage() {
  return (
    <RequireSession>
      <CuentaContent />
    </RequireSession>
  );
}
