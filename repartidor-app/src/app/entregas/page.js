'use client';

import { useEffect, useState } from 'react';
import RequireSession from '../../components/RequireSession';
import BottomNav from '../../components/BottomNav';
import Icon from '../../components/Icon';
import { useCourierSession } from '../../context/CourierSessionProvider';
import { fetchCourierDeliveries, updateRequestStatus, serviceLabel } from '../../lib/serviceRequests';

function money(n) {
  return `$${Math.round(n || 0).toLocaleString('es-CO')}`;
}

const STATUS_META = {
  requested: { label: 'Solicitado', color: 'var(--muted)', bg: 'var(--surface2)' },
  assigned: { label: 'Por recoger', color: 'var(--primary)', bg: '#FDF1E6' },
  picked_up: { label: 'Recogido', color: 'var(--blue)', bg: '#E9EFFF' },
  in_progress: { label: 'En camino', color: 'var(--blue)', bg: '#E9EFFF' },
  delivered: { label: 'Entregado', color: 'var(--greenDark)', bg: 'var(--greenSoft)' },
  cancelled: { label: 'Cancelado', color: 'var(--red)', bg: 'var(--redSoft)' },
};

const NEXT_STATUS = { assigned: 'picked_up', picked_up: 'in_progress', in_progress: 'delivered' };
const NEXT_LABEL = { assigned: 'Marcar recogido', picked_up: 'Voy en camino', in_progress: 'Marcar entregado' };

const SERVICE_ICON = {
  mensajeria: 'mail',
  encomienda: 'inventory_2',
  domicilio: 'restaurant',
  mandado: 'shopping_bag',
  autorizacion_medica: 'medical_information',
};

function EntregasContent() {
  const { courierProfile } = useCourierSession();
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  const load = () => {
    if (!courierProfile?.id) return;
    setLoading(true);
    fetchCourierDeliveries(courierProfile.id)
      .then(setDeliveries)
      .catch(() => setDeliveries([]))
      .finally(() => setLoading(false));
  };

  useEffect(load, [courierProfile?.id]);

  const advance = async (req) => {
    const next = NEXT_STATUS[req.status];
    if (!next) return;
    const { error } = await updateRequestStatus(req.id, next);
    if (!error) load();
  };

  const q = query.toLowerCase();
  const filtered = deliveries.filter((d) =>
    !q ||
    d.pickup_address?.toLowerCase().includes(q) ||
    d.dropoff_address?.toLowerCase().includes(q) ||
    d.contact_name?.toLowerCase().includes(q) ||
    d.tracking_code?.toLowerCase().includes(q)
  );

  return (
    <>
      <div style={{ flex: 'none', padding: '20px 20px 12px' }}>
        <div className="dsp" style={{ fontWeight: 800, fontSize: 26 }}>Entregas</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 14, height: 46, padding: '0 14px', borderRadius: 14, background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadowSm)' }}>
          <Icon name="search" size={19} color="var(--faint)" />
          <input
            placeholder="Cliente, dirección o código"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ flex: 1, fontSize: 13.5, fontWeight: 600 }}
          />
        </div>
      </div>

      <div className="sc" style={{ flex: 1, overflowY: 'auto', padding: '4px 20px 108px' }}>
        {loading && <div style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 600, textAlign: 'center', marginTop: 20 }}>Cargando…</div>}

        {!loading && filtered.length === 0 && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: '32px 20px', textAlign: 'center', boxShadow: 'var(--shadowSm)', marginTop: 8 }}>
            <span style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
              <Icon name="receipt_long" size={25} color="var(--faint)" />
            </span>
            <div className="dsp" style={{ fontWeight: 700, fontSize: 16.5, marginTop: 15 }}>Sin entregas todavía</div>
            <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5, marginTop: 5 }}>
              Los pedidos que aceptes aparecerán aquí.
            </div>
          </div>
        )}

        {filtered.map((req) => {
          const meta = STATUS_META[req.status] || STATUS_META.requested;
          return (
            <div key={req.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: 16, marginTop: 12, boxShadow: 'var(--shadowSm)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
                <span style={{ width: 44, height: 44, borderRadius: 13, background: 'var(--navySoft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
                  <Icon name={SERVICE_ICON[req.service_type] || 'inventory_2'} size={21} color="var(--navy)" />
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', fontWeight: 700, fontSize: 14.5 }}>{serviceLabel(req.service_type)}</span>
                  <span style={{ display: 'block', fontSize: 11.5, color: 'var(--muted)', marginTop: 2 }}>
                    #{req.tracking_code} · {new Date(req.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
                  </span>
                </span>
                <span className="dsp" style={{ fontWeight: 800, fontSize: 18, flex: 'none' }}>{money(req.price)}</span>
              </div>

              <div style={{ marginTop: 13, paddingTop: 13, borderTop: '1px solid var(--border)', fontSize: 13, fontWeight: 600 }}>
                <div style={{ display: 'flex', gap: 9, alignItems: 'center' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--text)', flex: 'none' }} />
                  <span style={{ flex: 1, minWidth: 0 }}>{req.pickup_address}</span>
                </div>
                <div style={{ display: 'flex', gap: 9, alignItems: 'center', marginTop: 7 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)', flex: 'none' }} />
                  <span style={{ flex: 1, minWidth: 0 }}>{req.dropoff_address}</span>
                </div>
              </div>

              <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ padding: '6px 11px', borderRadius: 999, background: meta.bg, color: meta.color, fontSize: 11.5, fontWeight: 800 }}>
                  {meta.label}
                </span>
                <span style={{ flex: 1 }} />
                {NEXT_STATUS[req.status] && (
                  <button
                    onClick={() => advance(req)}
                    style={{ height: 40, padding: '0 16px', borderRadius: 13, background: 'var(--navy)', color: '#fff', fontWeight: 700, fontSize: 13 }}
                  >
                    {NEXT_LABEL[req.status]}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <BottomNav />
    </>
  );
}

export default function EntregasPage() {
  return (
    <RequireSession>
      <EntregasContent />
    </RequireSession>
  );
}
