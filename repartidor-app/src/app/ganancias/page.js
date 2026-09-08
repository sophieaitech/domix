'use client';

import { useEffect, useState } from 'react';
import RequireSession from '../../components/RequireSession';
import BottomNav from '../../components/BottomNav';
import { Icon, Card, HeroCard, Overline, Chip, StatTile, EmptyState, Button } from '../../components/ui';
import { useCourierSession } from '../../context/CourierSessionProvider';
import { useAppMode } from '../../context/AppModeProvider';
import ModeSwitch from '../../components/ModeSwitch';
import { fetchWeekEarnings, serviceLabel, SERVICE_ICON } from '../../lib/serviceRequests';

const money = (n) => `$${Math.round(n || 0).toLocaleString('es-CO')}`;
const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

function GananciasContent() {
  const { courierProfile, courierId, demoRequests } = useCourierSession();
  const { isDemo } = useAppMode();
  const [liveRecords, setLiveRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isDemo) return setLoading(false);
    if (!courierProfile?.id) return;
    setLoading(true);
    fetchWeekEarnings(courierProfile.id).then(setLiveRecords).catch(() => setLiveRecords([])).finally(() => setLoading(false));
  }, [courierProfile?.id, isDemo]);

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 6);
  weekStart.setHours(0, 0, 0, 0);
  const records = isDemo
    ? demoRequests.filter((r) => r.courier_id === courierId && r.status === 'delivered' && new Date(r.delivered_at) >= weekStart)
    : liveRecords;

  const buckets = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return { key: d.toDateString(), label: DAYS[d.getDay()], total: 0 };
  });
  for (const r of records) {
    const b = buckets.find((x) => x.key === new Date(r.delivered_at).toDateString());
    if (b) b.total += Number(r.price || 0) + Number(r.tip || 0);
  }
  const total = buckets.reduce((s, b) => s + b.total, 0);
  const max = Math.max(1, ...buckets.map((b) => b.total));
  const tips = records.reduce((s, r) => s + Number(r.tip || 0), 0);
  const fees = records.reduce((s, r) => s + Number(r.price || 0), 0);
  const today = new Date().toDateString();

  return (
    <>
      <header className="dx-topbar" style={{ justifyContent: 'space-between' }}>
        <span className="dsp" style={{ fontWeight: 800, fontSize: 25 }}>Ganancias</span>
        <ModeSwitch compact />
      </header>

      <div className="dx-page sc">
        <HeroCard glow="green">
          <Overline style={{ color: 'rgba(255,255,255,.55)' }}>Disponible para retirar</Overline>
          <div className="dsp" style={{ fontWeight: 800, fontSize: 40, letterSpacing: '-.035em', marginTop: 6 }}>{money(total)}</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,.55)', marginTop: 3 }}>
            {courierProfile?.payout_account ? `Se consigna a ${courierProfile.payout_account}` : 'Registra tu cuenta de retiro en Cuenta'}
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 7, height: 84, marginTop: 20 }}>
            {buckets.map((b) => {
              const isToday = b.key === today;
              return (
                <span key={b.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7 }}>
                  {b.total > 0 && (
                    <span style={{ fontSize: 9.5, fontWeight: 800, color: 'rgba(255,255,255,.75)' }}>
                      {Math.round(b.total / 1000)}k
                    </span>
                  )}
                  <span style={{
                    width: '100%', height: Math.max(5, (b.total / max) * 48), borderRadius: '5px 5px 3px 3px',
                    background: isToday ? 'linear-gradient(180deg,#6DBF3F,#43922B)' : 'rgba(255,255,255,.18)',
                    transition: 'height .4s var(--ease-out)',
                  }} />
                  <span style={{ fontSize: 10, fontWeight: 700, color: isToday ? '#A9D98F' : 'rgba(255,255,255,.5)' }}>{b.label}</span>
                </span>
              );
            })}
          </div>
        </HeroCard>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 14 }}>
          <StatTile icon="local_shipping" tone="primary" value={money(fees)} label="Tarifas de entrega" />
          <StatTile icon="volunteer_activism" tone="secondary" value={money(tips)} label="Propinas" />
          <StatTile icon="inventory_2" tone="tertiary" value={records.length} label="Entregas de la semana" />
          <StatTile icon="account_balance" tone="primary" value={courierProfile?.payout_account || '—'} label="Cuenta de retiro" />
        </div>

        <Overline style={{ color: 'var(--on-surface-variant)', margin: '20px 0 8px' }}>Movimientos</Overline>

        {!loading && records.length === 0 && (
          <EmptyState icon="receipt_long" title="Sin movimientos" body="Cuando completes entregas, tus pagos aparecerán aquí." />
        )}

        {records.length > 0 && (
          <Card style={{ padding: 0, overflow: 'hidden' }}>
            {records.map((r, i) => (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 15px', borderTop: i ? '1px solid var(--outline-variant)' : 'none' }}>
                <span style={{ width: 38, height: 38, borderRadius: 'var(--sh-sm)', background: 'var(--secondary-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
                  <Icon name={SERVICE_ICON[r.service_type] || 'inventory_2'} size={19} color="var(--on-secondary-container)" />
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', fontWeight: 700, fontSize: 13.5 }}>{serviceLabel(r.service_type)}</span>
                  <span style={{ display: 'block', fontSize: 11.5, color: 'var(--on-surface-variant)', marginTop: 1 }}>
                    {new Date(r.delivered_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })} · {new Date(r.delivered_at).toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' })}
                  </span>
                </span>
                <span className="dsp" style={{ fontWeight: 800, fontSize: 16, color: 'var(--secondary)' }}>
                  +{money(Number(r.price || 0) + Number(r.tip || 0))}
                </span>
              </div>
            ))}
          </Card>
        )}

        {total > 0 && (
          <Button full icon="account_balance_wallet" color="var(--secondary)" style={{ marginTop: 14 }}>
            Solicitar retiro
          </Button>
        )}
      </div>

      <BottomNav />
    </>
  );
}

export default function GananciasPage() {
  return <RequireSession><GananciasContent /></RequireSession>;
}
