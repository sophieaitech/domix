'use client';

import { useRouter } from 'next/navigation';
import TopBar from '../components/TopBar';
import GuiaSeccion from '../components/GuiaSeccion';
import MapView from '../components/MapView';
import { Icon, Card, CardTitle, Kpi, Pill, Button, QueueRow, MixBar, Spinner } from '../components/ui';
import { useOps } from '../context/OpsProvider';
import { SERVICE_LABELS, SERVICE_ICON, STATUS_META, OPEN_STATUSES } from '../lib/ops';
import { money } from '../lib/pricing';

/* Franjas horarias del día operativo de Domix. */
const HOURS = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];

const SERVICE_COLOR = {
  mensajeria: 'var(--green)',
  encomienda: 'var(--navy)',
  domicilio: 'var(--amber)',
  mandado: 'var(--purple)',
  autorizacion_medica: 'var(--red)',
};

function hace(iso) {
  const m = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (m < 60) return `hace ${m} min`;
  const h = Math.floor(m / 60);
  return h < 24 ? `hace ${h} h` : `hace ${Math.floor(h / 24)} d`;
}

export default function DashboardPage() {
  const router = useRouter();
  const { requests, couriers, branches, loading, stats, effectiveRules, suggestedSurge, isDemo } = useOps();

  if (loading) {
    return (
      <>
        <TopBar title="Dashboard" subtitle="Cargando la operación…" />
        <div className="dx-content" style={{ display: 'flex', justifyContent: 'center', paddingTop: 70 }}><Spinner /></div>
      </>
    );
  }

  const hoyStr = new Date().toDateString();
  const hoy = requests.filter((r) => new Date(r.created_at).toDateString() === hoyStr);
  const entregadosHoy = hoy.filter((r) => r.status === 'delivered');
  const canceladosHoy = hoy.filter((r) => r.status === 'cancelled');
  const ingresoHoy = entregadosHoy.reduce((s, r) => s + Number(r.price || 0), 0);
  const ticket = entregadosHoy.length ? Math.round(ingresoHoy / entregadosHoy.length) : 0;
  const tasaCancel = hoy.length ? ((canceladosHoy.length / hoy.length) * 100).toFixed(1) : '0,0';

  // Minutos promedio entre que entra el pedido y queda asignado
  const asignados = hoy.filter((r) => r.assigned_at);
  const esperaProm = asignados.length
    ? (asignados.reduce((s, r) => s + (new Date(r.assigned_at) - new Date(r.created_at)) / 60000, 0) / asignados.length).toFixed(1)
    : '0,0';

  // Pedidos por hora, apilando entregados y cancelados
  const cols = HOURS.map((h) => {
    const enHora = hoy.filter((r) => new Date(r.created_at).getHours() === h);
    return {
      h,
      label: `${h}h`,
      done: enHora.filter((r) => r.status !== 'cancelled').length,
      cancel: enHora.filter((r) => r.status === 'cancelled').length,
    };
  });
  const maxCol = Math.max(1, ...cols.map((c) => c.done + c.cancel));

  // Cola de decisiones humanas
  const sinAsignar = requests.filter((r) => r.status === 'requested');
  const demorados = sinAsignar.filter((r) => Date.now() - new Date(r.created_at).getTime() > 8 * 60000);
  const turboActivos = requests.filter((r) => r.turbo && OPEN_STATUSES.includes(r.status));
  const sinCuenta = couriers.filter((c) => !c.payout_account);

  // Mezcla por servicio
  const mezcla = Object.keys(SERVICE_LABELS)
    .map((k) => ({ key: k, label: SERVICE_LABELS[k], count: requests.filter((r) => r.service_type === k).length }))
    .sort((a, b) => b.count - a.count);
  const totalMezcla = mezcla.reduce((s, m) => s + m.count, 0);

  // Mejores repartidores de hoy
  const ranking = couriers
    .map((c) => {
      const suyos = hoy.filter((r) => r.courier_id === c.id && r.status === 'delivered');
      return { ...c, entregas: suyos.length, generado: suyos.reduce((s, r) => s + Number(r.price || 0), 0) };
    })
    .sort((a, b) => b.entregas - a.entregas || b.generado - a.generado)
    .slice(0, 4);

  const actividad = requests.slice(0, 6);
  const flota = couriers.filter((c) => c.lat != null).map((c) => ({
    lat: c.lat, lon: c.lon, status: c.status, name: `${c.first_name} ${c.last_name || ''}`.trim(),
  }));
  const centro = branches.find((b) => b.is_active) || branches[0];

  return (
    <>
      <TopBar
        title="Dashboard"
        subtitle={new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        actions={<Button icon="add" onClick={() => router.push('/pedidos?nuevo=1')}>Nuevo pedido</Button>}
      />

      <div className="dx-content sb" style={{ animation: 'trFade .3s ease' }}>
        <GuiaSeccion
          id="dashboard"
          tono="green"
          titulo="El pulso del día, de un vistazo"
          frase="Estas cifras son de hoy y se mueven solas. Si algo se está atascando, la Cola de aprobación te lo dice antes de que un cliente reclame."
          puntos={[
            { i: 'payments', t: 'Cuánto llevas', s: 'Facturado y ticket promedio' },
            { i: 'timer', t: 'Qué tan rápido', s: 'Minutos hasta asignar repartidor' },
            { i: 'pending_actions', t: 'Qué te falta', s: 'Lo que espera decisión tuya' },
          ]}
        />


        {/* Indicadores del día */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(186px,1fr))', gap: 14, marginBottom: 16 }}>
          <Kpi label="PEDIDOS HOY" value={hoy.length} icon="receipt_long" tone="navy"
               delta={`${entregadosHoy.length} entregados`} hint="· en el día" />
          <Kpi label="FACTURACIÓN" value={money(ingresoHoy)} icon="payments" tone="green"
               delta={`Ticket ${money(ticket)}`} deltaTone="var(--mu)" />
          <Kpi label="TASA DE CANCELACIÓN" value={`${tasaCancel}%`} icon="cancel" tone="red"
               delta={`${canceladosHoy.length} cancelados`} deltaTone="var(--mu)" />
          <Kpi label="ESPERA PROMEDIO" value={`${esperaProm} min`} icon="timer" tone="amber"
               delta="hasta asignar repartidor" deltaTone="var(--mu)" />
        </div>

        {/* Pedidos por hora + cola de aprobación */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 360px', gap: 14, marginBottom: 16, alignItems: 'start' }}>
          <Card>
            <CardTitle
              sub={`Hoy · ${new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}`}
              right={
                <div style={{ display: 'flex', gap: 14 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 9, height: 9, borderRadius: 3, background: 'var(--green)' }} />
                    <span style={{ font: '600 11px Manrope,sans-serif', color: 'var(--mu)' }}>Completados</span>
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 9, height: 9, borderRadius: 3, background: 'var(--amber)' }} />
                    <span style={{ font: '600 11px Manrope,sans-serif', color: 'var(--mu)' }}>Cancelados</span>
                  </span>
                </div>
              }
            >
              Pedidos por hora
            </CardTitle>

            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 176 }}>
              {cols.map((c) => (
                <div key={c.h} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, height: '100%', justifyContent: 'flex-end' }}>
                  <div style={{ width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 2, height: '100%' }}>
                    {c.cancel > 0 && (
                      <div style={{ width: '100%', height: `${(c.cancel / maxCol) * 100}%`, background: 'var(--amber)', borderRadius: '3px 3px 0 0', transformOrigin: 'bottom', animation: 'trBar .6s cubic-bezier(.2,.8,.2,1) both' }} />
                    )}
                    <div style={{ width: '100%', height: `${(c.done / maxCol) * 100}%`, background: 'var(--green)', borderRadius: c.cancel > 0 ? '0 0 2px 2px' : '3px 3px 2px 2px', transformOrigin: 'bottom', animation: 'trBar .6s cubic-bezier(.2,.8,.2,1) both' }} />
                  </div>
                  <div style={{ font: '600 9.5px Manrope,sans-serif', color: 'var(--mu)' }}>{c.label}</div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardTitle sub="Lo que espera una decisión hoy.">Cola de aprobación</CardTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              <QueueRow
                icon="pending_actions" tone="amber"
                label="Pedidos sin asignar" sub="Necesitan repartidor"
                count={sinAsignar.length} onClick={() => router.push('/pedidos')}
              />
              <QueueRow
                icon="schedule" tone="red"
                label="Demorados" sub="Más de 8 min esperando"
                count={demorados.length} onClick={() => router.push('/pedidos')}
              />
              <QueueRow
                icon="bolt" tone="navy"
                label="Turbo en curso" sub="Con promesa de tiempo"
                count={turboActivos.length} onClick={() => router.push('/turbo')}
              />
              <QueueRow
                icon="account_balance" tone="purple"
                label="Sin cuenta de retiro" sub="Repartidores por completar datos"
                count={sinCuenta.length} onClick={() => router.push('/repartidores')}
              />
            </div>
          </Card>
        </div>

        {/* Mezcla · Mejores repartidores · Actividad */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 14, marginBottom: 16 }}>
          <Card>
            <CardTitle>Mezcla por servicio</CardTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {mezcla.map((m) => (
                <MixBar key={m.key} label={m.label} value={m.count} total={totalMezcla} color={SERVICE_COLOR[m.key]} />
              ))}
              {totalMezcla === 0 && (
                <div style={{ font: '500 12.5px Manrope,sans-serif', color: 'var(--mu)' }}>Todavía no hay pedidos para medir.</div>
              )}
            </div>
          </Card>

          <Card>
            <CardTitle right={<Button variant="ghost" onClick={() => router.push('/repartidores')} style={{ height: 28, padding: '0 8px', fontSize: 12 }}>Ver todos</Button>}>
              Mejores repartidores hoy
            </CardTitle>
            {ranking.length === 0 && (
              <div style={{ font: '500 12.5px Manrope,sans-serif', color: 'var(--mu)' }}>Sin repartidores registrados.</div>
            )}
            {ranking.map((c, i) => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '10px 0', borderTop: i ? '1px solid var(--bd2)' : 'none' }}>
                <span style={{ position: 'relative', width: 34, height: 34, borderRadius: '50%', background: 'var(--sf)', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '700 12px Manrope,sans-serif', flex: 'none' }}>
                  {(c.first_name?.[0] || 'D').toUpperCase()}
                  <span style={{ position: 'absolute', right: -1, bottom: -1, width: 11, height: 11, borderRadius: '50%', border: '2px solid var(--bg)', background: c.status === 'online' ? 'var(--green)' : c.status === 'busy' ? 'var(--navy)' : 'var(--mu)' }} />
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', font: '700 12.5px Manrope,sans-serif' }}>{c.first_name} {c.last_name}</span>
                  <span className="num" style={{ display: 'block', font: "500 10.5px 'IBM Plex Mono',monospace", color: 'var(--mu)', marginTop: 1 }}>
                    {c.entregas} entregas · {money(c.generado)}
                  </span>
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 3, flex: 'none' }}>
                  <Icon name="star" size={13} fill color="var(--amber)" />
                  <span className="num" style={{ font: "700 12px 'IBM Plex Mono',monospace" }}>{Number(c.rating || 5).toFixed(1)}</span>
                </span>
              </div>
            ))}
          </Card>

          <Card>
            <CardTitle right={<Button variant="ghost" onClick={() => router.push('/pedidos')} style={{ height: 28, padding: '0 8px', fontSize: 12 }}>Ver todo</Button>}>
              Actividad reciente
            </CardTitle>
            {actividad.length === 0 && (
              <div style={{ font: '500 12.5px Manrope,sans-serif', color: 'var(--mu)' }}>
                {isDemo ? 'Sin datos de demo.' : 'Aún no entran pedidos reales.'}
              </div>
            )}
            {actividad.map((r, i) => {
              const st = STATUS_META[r.status] || STATUS_META.requested;
              return (
                <div key={r.id} style={{ display: 'flex', gap: 10, padding: '10px 0', borderTop: i ? '1px solid var(--bd2)' : 'none' }}>
                  <span style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--sf)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
                    <Icon name={SERVICE_ICON[r.service_type]} size={15} color="var(--mu)" />
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', font: '600 12px/1.4 Manrope,sans-serif' }}>
                      {SERVICE_LABELS[r.service_type]} · {st.label}
                    </span>
                    <span style={{ display: 'block', font: '500 10.5px Manrope,sans-serif', color: 'var(--mu)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.contact_name || 'Cliente'} · {hace(r.created_at)}
                    </span>
                  </span>
                  <span className="num" style={{ font: "700 12px 'IBM Plex Mono',monospace", flex: 'none' }}>{money(r.price)}</span>
                </div>
              );
            })}
          </Card>
        </div>

        {/* Flota en el mapa + estado del motor */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.6fr) minmax(0,1fr)', gap: 14 }}>
          <Card padding={0} style={{ overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px 12px' }}>
              <div style={{ font: '800 15px Manrope,sans-serif', letterSpacing: '-.025em' }}>Flota en el mapa</div>
              <Button variant="ghost" onClick={() => router.push('/mapa')} style={{ height: 28, padding: '0 8px', fontSize: 12 }}>Ampliar</Button>
            </div>
            <MapView
              height={260}
              center={centro ? { lat: centro.center_lat, lon: centro.center_lon } : undefined}
              couriers={flota}
              radiusKm={centro?.coverage_radius_km}
              style={{ borderRadius: 0, border: 'none', borderTop: '1px solid var(--bd2)' }}
            />
          </Card>

          <Card>
            <CardTitle sub="Cómo se está cobrando ahora mismo.">Motor de despacho</CardTitle>

            <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '13px 14px', borderRadius: 11, background: 'var(--sf)', marginBottom: 10 }}>
              <span style={{ width: 32, height: 32, borderRadius: 9, background: 'var(--navyS)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
                <Icon name="trending_up" size={17} fill color="var(--navy)" />
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', font: '700 12.5px Manrope,sans-serif' }}>Tarifa por demanda</span>
                <span style={{ display: 'block', font: '500 10.5px Manrope,sans-serif', color: 'var(--mu)', marginTop: 1 }}>
                  {effectiveRules.autoSurge ? `Automática · sugerido ${suggestedSurge.toFixed(1)}×` : 'Fijada a mano'}
                </span>
              </span>
              <span className="num" style={{ font: "800 17px 'IBM Plex Mono',monospace", color: 'var(--navy)' }}>
                {effectiveRules.surge.toFixed(1)}×
              </span>
            </div>

            {[
              { l: 'Tarifa base', v: money(effectiveRules.baseFare), h: `hasta ${effectiveRules.baseKm} km` },
              { l: 'Km adicional', v: money(effectiveRules.perKm), h: 'por kilómetro' },
              { l: 'Recargo Turbo', v: money(effectiveRules.turboFee), h: `radio ${effectiveRules.turboRadiusKm} km` },
              { l: 'Pago al repartidor', v: `${effectiveRules.courierSharePct}%`, h: 'de cada tarifa' },
            ].map((row) => (
              <div key={row.l} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderTop: '1px solid var(--bd2)' }}>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', font: '600 12px Manrope,sans-serif' }}>{row.l}</span>
                  <span style={{ display: 'block', font: '500 10.5px Manrope,sans-serif', color: 'var(--mu)', marginTop: 1 }}>{row.h}</span>
                </span>
                <span className="num" style={{ font: "700 13px 'IBM Plex Mono',monospace" }}>{row.v}</span>
              </div>
            ))}

            <div style={{ display: 'flex', gap: 7, marginTop: 14, flexWrap: 'wrap' }}>
              {effectiveRules.rainActive && <Pill icon="rainy" tone="navy">Lluvia activa</Pill>}
              {effectiveRules.nightActive && <Pill icon="dark_mode" tone="amber">Nocturno +{effectiveRules.nightSurchargePct}%</Pill>}
              {effectiveRules.autoAssign && <Pill icon="near_me" tone="green">Asignación automática</Pill>}
            </div>

            <Button variant="outline" onClick={() => router.push('/despacho')} style={{ width: '100%', marginTop: 14 }}>
              Ajustar reglas
            </Button>
          </Card>
        </div>
      </div>
    </>
  );
}
