'use client';

import { useRouter } from 'next/navigation';
import TopBar from '../components/TopBar';
import MapView from '../components/MapView';
import { Icon, Card, HeroCard, Overline, Chip, Button, Spinner } from '../components/ui';
import { useOps } from '../context/OpsProvider';
import { SERVICE_LABELS, SERVICE_ICON, STATUS_META, OPEN_STATUSES } from '../lib/ops';
import { money } from '../lib/pricing';

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

function Kpi({ label, value, icon, tone = 'primary', hint, hintTone }) {
  const tones = {
    primary: ['var(--primary-container)', 'var(--on-primary-container)'],
    secondary: ['var(--secondary-container)', 'var(--on-secondary-container)'],
    tertiary: ['var(--tertiary-container)', 'var(--on-tertiary-container)'],
  };
  const [bg, fg] = tones[tone];
  return (
    <Card style={{ padding: 17 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--on-surface-variant)' }}>{label}</span>
        <span style={{ width: 30, height: 30, borderRadius: 'var(--sh-xs)', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={icon} size={17} fill color={fg} />
        </span>
      </div>
      <div className="dsp" style={{ fontWeight: 800, fontSize: 26, marginTop: 10 }}>{value}</div>
      {hint && <div style={{ fontSize: 11.5, fontWeight: 700, color: hintTone || 'var(--on-surface-variant)', marginTop: 4 }}>{hint}</div>}
    </Card>
  );
}

export default function PanelPage() {
  const router = useRouter();
  const { requests, couriers, branches, loading, stats, effectiveRules, suggestedSurge, isDemo } = useOps();

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 90 }}><Spinner /></div>;

  const today = new Date().toDateString();
  const hoy = requests.filter((r) => new Date(r.created_at).toDateString() === today);
  const entregadosHoy = hoy.filter((r) => r.status === 'delivered');
  const ingresoHoy = entregadosHoy.reduce((s, r) => s + Number(r.price || 0), 0);
  const ticket = entregadosHoy.length ? Math.round(ingresoHoy / entregadosHoy.length) : 0;
  const turboHoy = hoy.filter((r) => r.turbo).length;

  const semana = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return { key: d.toDateString(), label: DAYS[d.getDay()], total: 0, count: 0 };
  });
  for (const r of requests) {
    if (r.status !== 'delivered' || !r.delivered_at) continue;
    const b = semana.find((x) => x.key === new Date(r.delivered_at).toDateString());
    if (b) { b.total += Number(r.price || 0); b.count += 1; }
  }
  const maxSemana = Math.max(1, ...semana.map((b) => b.total));
  const totalSemana = semana.reduce((s, b) => s + b.total, 0);

  const porServicio = Object.keys(SERVICE_LABELS).map((k) => ({
    key: k,
    label: SERVICE_LABELS[k],
    count: requests.filter((r) => r.service_type === k && r.status === 'delivered').length,
  })).sort((a, b) => b.count - a.count);
  const maxServicio = Math.max(1, ...porServicio.map((s) => s.count));

  const flota = couriers.filter((c) => c.lat != null).map((c) => ({
    lat: c.lat, lon: c.lon, status: c.status, name: `${c.first_name} ${c.last_name || ''}`.trim(),
  }));
  const centro = branches.find((b) => b.is_active) || branches[0];

  return (
    <>
      <TopBar
        title="Panel general"
        subtitle={new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}
        actions={<Button icon="add" onClick={() => router.push('/pedidos?nuevo=1')} style={{ height: 44 }}>Nuevo pedido</Button>}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 14 }}>
        <Kpi label="Pedidos hoy" value={hoy.length} icon="receipt_long" tone="primary" hint={`${entregadosHoy.length} entregados`} />
        <Kpi label="Sin asignar" value={stats.pending} icon="pending_actions" tone="tertiary" hint={stats.pending ? 'Requieren repartidor' : 'Todo asignado'} hintTone={stats.pending ? 'var(--tertiary)' : undefined} />
        <Kpi label="Ingreso de hoy" value={money(ingresoHoy)} icon="payments" tone="secondary" hint={`Ticket ${money(ticket)}`} />
        <Kpi label="Domix Turbo" value={turboHoy} icon="bolt" tone="tertiary" hint="Pedidos prioritarios hoy" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.5fr) minmax(0,1fr)', gap: 16, marginTop: 16, alignItems: 'start' }}>
        <HeroCard glow="green" style={{ padding: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Overline style={{ color: 'rgba(255,255,255,.55)' }}>Facturado esta semana</Overline>
            <Chip icon="trending_up" bg="rgba(255,255,255,.12)" color="#A9D98F">Últimos 7 días</Chip>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginTop: 8 }}>
            <span className="dsp" style={{ fontWeight: 800, fontSize: 36 }}>{money(totalSemana)}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,.6)' }}>
              {semana.reduce((s, b) => s + b.count, 0)} entregas
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 118, marginTop: 22 }}>
            {semana.map((b) => {
              const isToday = b.key === today;
              return (
                <div key={b.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  {b.total > 0 && <span style={{ fontSize: 10.5, fontWeight: 800, color: 'rgba(255,255,255,.8)' }}>{Math.round(b.total / 1000)}k</span>}
                  <span style={{
                    width: '100%', height: Math.max(6, (b.total / maxSemana) * 72), borderRadius: '6px 6px 3px 3px',
                    background: isToday ? 'linear-gradient(180deg,#4EA33C,#2F7A24)' : 'rgba(255,255,255,.18)',
                    transition: 'height .45s var(--ease-out)',
                  }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: isToday ? '#A9D98F' : 'rgba(255,255,255,.5)' }}>{b.label}</span>
                </div>
              );
            })}
          </div>
        </HeroCard>

        <Card style={{ padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 14.5, fontWeight: 800 }}>Estado de la flota</span>
            <Button variant="text" onClick={() => router.push('/repartidores')} style={{ height: 30, fontSize: 12.5 }}>Ver todos</Button>
          </div>

          {couriers.length === 0 && <div style={{ fontSize: 12.5, color: 'var(--on-surface-variant)' }}>Aún no hay repartidores registrados.</div>}

          {couriers.slice(0, 5).map((c, i) => {
            const on = c.status === 'online';
            const activos = requests.filter((r) => r.courier_id === c.id && OPEN_STATUSES.includes(r.status)).length;
            return (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '11px 0', borderTop: i ? '1px solid var(--outline-variant)' : 'none' }}>
                <span style={{ position: 'relative', width: 38, height: 38, borderRadius: '50%', background: 'var(--primary-container)', color: 'var(--on-primary-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13, flex: 'none' }}>
                  {(c.first_name?.[0] || 'D').toUpperCase()}
                  <span style={{ position: 'absolute', right: -1, bottom: -1, width: 12, height: 12, borderRadius: '50%', border: '2px solid var(--surface-lowest)', background: on ? 'var(--secondary)' : c.status === 'busy' ? 'var(--tertiary)' : 'var(--outline)' }} />
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: 13, fontWeight: 700 }}>{c.first_name} {c.last_name}</span>
                  <span style={{ display: 'block', fontSize: 11, color: 'var(--on-surface-variant)', marginTop: 1 }}>
                    {on ? `En línea · ${c.work_zone}` : c.status === 'busy' ? 'En entrega' : 'Desconectado'}
                  </span>
                </span>
                {activos > 0 && <Chip bg="var(--primary-container)" color="var(--on-primary-container)">{activos}</Chip>}
              </div>
            );
          })}
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 16, marginTop: 16, alignItems: 'start' }}>
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px 18px 12px' }}>
            <span style={{ fontSize: 14.5, fontWeight: 800 }}>Flota en el mapa</span>
            <Button variant="text" onClick={() => router.push('/mapa')} style={{ height: 30, fontSize: 12.5 }}>Ampliar</Button>
          </div>
          <MapView
            height={250}
            center={centro ? { lat: centro.center_lat, lon: centro.center_lon } : undefined}
            couriers={flota}
            radiusKm={centro?.coverage_radius_km}
            style={{ borderRadius: 0, border: 'none', borderTop: '1px solid var(--outline-variant)' }}
          />
        </Card>

        <Card style={{ padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <span style={{ fontSize: 14.5, fontWeight: 800 }}>Servicios más pedidos</span>
            <Chip icon="insights">Histórico</Chip>
          </div>
          {porServicio.map((s) => (
            <div key={s.key} style={{ marginBottom: 13 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 6 }}>
                <Icon name={SERVICE_ICON[s.key]} size={17} color="var(--primary)" />
                <span style={{ flex: 1, fontSize: 12.5, fontWeight: 700 }}>{s.label}</span>
                <span className="dsp" style={{ fontSize: 13, fontWeight: 800 }}>{s.count}</span>
              </div>
              <div style={{ height: 7, borderRadius: 99, background: 'var(--surface-container)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(s.count / maxServicio) * 100}%`, borderRadius: 99, background: 'linear-gradient(90deg,#3E9330,#2F7A24)', transition: 'width .5s var(--ease-out)' }} />
              </div>
            </div>
          ))}

          <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid var(--outline-variant)', display: 'flex', alignItems: 'center', gap: 11 }}>
            <span style={{ width: 40, height: 40, borderRadius: 'var(--sh-sm)', background: 'var(--tertiary-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
              <Icon name="trending_up" size={20} fill color="var(--on-tertiary-container)" />
            </span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: 'block', fontSize: 12.5, fontWeight: 800 }}>Tarifa dinámica {effectiveRules.surge.toFixed(1)}×</span>
              <span style={{ display: 'block', fontSize: 11.5, color: 'var(--on-surface-variant)', marginTop: 1 }}>
                {effectiveRules.autoSurge ? `Automática según demanda (sugerido ${suggestedSurge.toFixed(1)}×)` : 'Fijada manualmente'}
              </span>
            </span>
            <Button variant="outlined" onClick={() => router.push('/despacho')} style={{ height: 36, fontSize: 12.5, padding: '0 13px' }}>Ajustar</Button>
          </div>
        </Card>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '24px 0 12px' }}>
        <span className="dsp" style={{ fontWeight: 800, fontSize: 18 }}>Pedidos recientes</span>
        <Button variant="text" onClick={() => router.push('/pedidos')} style={{ height: 32, fontSize: 12.5 }}>Ver tablero</Button>
      </div>

      <Card style={{ padding: '14px 0 4px', overflowX: 'auto' }}>
        <table className="dx-table">
          <thead>
            <tr><th>Servicio</th><th>Código</th><th>Ruta</th><th>Cliente</th><th>Estado</th><th style={{ textAlign: 'right' }}>Valor</th></tr>
          </thead>
          <tbody>
            {requests.slice(0, 8).map((r) => {
              const st = STATUS_META[r.status] || STATUS_META.requested;
              return (
                <tr key={r.id} onClick={() => router.push('/pedidos')} style={{ cursor: 'pointer' }}>
                  <td>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 9, fontWeight: 700 }}>
                      <span style={{ width: 32, height: 32, borderRadius: 'var(--sh-xs)', background: 'var(--primary-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
                        <Icon name={SERVICE_ICON[r.service_type]} size={17} color="var(--on-primary-container)" />
                      </span>
                      {SERVICE_LABELS[r.service_type]}
                      {r.turbo && <Icon name="bolt" size={15} fill color="var(--secondary)" />}
                    </span>
                  </td>
                  <td style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--on-surface-variant)' }}>#{r.tracking_code}</td>
                  <td style={{ maxWidth: 250 }}>
                    <span style={{ display: 'block', fontSize: 12.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.pickup_address}</span>
                    <span style={{ display: 'block', fontSize: 12, color: 'var(--on-surface-variant)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>→ {r.dropoff_address}</span>
                  </td>
                  <td style={{ fontSize: 12.5 }}>{r.contact_name || '—'}</td>
                  <td><Chip bg={st.bg} color={st.fg}>{st.label}</Chip></td>
                  <td className="dsp" style={{ textAlign: 'right', fontWeight: 800, fontSize: 15 }}>{money(r.price)}</td>
                </tr>
              );
            })}
            {requests.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 34, color: 'var(--on-surface-variant)' }}>
                {isDemo ? 'Sin datos de demo.' : 'Todavía no hay pedidos reales. Los que pidan los clientes aparecerán aquí al instante.'}
              </td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </>
  );
}
