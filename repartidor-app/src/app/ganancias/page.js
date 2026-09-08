'use client';

import { useEffect, useState } from 'react';
import RequireSession from '../../components/RequireSession';
import BottomNav from '../../components/BottomNav';
import { useCourierSession } from '../../context/CourierSessionProvider';
import { fetchWeekEarnings } from '../../lib/serviceRequests';

function money(n) {
  return `$${Math.round(n || 0).toLocaleString('es-CO')}`;
}

const DAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

function buildWeekBuckets(records) {
  const buckets = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return { date: d, total: 0, label: DAY_LABELS[d.getDay()] };
  });
  for (const r of records) {
    const d = new Date(r.delivered_at);
    const bucket = buckets.find((b) => b.date.toDateString() === d.toDateString());
    if (bucket) bucket.total += Number(r.price || 0) + Number(r.tip || 0);
  }
  return buckets;
}

function GananciasContent() {
  const { courierProfile } = useCourierSession();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!courierProfile?.id) return;
    fetchWeekEarnings(courierProfile.id)
      .then(setRecords)
      .catch(() => setRecords([]))
      .finally(() => setLoading(false));
  }, [courierProfile?.id]);

  const buckets = buildWeekBuckets(records);
  const weekTotal = buckets.reduce((s, b) => s + b.total, 0);
  const maxBucket = Math.max(1, ...buckets.map((b) => b.total));
  const tips = records.reduce((s, r) => s + Number(r.tip || 0), 0);
  const deliveryFees = records.reduce((s, r) => s + Number(r.price || 0), 0);

  return (
    <div style={{ minHeight: '100dvh', paddingBottom: 90 }}>
      <div style={{ padding: '24px 20px 0' }}>
        <div style={{ font: '800 20px Manrope,sans-serif' }}>Ganancias</div>
      </div>

      <div style={{ margin: '18px 20px', padding: 20, borderRadius: 20, background: 'var(--navy)', color: '#fff' }}>
        <div style={{ font: '600 11px Manrope,sans-serif', opacity: 0.75 }}>ESTA SEMANA</div>
        <div style={{ font: '800 28px Manrope,sans-serif', marginTop: 4 }}>{money(weekTotal)}</div>

        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 90, marginTop: 20 }}>
          {buckets.map((b) => (
            <div key={b.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{ width: '100%', height: `${Math.max(6, (b.total / maxBucket) * 70)}px`, borderRadius: 6, background: 'var(--green)' }} />
              <span style={{ font: '600 10px Manrope,sans-serif', opacity: 0.7 }}>{b.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, margin: '0 20px' }}>
        <div style={{ padding: 16, borderRadius: 16, background: 'var(--sf)', border: '1px solid var(--bd)' }}>
          <div style={{ font: '600 11px Manrope,sans-serif', color: 'var(--mu)' }}>Tarifas de entrega</div>
          <div style={{ font: '800 16px Manrope,sans-serif', marginTop: 4 }}>{money(deliveryFees)}</div>
        </div>
        <div style={{ padding: 16, borderRadius: 16, background: 'var(--sf)', border: '1px solid var(--bd)' }}>
          <div style={{ font: '600 11px Manrope,sans-serif', color: 'var(--mu)' }}>Propinas</div>
          <div style={{ font: '800 16px Manrope,sans-serif', marginTop: 4 }}>{money(tips)}</div>
        </div>
        <div style={{ padding: 16, borderRadius: 16, background: 'var(--sf)', border: '1px solid var(--bd)' }}>
          <div style={{ font: '600 11px Manrope,sans-serif', color: 'var(--mu)' }}>Entregas de la semana</div>
          <div style={{ font: '800 16px Manrope,sans-serif', marginTop: 4 }}>{records.length}</div>
        </div>
        <div style={{ padding: 16, borderRadius: 16, background: 'var(--sf)', border: '1px solid var(--bd)' }}>
          <div style={{ font: '600 11px Manrope,sans-serif', color: 'var(--mu)' }}>Disponible para retirar</div>
          <div style={{ font: '800 16px Manrope,sans-serif', marginTop: 4, color: 'var(--green)' }}>{money(weekTotal)}</div>
        </div>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', color: 'var(--mu)', font: '600 12px Manrope,sans-serif', marginTop: 20 }}>Cargando movimientos…</div>
      )}

      <BottomNav />
    </div>
  );
}

export default function GananciasPage() {
  return (
    <RequireSession>
      <GananciasContent />
    </RequireSession>
  );
}
