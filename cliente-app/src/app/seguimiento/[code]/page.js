'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import BottomNav from '../../../components/BottomNav';
import MapView from '../../../components/MapView';
import { Icon, Card, HeroCard, Overline, Button, Chip, Spinner, EmptyState } from '../../../components/ui';
import { useAppMode } from '../../../context/AppModeProvider';
import { trackRequest, loadDemoRequest, serviceInfo, STATUS_STEPS } from '../../../lib/services';
import { routeBetween } from '../../../lib/geo';
import { money } from '../../../lib/pricing';
import { pushNotify } from '../../../lib/notify';

const WHATSAPP = 'https://wa.me/573157924906';

export default function SeguimientoPage() {
  const { code } = useParams();
  const router = useRouter();
  const { isDemo } = useAppMode();
  const [req, setReq] = useState(undefined);
  const [route, setRoute] = useState([]);
  const [error, setError] = useState('');
  const [lastStatus, setLastStatus] = useState(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const r = isDemo ? loadDemoRequest(code) : await trackRequest(code);
        if (alive) setReq(r);
      } catch (e) {
        if (alive) setError(e.message);
      }
    };
    load();
    const t = setInterval(load, isDemo ? 3000 : 8000);
    return () => { alive = false; clearInterval(t); };
  }, [code, isDemo]);

  /* Aviso al cliente cuando el pedido cambia de estado. */
  useEffect(() => {
    if (!req?.status || req.status === lastStatus) return;
    if (lastStatus !== null) {
      const step = STATUS_STEPS.find((s) => s.id === req.status);
      if (step) pushNotify(`Pedido ${step.label.toLowerCase()}`, { body: step.desc, tag: `estado-${code}` });
    }
    setLastStatus(req.status);
  }, [req?.status, lastStatus, code]);

  const pickup = req?.pickup_lat != null ? { lat: req.pickup_lat, lon: req.pickup_lon } : req?.pickup_point || null;
  const dropoff = req?.dropoff_lat != null ? { lat: req.dropoff_lat, lon: req.dropoff_lon } : req?.dropoff_point || null;
  const courier = req?.courier_lat != null ? { lat: req.courier_lat, lon: req.courier_lon } : null;

  useEffect(() => {
    let alive = true;
    if (!pickup || !dropoff) return;
    routeBetween(pickup, dropoff).then((r) => alive && setRoute(r.coords));
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickup?.lat, pickup?.lon, dropoff?.lat, dropoff?.lon]);

  const stepIndex = req ? STATUS_STEPS.findIndex((s) => s.id === req.status) : -1;
  const cancelled = req?.status === 'cancelled';
  const info = req ? serviceInfo(req.service_type) : null;

  return (
    <>
      <header className="dx-topbar">
        <button onClick={() => router.push('/')} style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--surface-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
          <Icon name="arrow_back" size={20} />
        </button>
        <span className="dsp" style={{ fontWeight: 800, fontSize: 22 }}>Tu pedido</span>
      </header>

      <div className="dx-page sc">
        {req === undefined && !error && <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner /></div>}

        {(error || req === null) && (
          <EmptyState
            icon="search_off"
            title="No encontramos el pedido"
            body={`Ningún pedido con el código ${code}. Revisa el código o escríbenos por WhatsApp.`}
            action={<Button icon="chat" color="var(--secondary)" onClick={() => window.open(WHATSAPP, '_blank')}>Escribir por WhatsApp</Button>}
          />
        )}

        {req && (
          <>
            <HeroCard glow={req.status === 'delivered' ? 'green' : 'orange'}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Overline style={{ color: 'rgba(255,255,255,.55)' }}>Código de seguimiento</Overline>
                <span style={{ display: 'flex', gap: 6 }}>
                  {req.turbo && <Chip icon="bolt" bg="rgba(255,255,255,.18)" color="#C8E6B4">TURBO</Chip>}
                  <Chip icon={info.icon} bg="rgba(255,255,255,.12)" color="#fff">{info.label}</Chip>
                </span>
              </div>
              <div className="dsp" style={{ fontWeight: 800, fontSize: 30, letterSpacing: '.06em', marginTop: 6 }}>#{req.tracking_code || code}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,.7)', marginTop: 6, lineHeight: 1.45 }}>
                {cancelled ? 'Este pedido fue cancelado.' : STATUS_STEPS[stepIndex]?.desc}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,.13)' }}>
                <span style={{ flex: 1 }}>
                  <Overline style={{ color: 'rgba(255,255,255,.5)', fontSize: 9.5 }}>Tarifa</Overline>
                  <span className="dsp" style={{ display: 'block', fontWeight: 800, fontSize: 21, marginTop: 2 }}>{money(req.price)}</span>
                </span>
                {req.eta_minutes > 0 && req.status !== 'delivered' && (
                  <span style={{ textAlign: 'right' }}>
                    <Overline style={{ color: 'rgba(255,255,255,.5)', fontSize: 9.5 }}>Llega en</Overline>
                    <span className="dsp" style={{ display: 'block', fontWeight: 800, fontSize: 21, marginTop: 2 }}>{req.eta_minutes} min</span>
                  </span>
                )}
              </div>
            </HeroCard>

            {/* Seguimiento en vivo sobre el mapa */}
            {(pickup || dropoff) && (
              <Card style={{ padding: 0, marginTop: 14, overflow: 'hidden' }} elevation={2}>
                <div style={{ padding: '11px 15px', display: 'flex', alignItems: 'center', gap: 9, background: courier ? 'var(--secondary-container)' : 'var(--surface-container)' }}>
                  {courier && <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--secondary)', animation: 'dxGlow 1.2s infinite' }} />}
                  <span style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: '.05em', color: courier ? 'var(--on-secondary-container)' : 'var(--on-surface-variant)' }}>
                    {courier ? `${req.courier_name || 'Tu repartidor'} EN CAMINO` : 'RUTA DEL PEDIDO'}
                  </span>
                </div>
                <MapView
                  height={230}
                  pickup={pickup}
                  dropoff={dropoff}
                  courier={courier}
                  route={route}
                  style={{ borderRadius: 0, border: 'none' }}
                />
              </Card>
            )}

            {!cancelled && (
              <Card style={{ padding: 16, marginTop: 14 }}>
                <Overline style={{ color: 'var(--on-surface-variant)', marginBottom: 12 }}>Estado del pedido</Overline>
                {STATUS_STEPS.map((step, i) => {
                  const done = i <= stepIndex;
                  const current = i === stepIndex;
                  const last = i === STATUS_STEPS.length - 1;
                  return (
                    <div key={step.id} style={{ display: 'flex', gap: 13 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 'none' }}>
                        <span style={{
                          width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: done ? (current ? 'var(--tertiary)' : 'var(--secondary)') : 'var(--surface-container)',
                          animation: current ? 'dxPulse 2.2s infinite' : undefined,
                        }}>
                          <Icon name={done && !current ? 'check' : step.icon} size={17} fill color={done ? '#fff' : 'var(--outline)'} />
                        </span>
                        {!last && <span style={{ width: 2, flex: 1, minHeight: 22, background: i < stepIndex ? 'var(--secondary)' : 'var(--outline-variant)' }} />}
                      </div>
                      <div style={{ flex: 1, paddingBottom: last ? 0 : 14 }}>
                        <div style={{ fontSize: 13.5, fontWeight: current ? 800 : 700, color: done ? 'var(--on-surface)' : 'var(--on-surface-variant)' }}>{step.label}</div>
                        <div style={{ fontSize: 11.5, color: 'var(--on-surface-variant)', marginTop: 1 }}>{step.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </Card>
            )}

            <Card style={{ padding: 16, marginTop: 14 }}>
              <Overline style={{ color: 'var(--on-surface-variant)', marginBottom: 12 }}>Ruta</Overline>
              <div style={{ display: 'flex', gap: 12 }}>
                <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 'none', paddingTop: 4 }}>
                  <span style={{ width: 11, height: 11, borderRadius: '50%', border: '3px solid var(--primary)' }} />
                  <span style={{ width: 2, flex: 1, minHeight: 24, background: 'var(--outline-variant)' }} />
                </span>
                <span style={{ flex: 1, minWidth: 0, paddingBottom: 14 }}>
                  <Overline style={{ color: 'var(--on-surface-variant)', fontSize: 9.5 }}>Recoger en</Overline>
                  <span style={{ display: 'block', fontSize: 13.5, fontWeight: 700, marginTop: 2 }}>{req.pickup_address}</span>
                </span>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <span style={{ width: 11, height: 11, borderRadius: '50%', background: 'var(--primary)', flex: 'none', marginTop: 4 }} />
                <span style={{ flex: 1, minWidth: 0 }}>
                  <Overline style={{ color: 'var(--on-surface-variant)', fontSize: 9.5 }}>Entregar en</Overline>
                  <span style={{ display: 'block', fontSize: 13.5, fontWeight: 700, marginTop: 2 }}>{req.dropoff_address}</span>
                </span>
              </div>
            </Card>

            <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
              <Button variant="outlined" icon="chat" onClick={() => window.open(WHATSAPP, '_blank')} style={{ flex: 1, padding: 0 }}>Ayuda</Button>
              <Button icon="add" onClick={() => router.push('/pedir')} style={{ flex: 1, padding: 0 }}>Pedir otro</Button>
            </div>
          </>
        )}
      </div>

      <BottomNav />
    </>
  );
}
