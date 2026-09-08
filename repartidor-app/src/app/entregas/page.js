'use client';

import { useEffect, useState } from 'react';
import RequireSession from '../../components/RequireSession';
import BottomNav from '../../components/BottomNav';
import { useCourierSession } from '../../context/CourierSessionProvider';
import { fetchCourierDeliveries, updateRequestStatus, serviceLabel } from '../../lib/serviceRequests';

function money(n) {
  return `$${Math.round(n || 0).toLocaleString('es-CO')}`;
}

const STATUS_LABELS = {
  requested: 'Solicitado',
  assigned: 'Asignado',
  picked_up: 'Recogido',
  in_progress: 'En camino',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
};

const NEXT_STATUS = {
  assigned: 'picked_up',
  picked_up: 'in_progress',
  in_progress: 'delivered',
};

const NEXT_LABEL = {
  assigned: 'Marcar recogido',
  picked_up: 'Marcar en camino',
  in_progress: 'Marcar entregado',
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

  const filtered = deliveries.filter((d) =>
    !query || d.pickup_address?.toLowerCase().includes(query.toLowerCase()) || d.dropoff_address?.toLowerCase().includes(query.toLowerCase()) || d.contact_name?.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div style={{ minHeight: '100dvh', paddingBottom: 90 }}>
      <div style={{ padding: '24px 20px 0' }}>
        <div style={{ font: '800 20px Manrope,sans-serif' }}>Entregas</div>
        <input
          placeholder="Cliente, dirección o número"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ marginTop: 14, width: '100%', padding: '12px 14px', borderRadius: 12, background: 'var(--sf)', border: '1px solid var(--bd)', font: '600 13px Manrope,sans-serif' }}
        />
      </div>

      <div style={{ padding: '16px 20px' }}>
        {loading && <div style={{ textAlign: 'center', color: 'var(--mu)', font: '600 12px Manrope,sans-serif' }}>Cargando…</div>}

        {!loading && filtered.length === 0 && (
          <div style={{ padding: 24, borderRadius: 16, background: 'var(--sf)', border: '1px solid var(--bd)', textAlign: 'center', color: 'var(--mu)', font: '600 12.5px Manrope,sans-serif' }}>
            Aún no tienes entregas asignadas.
          </div>
        )}

        {filtered.map((req) => (
          <div key={req.id} style={{ padding: 16, borderRadius: 16, background: 'var(--sf)', border: '1px solid var(--bd)', marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ font: '700 12px Manrope,sans-serif', color: 'var(--navy)', background: 'var(--navyS)', padding: '4px 10px', borderRadius: 999 }}>
                {serviceLabel(req.service_type)}
              </span>
              <span style={{ font: '800 15px Manrope,sans-serif' }}>{money(req.price)}</span>
            </div>
            <div style={{ marginTop: 10, font: '600 13px Manrope,sans-serif' }}>{req.pickup_address}</div>
            <div style={{ font: '500 12px Manrope,sans-serif', color: 'var(--mu)' }}>→ {req.dropoff_address}</div>
            <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ font: '600 11px Manrope,sans-serif', color: 'var(--mu)' }}>{STATUS_LABELS[req.status]}</span>
              {NEXT_STATUS[req.status] && (
                <button
                  onClick={() => advance(req)}
                  style={{ padding: '8px 14px', borderRadius: 10, background: 'var(--green)', color: '#fff', font: '700 12px Manrope,sans-serif' }}
                >
                  {NEXT_LABEL[req.status]}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <BottomNav />
    </div>
  );
}

export default function EntregasPage() {
  return (
    <RequireSession>
      <EntregasContent />
    </RequireSession>
  );
}
