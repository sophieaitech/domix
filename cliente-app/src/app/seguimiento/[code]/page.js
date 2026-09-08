'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import MapView from '../../../components/MapView';
import { Icon, TopBack, Button, Pill, Spinner, EmptyState } from '../../../components/ui';
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
      <TopBack title="Tu pedido" onBack={() => router.push('/')} />

      <div className="sb" style={{ flex: 1, overflowY: 'auto', padding: '0 0 30px', animation: 'trFade .3s ease' }}>
        {req === undefined && !error && <div style={{ display: 'flex', justifyContent: 'center', padding: 50 }}><Spinner /></div>}

        {(error || req === null) && (
          <EmptyState
            icon="search_off"
            title="No encontramos el pedido"
            body={`Ningún pedido con el código ${code}. Revisa el código o escríbenos.`}
            action={<Button full={false} variant="green" icon="chat" onClick={() => window.open(WHATSAPP, '_blank')}>Escribir por WhatsApp</Button>}
          />
        )}

        {req && (
          <>
            {/* Mapa a sangre, como en las apps de viaje */}
            {(pickup || dropoff) && (
              <MapView
                height={250}
                pickup={pickup}
                dropoff={dropoff}
                courier={courier}
                route={route}
                style={{ borderRadius: 0, border: 'none', borderBottom: '1px solid var(--bd)' }}
              />
            )}

            <div style={{ padding: '18px 16px 0' }}>
              {/* Estado actual */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <span style={{ width: 52, height: 52, borderRadius: 14, background: 'var(--sf)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={info.img} alt="" style={{ width: 38, height: 38, objectFit: 'contain' }} />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ font: '800 20px Manrope,sans-serif', letterSpacing: '-.03em' }}>
                    {cancelled ? 'Pedido cancelado' : STATUS_STEPS[stepIndex]?.label}
                  </div>
                  <div style={{ font: '500 12.5px/1.4 Manrope,sans-serif', color: 'var(--mu)', marginTop: 2 }}>
                    {cancelled ? 'Este pedido fue cancelado.' : STATUS_STEPS[stepIndex]?.desc}
                  </div>
                </div>
                {req.turbo && <Pill icon="bolt" tone="navy">TURBO</Pill>}
              </div>

              {/* Datos del pedido */}
              <div style={{ display: 'flex', gap: 9, marginBottom: 18 }}>
                <div style={{ flex: 1, borderRadius: 14, background: 'var(--sf)', padding: '13px 15px' }}>
                  <div style={{ font: '600 10.5px Manrope,sans-serif', letterSpacing: '.1em', color: 'var(--mu)' }}>CÓDIGO</div>
                  <div style={{ font: "700 15px 'IBM Plex Mono',monospace", marginTop: 4 }}>#{req.tracking_code || code}</div>
                </div>
                <div style={{ flex: 1, borderRadius: 14, background: 'var(--sf)', padding: '13px 15px' }}>
                  <div style={{ font: '600 10.5px Manrope,sans-serif', letterSpacing: '.1em', color: 'var(--mu)' }}>TARIFA</div>
                  <div style={{ font: '800 17px Manrope,sans-serif', letterSpacing: '-.02em', marginTop: 3 }}>{money(req.price)}</div>
                </div>
                {req.eta_minutes > 0 && req.status !== 'delivered' && (
                  <div style={{ flex: 1, borderRadius: 14, background: 'var(--sf)', padding: '13px 15px' }}>
                    <div style={{ font: '600 10.5px Manrope,sans-serif', letterSpacing: '.1em', color: 'var(--mu)' }}>LLEGA EN</div>
                    <div style={{ font: '800 17px Manrope,sans-serif', letterSpacing: '-.02em', marginTop: 3 }}>{req.eta_minutes} min</div>
                  </div>
                )}
              </div>

              {/* Repartidor asignado */}
              {req.courier_name && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 13, padding: 14, borderRadius: 14, border: '1px solid var(--bd)', marginBottom: 18 }}>
                  <span style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--sf)', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '800 15px Manrope,sans-serif', flex: 'none' }}>
                    {req.courier_name[0]?.toUpperCase()}
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', font: '700 14.5px Manrope,sans-serif' }}>{req.courier_name}</span>
                    <span style={{ display: 'block', font: '500 12px Manrope,sans-serif', color: 'var(--mu)', marginTop: 1 }}>Tu repartidor Domix</span>
                  </span>
                  <a href={WHATSAPP} target="_blank" rel="noreferrer" style={{ width: 42, height: 42, borderRadius: '50%', background: 'var(--greenS)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name="chat" size={20} fill color="var(--green)" />
                  </a>
                </div>
              )}

              {/* Línea de estado */}
              {!cancelled && (
                <div style={{ borderRadius: 16, border: '1px solid var(--bd)', padding: 16, marginBottom: 18 }}>
                  {STATUS_STEPS.map((step, i) => {
                    const done = i <= stepIndex;
                    const current = i === stepIndex;
                    const last = i === STATUS_STEPS.length - 1;
                    return (
                      <div key={step.id} style={{ display: 'flex', gap: 13 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 'none' }}>
                          <span style={{
                            width: 30, height: 30, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: done ? 'var(--green)' : 'var(--sf2)',
                            animation: current ? 'trRing 1.8s infinite' : undefined,
                          }}>
                            <Icon name={done && !current ? 'check' : step.icon} size={16} fill color={done ? '#fff' : 'var(--mu)'} />
                          </span>
                          {!last && <span style={{ width: 2, flex: 1, minHeight: 20, background: i < stepIndex ? 'var(--green)' : 'var(--bd)' }} />}
                        </div>
                        <div style={{ flex: 1, paddingBottom: last ? 0 : 14 }}>
                          <div style={{ font: `${current ? 800 : 700} 14px Manrope,sans-serif`, color: done ? 'var(--tx)' : 'var(--mu)' }}>{step.label}</div>
                          <div style={{ font: '500 11.5px Manrope,sans-serif', color: 'var(--mu)', marginTop: 1 }}>{step.desc}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Ruta */}
              <div style={{ borderRadius: 16, border: '1px solid var(--bd)', padding: 16, marginBottom: 18 }}>
                <div style={{ display: 'flex', gap: 12 }}>
                  <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 'none', paddingTop: 4 }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', border: '3px solid var(--tx)' }} />
                    <span style={{ width: 2, flex: 1, minHeight: 22, background: 'var(--bd)' }} />
                  </span>
                  <span style={{ flex: 1, minWidth: 0, paddingBottom: 14 }}>
                    <span style={{ display: 'block', font: '600 10.5px Manrope,sans-serif', letterSpacing: '.1em', color: 'var(--mu)' }}>RECOGER EN</span>
                    <span style={{ display: 'block', font: '700 13.5px Manrope,sans-serif', marginTop: 3 }}>{req.pickup_address}</span>
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--green)', flex: 'none', marginTop: 4 }} />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', font: '600 10.5px Manrope,sans-serif', letterSpacing: '.1em', color: 'var(--mu)' }}>ENTREGAR EN</span>
                    <span style={{ display: 'block', font: '700 13.5px Manrope,sans-serif', marginTop: 3 }}>{req.dropoff_address}</span>
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <Button variant="soft" onClick={() => window.open(WHATSAPP, '_blank')} icon="chat">Ayuda</Button>
                <Button onClick={() => router.push('/pedir')} icon="add">Pedir otro</Button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
