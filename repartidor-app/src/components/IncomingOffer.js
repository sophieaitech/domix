'use client';

import { useEffect, useRef, useState } from 'react';
import { Icon, Button, Chip } from './ui';
import MapView from './MapView';
import { money, etaMinutes } from '../lib/pricing';
import { serviceLabel, SERVICE_ICON } from '../lib/serviceRequests';
import { pushNotify } from '../lib/notify';

const SECONDS = 40;

/* Oferta entrante a pantalla completa, con cuenta regresiva.
   Es la pantalla que ve el repartidor cuando le suena un pedido. */
export default function IncomingOffer({ request, onAccept, onDismiss }) {
  const [left, setLeft] = useState(SECONDS);
  const notified = useRef(false);

  useEffect(() => {
    if (notified.current || !request) return;
    notified.current = true;
    pushNotify(`Nuevo pedido · ${money(request.price)}`, {
      body: `${serviceLabel(request.service_type)} — ${request.pickup_address}`,
      tag: `pedido-${request.id}`,
    });
  }, [request]);

  useEffect(() => {
    setLeft(SECONDS);
    const t = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [request?.id]);

  // El descarte va en su propio efecto: llamarlo dentro del actualizador de
  // estado dispararía un setState del padre durante el render de este hijo.
  useEffect(() => {
    if (left === 0) onDismiss?.();
  }, [left, onDismiss]);

  if (!request) return null;

  const pct = (left / SECONDS) * 100;
  const total = Number(request.price || 0) + Number(request.tip || 0);
  const km = request.distance_km || 2.8;
  const eta = request.eta_minutes || etaMinutes(km, request.turbo);

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 300, background: 'var(--surface)', display: 'flex', flexDirection: 'column', animation: 'dxSlideUp .28s var(--ease-out)' }}>
      {/* Encabezado con temporizador */}
      <div style={{ flex: 'none', padding: '18px 20px 16px', background: request.turbo ? 'linear-gradient(135deg,#2E7BC4,#1B4F8F)' : 'linear-gradient(135deg,#2A241E,#17140F)', color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 800, letterSpacing: '.08em' }}>
            <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#fff', animation: 'dxGlow 1s infinite' }} />
            {request.turbo ? 'DOMIX TURBO · PRIORITARIO' : 'NUEVO PEDIDO'}
          </span>
          <span className="num" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700 }}>
            <Icon name="timer" size={17} fill />
            {left}s
          </span>
        </div>

        <div style={{ height: 5, borderRadius: 99, background: 'rgba(255,255,255,.22)', marginTop: 12, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: '#fff', borderRadius: 99, transition: 'width 1s linear' }} />
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 16 }}>
          <span className="num" style={{ fontWeight: 800, fontSize: 42, letterSpacing: '-.03em' }}>{money(total)}</span>
          <span style={{ fontSize: 13, fontWeight: 700, opacity: .8 }}>{km.toFixed(1)} km · {eta} min</span>
        </div>
        {Number(request.tip) > 0 && (
          <div style={{ marginTop: 8 }}>
            <Chip icon="volunteer_activism" bg="rgba(255,255,255,.16)" color="#fff">
              Incluye {money(request.tip)} de propina
            </Chip>
          </div>
        )}
      </div>

      <div className="sc" style={{ flex: 1, padding: '16px 20px 0', overflowY: 'auto' }}>
        {request.pickup_point && request.dropoff_point && (
          <MapView
            height={170}
            pickup={request.pickup_point}
            dropoff={request.dropoff_point}
            interactive={false}
          />
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 16 }}>
          <span style={{ width: 34, height: 34, borderRadius: 'var(--sh-xs)', background: 'var(--primary-container)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name={SERVICE_ICON[request.service_type]} size={18} color="var(--on-primary-container)" />
          </span>
          <span style={{ fontSize: 14, fontWeight: 800 }}>{serviceLabel(request.service_type)}</span>
        </div>

        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', gap: 13 }}>
            <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 'none', paddingTop: 4 }}>
              <span style={{ width: 12, height: 12, borderRadius: '50%', border: '3px solid var(--primary)' }} />
              <span style={{ width: 2, flex: 1, minHeight: 30, background: 'var(--outline-variant)' }} />
            </span>
            <span style={{ flex: 1, minWidth: 0, paddingBottom: 16 }}>
              <span style={{ display: 'block', fontSize: 10.5, fontWeight: 800, letterSpacing: '.08em', color: 'var(--on-surface-variant)' }}>RECOGER EN</span>
              <span style={{ display: 'block', fontSize: 14.5, fontWeight: 700, marginTop: 3 }}>{request.pickup_address}</span>
            </span>
          </div>
          <div style={{ display: 'flex', gap: 13 }}>
            <span style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--primary)', flex: 'none', marginTop: 4 }} />
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: 'block', fontSize: 10.5, fontWeight: 800, letterSpacing: '.08em', color: 'var(--on-surface-variant)' }}>ENTREGAR EN</span>
              <span style={{ display: 'block', fontSize: 14.5, fontWeight: 700, marginTop: 3 }}>{request.dropoff_address}</span>
              {request.contact_name && (
                <span style={{ display: 'block', fontSize: 12.5, color: 'var(--on-surface-variant)', marginTop: 3 }}>
                  {request.contact_name} · {request.contact_phone}
                </span>
              )}
            </span>
          </div>
        </div>
      </div>

      <div style={{ flex: 'none', display: 'flex', gap: 11, padding: '14px 20px 18px', borderTop: '1px solid var(--outline-variant)', background: 'var(--surface-lowest)' }}>
        <button
          onClick={onDismiss}
          style={{ flex: 'none', width: 60, height: 54, borderRadius: 'var(--sh-md)', border: '1px solid var(--outline)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <Icon name="close" size={23} color="var(--on-surface-variant)" />
        </button>
        <Button
          full
          icon="check_circle"
          color={request.turbo ? 'var(--secondary)' : 'var(--primary)'}
          onClick={() => onAccept(request)}
          style={{ height: 54, fontSize: 16, animation: 'dxPulse 2s infinite' }}
        >
          Aceptar pedido
        </Button>
      </div>
    </div>
  );
}
