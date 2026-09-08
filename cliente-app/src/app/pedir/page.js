'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import BottomNav from '../../components/BottomNav';
import AddressField from '../../components/AddressField';
import MapView from '../../components/MapView';
import { Icon, Card, Overline, Button, Field, Chip, Spinner } from '../../components/ui';
import { useClientSession } from '../../context/ClientSessionProvider';
import { useAppMode } from '../../context/AppModeProvider';
import { SERVICES, serviceInfo, createRequest } from '../../lib/services';
import { quote, etaMinutes, money, DEFAULT_RULES } from '../../lib/pricing';
import { routeBetween, BUENAVENTURA } from '../../lib/geo';
import { pushNotify } from '../../lib/notify';

function PedirForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { client, saveClient } = useClientSession();
  const { isDemo } = useAppMode();

  const [tipo, setTipo] = useState(params.get('tipo') || 'mensajeria');
  const [turbo, setTurbo] = useState(params.get('turbo') === '1');
  const [pickup, setPickup] = useState({ address: '', point: null });
  const [dropoff, setDropoff] = useState({ address: '', point: null });
  const [form, setForm] = useState({ contact_name: client?.name || '', contact_phone: client?.phone || '', description: '' });
  const [route, setRoute] = useState({ coords: [], distanceKm: 0, durationMin: null });
  const [calculating, setCalculating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  /* Cuando hay origen y destino con coordenadas, calculamos ruta real y tarifa. */
  useEffect(() => {
    let alive = true;
    if (!pickup.point || !dropoff.point) return setRoute({ coords: [], distanceKm: 0, durationMin: null });
    setCalculating(true);
    routeBetween(pickup.point, dropoff.point).then((r) => {
      if (!alive) return;
      setRoute(r);
      setCalculating(false);
    });
    return () => { alive = false; };
  }, [pickup.point, dropoff.point]);

  const q = quote({ distanceKm: route.distanceKm, serviceType: tipo, turbo });
  const eta = route.durationMin ?? etaMinutes(route.distanceKm, turbo);
  const outOfRange = route.distanceKm > DEFAULT_RULES.coverageRadiusKm;
  const turboOutOfRange = turbo && route.distanceKm > DEFAULT_RULES.turboRadiusKm;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);

    const payload = {
      service_type: tipo,
      contact_name: form.contact_name,
      contact_phone: form.contact_phone,
      pickup_address: pickup.address,
      dropoff_address: dropoff.address,
      description: form.description || null,
      price: q.total,
      source: 'app',
      turbo,
      distance_km: route.distanceKm || null,
      eta_minutes: eta,
      pickup_lat: pickup.point?.lat ?? null,
      pickup_lon: pickup.point?.lon ?? null,
      dropoff_lat: dropoff.point?.lat ?? null,
      dropoff_lon: dropoff.point?.lon ?? null,
      price_breakdown: q.breakdown,
    };

    saveClient({ name: form.contact_name, phone: form.contact_phone });

    if (isDemo) {
      const code = Math.random().toString(16).slice(2, 10);
      try {
        localStorage.setItem(`domix_demo_${code}`, JSON.stringify({
          ...payload, tracking_code: code, status: 'requested', created_at: new Date().toISOString(),
          pickup_point: pickup.point, dropoff_point: dropoff.point, is_demo: true,
        }));
      } catch { /* ignorar */ }
      pushNotify('Pedido recibido', { body: 'Estamos buscando un repartidor cerca', tag: `demo-${code}` });
      setBusy(false);
      return router.push(`/seguimiento/${code}`);
    }

    const { data, error } = await createRequest(payload);
    setBusy(false);
    if (error) return setError(error.message);
    pushNotify('Pedido recibido', { body: 'Estamos buscando un repartidor cerca', tag: data.tracking_code });
    router.push(`/seguimiento/${data.tracking_code}`);
  };

  return (
    <>
      <header className="dx-topbar">
        <button onClick={() => router.push('/')} style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--surface-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
          <Icon name="arrow_back" size={20} />
        </button>
        <span className="dsp" style={{ fontWeight: 800, fontSize: 22 }}>Pedir servicio</span>
      </header>

      <form onSubmit={submit} className="dx-page sc" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <Overline style={{ color: 'var(--on-surface-variant)', marginBottom: 9 }}>¿Qué necesitas?</Overline>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
            {SERVICES.map((s) => {
              const on = tipo === s.value;
              return (
                <button
                  key={s.value} type="button" onClick={() => setTipo(s.value)}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6, padding: 12,
                    borderRadius: 'var(--sh-md)', textAlign: 'left',
                    background: on ? 'var(--primary)' : 'var(--surface-lowest)',
                    color: on ? 'var(--on-primary)' : 'var(--on-surface)',
                    border: `1px solid ${on ? 'var(--primary)' : 'var(--outline-variant)'}`,
                    boxShadow: on ? 'var(--elev-2)' : 'none',
                    gridColumn: s.value === 'mandado' ? 'span 2' : undefined,
                  }}
                >
                  <Icon name={s.icon} size={21} fill={on} color={on ? '#fff' : 'var(--primary)'} />
                  <span style={{ fontSize: 12.5, fontWeight: 800, lineHeight: 1.2 }}>{s.label}</span>
                  <span style={{ fontSize: 10.5, fontWeight: 700, opacity: on ? .85 : .6 }}>desde {money(s.from)}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Domix Turbo */}
        <button
          type="button"
          onClick={() => setTurbo((t) => !t)}
          style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: 14, borderRadius: 'var(--sh-lg)', textAlign: 'left',
            background: turbo ? 'linear-gradient(135deg,#2E7BC4,#1B4F8F)' : 'var(--surface-lowest)',
            color: turbo ? '#fff' : 'var(--on-surface)',
            border: `1.5px solid ${turbo ? 'transparent' : 'var(--outline-variant)'}`,
            boxShadow: turbo ? '0 8px 22px rgba(27,79,143,.28)' : 'none',
          }}
        >
          <span style={{ width: 42, height: 42, borderRadius: 'var(--sh-sm)', background: turbo ? 'rgba(255,255,255,.2)' : 'var(--tertiary-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
            <Icon name="bolt" size={22} fill color={turbo ? '#fff' : 'var(--on-tertiary-container)'} />
          </span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: 'block', fontSize: 13.5, fontWeight: 800 }}>Domix Turbo</span>
            <span style={{ display: 'block', fontSize: 11.5, marginTop: 2, opacity: turbo ? .9 : .65 }}>
              Prioridad total: el repartidor más cercano sale de inmediato
            </span>
          </span>
          <span style={{ flex: 'none', textAlign: 'right' }}>
            <span style={{ display: 'block', fontSize: 13, fontWeight: 800 }}>+{money(DEFAULT_RULES.turboFee)}</span>
            <Icon name={turbo ? 'check_circle' : 'radio_button_unchecked'} size={19} fill={turbo} color={turbo ? '#fff' : 'var(--outline)'} />
          </span>
        </button>

        <Card style={{ padding: 15, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Overline style={{ color: 'var(--on-surface-variant)' }}>Direcciones</Overline>
          <AddressField
            required allowLocate label="Recoger en" icon="trip_origin"
            placeholder="Dirección o negocio de origen"
            value={pickup.address} point={pickup.point}
            onChange={setPickup}
          />
          <AddressField
            required label="Entregar en" icon="location_on"
            placeholder="Dirección de destino"
            value={dropoff.address} point={dropoff.point}
            onChange={setDropoff}
          />

          {(pickup.point || dropoff.point) && (
            <MapView
              height={165}
              center={BUENAVENTURA}
              pickup={pickup.point}
              dropoff={dropoff.point}
              route={route.coords}
              interactive={false}
            />
          )}
        </Card>

        {/* Tarifa calculada */}
        <Card style={{ padding: 0, overflow: 'hidden' }} elevation={2}>
          <div style={{ padding: '13px 15px', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 800, letterSpacing: '.05em' }}>
              <Icon name="calculate" size={17} fill /> TARIFA CALCULADA
            </span>
            {calculating ? <Spinner size={18} color="#fff" /> : route.distanceKm > 0 && (
              <span style={{ fontSize: 12, fontWeight: 700, opacity: .85 }}>{route.distanceKm.toFixed(1)} km · {eta} min</span>
            )}
          </div>

          <div style={{ padding: 15 }}>
            {route.distanceKm === 0 ? (
              <div style={{ fontSize: 12.5, color: 'var(--on-surface-variant)', lineHeight: 1.5 }}>
                Elige las dos direcciones de la lista y calculamos la distancia y el precio exacto.
                Tarifa mínima {money(DEFAULT_RULES.minFare)}.
              </div>
            ) : (
              <>
                {q.breakdown.map((b) => (
                  <div key={b.label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '5px 0' }}>
                    <span style={{ flex: 1, fontSize: 12.5, fontWeight: 600, color: b.tone ? 'var(--tertiary)' : 'var(--on-surface-variant)' }}>{b.label}</span>
                    <span style={{ fontSize: 12.5, fontWeight: 800, color: b.tone ? 'var(--tertiary)' : 'var(--on-surface)' }}>{money(b.amount)}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', alignItems: 'center', marginTop: 11, paddingTop: 11, borderTop: '1px solid var(--outline-variant)' }}>
                  <span style={{ flex: 1, fontSize: 13.5, fontWeight: 800 }}>Total a pagar</span>
                  <span className="dsp" style={{ fontWeight: 800, fontSize: 26 }}>{money(q.total)}</span>
                </div>
                <div style={{ display: 'flex', gap: 7, marginTop: 11, flexWrap: 'wrap' }}>
                  {q.flags.turbo && <Chip icon="bolt" bg="var(--tertiary-container)" color="var(--on-tertiary-container)">Turbo</Chip>}
                  {q.flags.night && <Chip icon="dark_mode">Nocturno</Chip>}
                  {q.flags.surge && <Chip icon="trending_up" bg="var(--tertiary-container)" color="var(--on-tertiary-container)">Alta demanda</Chip>}
                  <Chip icon="payments" bg="var(--secondary-container)" color="var(--on-secondary-container)">Pago en efectivo</Chip>
                </div>
              </>
            )}
          </div>
        </Card>

        {outOfRange && (
          <div style={{ display: 'flex', gap: 9, padding: 13, borderRadius: 'var(--sh-sm)', background: 'var(--tertiary-container)', color: 'var(--on-tertiary-container)', fontSize: 12.5, fontWeight: 600, lineHeight: 1.45 }}>
            <Icon name="warning" size={18} fill />
            Estás fuera del radio de cobertura habitual ({DEFAULT_RULES.coverageRadiusKm} km). Podemos hacerlo, pero te confirmamos por WhatsApp.
          </div>
        )}
        {turboOutOfRange && (
          <div style={{ display: 'flex', gap: 9, padding: 13, borderRadius: 'var(--sh-sm)', background: 'var(--error-container)', color: 'var(--on-error-container)', fontSize: 12.5, fontWeight: 600, lineHeight: 1.45 }}>
            <Icon name="bolt" size={18} fill />
            Domix Turbo cubre hasta {DEFAULT_RULES.turboRadiusKm} km. Este destino se entrega en tiempo normal.
          </div>
        )}

        <Card style={{ padding: 15, display: 'flex', flexDirection: 'column', gap: 13 }}>
          <Overline style={{ color: 'var(--on-surface-variant)' }}>Tus datos</Overline>
          <Field required label="Nombre" icon="person" placeholder="¿Cómo te llamas?" value={form.contact_name} onChange={set('contact_name')} />
          <Field required label="Celular (WhatsApp)" icon="call" type="tel" placeholder="315 792 4906" value={form.contact_phone} onChange={set('contact_phone')} />
          <Field label="Detalles (opcional)" icon="notes" rows={3} placeholder="Qué es, referencias, hora preferida…" value={form.description} onChange={set('description')} />
        </Card>

        {error && (
          <div style={{ display: 'flex', gap: 9, padding: 13, borderRadius: 'var(--sh-sm)', background: 'var(--error-container)', color: 'var(--on-error-container)', fontSize: 12.5, fontWeight: 600 }}>
            <Icon name="error" size={18} fill /> {error}
          </div>
        )}

        <Button full type="submit" icon="send" disabled={busy} color={turbo ? 'var(--secondary)' : 'var(--primary)'}>
          {busy ? 'Enviando pedido…' : `Pedir ahora · ${money(q.total)}`}
        </Button>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 7 }}>
          <Chip icon="lock_open">Sin registro</Chip>
          <Chip icon="schedule">Respuesta inmediata</Chip>
        </div>
      </form>

      <BottomNav />
    </>
  );
}

export default function PedirPage() {
  return <Suspense fallback={<div className="dx-page" />}><PedirForm /></Suspense>;
}
