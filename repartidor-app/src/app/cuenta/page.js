'use client';

import { useEffect, useState } from 'react';
import RequireSession from '../../components/RequireSession';
import BottomNav from '../../components/BottomNav';
import { useCourierSession } from '../../context/CourierSessionProvider';
import { supabase } from '../../lib/supabaseClient';

const DOC_LABELS = {
  cedula: 'Cédula',
  licencia: 'Licencia de conducir',
  soat: 'SOAT',
  tarjeta_propiedad: 'Tarjeta de propiedad',
};

const STATUS_LABELS = {
  approved: 'Aprobada',
  pending: 'Pendiente',
  expiring_soon: 'Vence pronto',
  rejected: 'Rechazada',
};

const STATUS_COLOR = {
  approved: 'var(--green)',
  pending: 'var(--mu)',
  expiring_soon: 'var(--amber)',
  rejected: 'var(--red)',
};

function CuentaContent() {
  const { profile, courierProfile, signOut } = useCourierSession();
  const [documents, setDocuments] = useState([]);
  const [vehicle, setVehicle] = useState(null);

  useEffect(() => {
    if (!courierProfile?.id) return;
    supabase.from('courier_documents').select('*').eq('courier_id', courierProfile.id).then(({ data }) => setDocuments(data || []));
    supabase.from('vehicles').select('*').eq('courier_id', courierProfile.id).eq('is_active', true).maybeSingle().then(({ data }) => setVehicle(data || null));
  }, [courierProfile?.id]);

  return (
    <div style={{ minHeight: '100dvh', paddingBottom: 90 }}>
      <div style={{ padding: '24px 20px 0' }}>
        <div style={{ font: '800 20px Manrope,sans-serif' }}>Cuenta</div>
      </div>

      <div style={{ margin: '18px 20px', padding: 18, borderRadius: 18, background: 'var(--sf)', border: '1px solid var(--bd)', display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--navyS)', color: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '800 16px Manrope,sans-serif' }}>
          {(profile?.first_name?.[0] || 'D').toUpperCase()}
        </div>
        <div>
          <div style={{ font: '700 15px Manrope,sans-serif' }}>{profile?.first_name} {profile?.last_name}</div>
          <div style={{ font: '600 12px Manrope,sans-serif', color: 'var(--mu)' }}>
            ⭐ {Number(courierProfile?.rating || 5).toFixed(1)} · {courierProfile?.total_deliveries || 0} entregas
          </div>
        </div>
      </div>

      <div style={{ margin: '0 20px 18px', padding: 18, borderRadius: 18, background: 'var(--sf)', border: '1px solid var(--bd)' }}>
        <div style={{ font: '700 13px Manrope,sans-serif', marginBottom: 12 }}>Documentos</div>
        {Object.keys(DOC_LABELS).map((key) => {
          const doc = documents.find((d) => d.doc_type === key);
          const status = doc?.status || 'pending';
          return (
            <div key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: '1px solid var(--bd2)' }}>
              <span style={{ font: '600 13px Manrope,sans-serif' }}>{DOC_LABELS[key]}</span>
              <span style={{ font: '700 12px Manrope,sans-serif', color: STATUS_COLOR[status] }}>{STATUS_LABELS[status]}</span>
            </div>
          );
        })}
      </div>

      <div style={{ margin: '0 20px 18px', borderRadius: 18, background: 'var(--sf)', border: '1px solid var(--bd)', overflow: 'hidden' }}>
        {[
          { label: 'Mi vehículo', value: vehicle ? `${vehicle.vehicle_type} · ${vehicle.plate || 'sin placa'}` : 'Sin registrar' },
          { label: 'Cuenta para retiros', value: courierProfile?.payout_account || 'Sin registrar' },
          { label: 'Zona de trabajo', value: courierProfile?.work_zone || 'Centro' },
          { label: 'Horario preferido', value: courierProfile?.preferred_schedule || 'Sin definir' },
        ].map((row, i) => (
          <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 16px', borderTop: i === 0 ? 'none' : '1px solid var(--bd2)' }}>
            <span style={{ font: '600 13px Manrope,sans-serif' }}>{row.label}</span>
            <span style={{ font: '600 13px Manrope,sans-serif', color: 'var(--mu)' }}>{row.value}</span>
          </div>
        ))}
      </div>

      <div style={{ margin: '0 20px' }}>
        <button
          onClick={signOut}
          style={{ width: '100%', padding: '14px', borderRadius: 14, background: 'var(--redS)', color: 'var(--red)', font: '700 13px Manrope,sans-serif' }}
        >
          Cerrar sesión
        </button>
      </div>

      <BottomNav />
    </div>
  );
}

export default function CuentaPage() {
  return (
    <RequireSession>
      <CuentaContent />
    </RequireSession>
  );
}
