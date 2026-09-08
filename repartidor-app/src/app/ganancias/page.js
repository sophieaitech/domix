'use client';

import { useEffect, useState } from 'react';
import RequireSession from '../../components/RequireSession';
import BottomNav from '../../components/BottomNav';
import Icon from '../../components/Icon';
import { useCourierSession } from '../../context/CourierSessionProvider';
import { fetchWeekEarnings, serviceLabel } from '../../lib/serviceRequests';

function money(n) {
  return `$${Math.round(n || 0).toLocaleString('es-CO')}`;
}

const DAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

function buildWeekBuckets(records) {
  const buckets = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return { key: d.toDateString(), date: d, total: 0, label: DAY_LABELS[d.getDay()] };
  });
  for (const r of records) {
    const bucket = buckets.find((b) => b.key === new Date(r.delivered_at).toDateString());
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
  const fees = records.reduce((s, r) => s + Number(r.price || 0), 0);
  const today = new Date().toDateString();

  const tiles = [
    { icon: 'local_shipping', color: 'var(--blue)', value: money(fees), label: 'Tarifas de entrega' },
    { icon: 'volunteer_activism', color: 'var(--green)', value: money(tips), label: 'Propinas' },
    { icon: 'inventory_2', color: 'var(--primary)', value: records.length, label: 'Entregas de la semana' },
    { icon: 'account_balance', color: 'var(--amber)', value: courierProfile?.payout_account || 'Sin cuenta', label: 'Cuenta para retiros' },
  ];

  return (
    <>
      <div style={{ flex: 'none', padding: '20px 20px 10px' }}>
        <div className="dsp" style={{ fontWeight: 800, fontSize: 26 }}>Ganancias</div>
      </div>

      <div className="sc" style={{ flex: 1, overflowY: 'auto', padding: '6px 20px 108px' }}>
        <div style={{ borderRadius: 28, padding: 22, background: 'linear-gradient(145deg,#1B355C 0%,#0C1A31 64%)', color: '#fff', boxShadow: '0 18px 44px rgba(12,26,49,.28)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: -44, top: -54, width: 190, height: 190, borderRadius: '50%', background: 'radial-gradient(circle,rgba(87,166,57,.34),rgba(87,166,57,0) 70%)' }} />
          <div style={{ position: 'relative', fontSize: 10.5, fontWeight: 800, letterSpacing: '.09em', color: 'rgba(255,255,255,.5)' }}>DISPONIBLE PARA RETIRAR</div>
          <div className="dsp" style={{ position: 'relative', fontWeight: 800, fontSize: 40, marginTop: 8 }}>{money(weekTotal)}</div>
          <div style={{ position: 'relative', fontSize: 12, color: 'rgba(255,255,255,.5)', marginTop: 4 }}>
            {courierProfile?.payout_account ? `Se consigna a ${courierProfile.payout_account}` : 'Registra tu cuenta en el perfil'}
          </div>

          <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-end', gap: 7, height: 76, marginTop: 22 }}>
            {buckets.map((b) => {
              const isToday = b.key === today;
              return (
                <span key={b.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7 }}>
                  <span style={{ width: '100%', height: Math.max(5, (b.total / maxBucket) * 56), borderRadius: '5px 5px 2px 2px', background: isToday ? 'var(--primary)' : 'rgba(255,255,255,.22)' }} />
                  <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.5)' }}>{b.label}</span>
                </span>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 11, marginTop: 14 }}>
          {tiles.map((t) => (
            <div key={t.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, padding: 15, boxShadow: 'var(--shadowSm)' }}>
              <Icon name={t.icon} size={20} fill color={t.color} />
              <div className="dsp" style={{ fontWeight: 800, fontSize: 18, marginTop: 9 }}>{t.value}</div>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--muted)', marginTop: 3 }}>{t.label}</div>
            </div>
          ))}
        </div>

        <div className="dsp" style={{ fontWeight: 700, fontSize: 16, marginTop: 22, marginBottom: 10 }}>Movimientos</div>

        {loading && <div style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 600 }}>Cargando…</div>}

        {!loading && records.length === 0 && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: '26px 20px', textAlign: 'center', boxShadow: 'var(--shadowSm)' }}>
            <span style={{ width: 46, height: 46, borderRadius: '50%', background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
              <Icon name="receipt_long" size={22} color="var(--faint)" />
            </span>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 12, lineHeight: 1.5 }}>Aún no tienes entregas cobradas esta semana.</div>
          </div>
        )}

        {records.length > 0 && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, overflow: 'hidden', boxShadow: 'var(--shadowSm)' }}>
            {records.map((r, i) => (
              <div key={r.id || i} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '14px 16px', borderTop: i === 0 ? 'none' : '1px solid var(--border)' }}>
                <span style={{ width: 38, height: 38, borderRadius: 12, background: 'var(--greenSoft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
                  <Icon name="two_wheeler" size={19} color="var(--greenDark)" />
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', fontWeight: 700, fontSize: 14 }}>{serviceLabel(r.service_type)}</span>
                  <span style={{ display: 'block', fontSize: 11.5, color: 'var(--muted)', marginTop: 2 }}>
                    {new Date(r.delivered_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })} · {new Date(r.delivered_at).toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' })}
                  </span>
                </span>
                <span className="dsp" style={{ fontWeight: 800, fontSize: 16, flex: 'none' }}>{money(Number(r.price || 0) + Number(r.tip || 0))}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </>
  );
}

export default function GananciasPage() {
  return (
    <RequireSession>
      <GananciasContent />
    </RequireSession>
  );
}
