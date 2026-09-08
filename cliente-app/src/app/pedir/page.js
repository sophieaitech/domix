'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AddressField from '../../components/AddressField';
import MapView from '../../components/MapView';
import { Icon, TopBack, Button, Field, Pill, Spinner } from '../../components/ui';
import { useClientSession } from '../../context/ClientSessionProvider';
import { useAppMode } from '../../context/AppModeProvider';
import { SERVICES, createRequest } from '../../lib/services';
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
  const listo = pickup.address && dropoff.address && form.contact_name && form.contact_phone;

  const submit = async (e) => {
    e.preventDefault();
    if (!listo) return;
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
      <TopBack title="Pedir servicio" onBack={() => router.push('/')} />

      <form onSubmit={submit} className="sb" style={{ flex: 1, overflowY: 'auto', padding: '0 16px 130px', animation: 'trFade .3s ease' }}>

        {/* Tipo de servicio */}
        <div className="sb" style={{ display: 'flex', gap: 9, overflowX: 'auto', paddingBottom: 18, margin: '0 -16px', paddingLeft: 16, paddingRight: 16 }}>
          {SERVICES.map((s) => {
            const on = tipo === s.value;
            return (
              <button
                key={s.value} type="button" onClick={() => setTipo(s.value)}
                style={{
                  flex: 'none', width: 96, padding: '12px 8px', borderRadius: 14, textAlign: 'center',
                  background: on ? 'var(--inv)' : 'var(--sf)', color: on ? 'var(--invtx)' : 'var(--tx)',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.img} alt="" style={{ width: 40, height: 40, objectFit: 'contain', margin: '0 auto 7px', display: 'block' }} />
                <span style={{ display: 'block', font: '700 11.5px/1.25 Manrope,sans-serif' }}>{s.label}</span>
              </button>
            );
          })}
        </div>

        {/* Direcciones */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 13, marginBottom: 18 }}>
          <AddressField
            required allowLocate label="Recoger en" icon="trip_origin"
            placeholder="Dirección o negocio de origen"
            value={pickup.address} point={pickup.point} onChange={setPickup}
          />
          <AddressField
            required label="Entregar en" icon="location_on"
            placeholder="Dirección de destino"
            value={dropoff.address} point={dropoff.point} onChange={setDropoff}
          />
        </div>

        {(pickup.point || dropoff.point) && (
          <div style={{ marginBottom: 18 }}>
            <MapView
              height={168}
              center={BUENAVENTURA}
              pickup={pickup.point}
              dropoff={dropoff.point}
              route={route.coords}
              interactive={false}
              style={{ borderRadius: 16, border: '1px solid var(--bd)' }}
            />
          </div>
        )}

        {/* Domix Turbo */}
        <button
          type="button"
          onClick={() => setTurbo((t) => !t)}
          style={{
            display: 'flex', alignItems: 'center', gap: 13, width: '100%', padding: 14, borderRadius: 14,
            textAlign: 'left', marginBottom: 18,
            background: turbo ? 'var(--navy)' : 'var(--bg)',
            color: turbo ? '#fff' : 'var(--tx)',
            border: `1px solid ${turbo ? 'transparent' : 'var(--bd)'}`,
          }}
        >
          <span style={{ width: 42, height: 42, borderRadius: 12, background: turbo ? 'rgba(255,255,255,.18)' : 'var(--navyS)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
            <Icon name="bolt" size={22} fill color={turbo ? '#fff' : 'var(--navy)'} />
          </span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: 'block', font: '700 14.5px Manrope,sans-serif' }}>Domix Turbo</span>
            <span style={{ display: 'block', font: '500 12px/1.4 Manrope,sans-serif', opacity: turbo ? 0.85 : 0.6, marginTop: 1 }}>
              Primero en la fila, en menos de 20 minutos
            </span>
          </span>
          <span style={{ flex: 'none', textAlign: 'right' }}>
            <span style={{ display: 'block', font: '800 13.5px Manrope,sans-serif' }}>+{money(DEFAULT_RULES.turboFee)}</span>
            <Icon name={turbo ? 'check_circle' : 'radio_button_unchecked'} size={19} fill={turbo} style={{ marginTop: 2 }} />
          </span>
        </button>

        {/* Datos de contacto */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 13, marginBottom: 18 }}>
          <Field required label="Tu nombre" icon="person" placeholder="¿Cómo te llamas?" value={form.contact_name} onChange={set('contact_name')} />
          <Field required label="Tu celular (WhatsApp)" icon="call" type="tel" placeholder="315 792 4906" value={form.contact_phone} onChange={set('contact_phone')} />
          <Field label="Detalles (opcional)" icon="notes" rows={3} placeholder="Qué es, referencias, hora preferida…" value={form.description} onChange={set('description')} />
        </div>

        {/* Desglose de la tarifa */}
        <div style={{ borderRadius: 16, background: 'var(--sf)', padding: 16, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ font: '800 15px Manrope,sans-serif', letterSpacing: '-.02em' }}>Tarifa</span>
            {calculating
              ? <Spinner size={17} />
              : route.distanceKm > 0 && <Pill icon="near_me">{route.distanceKm.toFixed(1)} km · {eta} min</Pill>}
          </div>

          {route.distanceKm === 0 ? (
            <div style={{ font: '500 12.5px/1.5 Manrope,sans-serif', color: 'var(--mu)' }}>
              Elige las dos direcciones de la lista y calculamos la distancia y el precio exacto.
              Tarifa mínima {money(DEFAULT_RULES.minFare)}.
            </div>
          ) : (
            <>
              {q.breakdown.map((b) => (
                <div key={b.label} style={{ display: 'flex', gap: 10, padding: '4px 0' }}>
                  <span style={{ flex: 1, font: '500 12.5px Manrope,sans-serif', color: b.tone ? 'var(--navy)' : 'var(--mu)' }}>{b.label}</span>
                  <span style={{ font: '700 12.5px Manrope,sans-serif', color: b.tone ? 'var(--navy)' : 'var(--tx)' }}>{money(b.amount)}</span>
                </div>
              ))}
              <div style={{ display: 'flex', alignItems: 'baseline', marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--bd)' }}>
                <span style={{ flex: 1, font: '700 14px Manrope,sans-serif' }}>Total a pagar</span>
                <span style={{ font: '800 26px Manrope,sans-serif', letterSpacing: '-.03em' }}>{money(q.total)}</span>
              </div>
              <div style={{ display: 'flex', gap: 7, marginTop: 12, flexWrap: 'wrap' }}>
                <Pill icon="payments" tone="green">Pago en efectivo</Pill>
                {q.flags.turbo && <Pill icon="bolt" tone="navy">Turbo</Pill>}
                {q.flags.night && <Pill icon="dark_mode" tone="amber">Nocturno</Pill>}
              </div>
            </>
          )}
        </div>

        {error && (
          <div style={{ display: 'flex', gap: 9, padding: 13, borderRadius: 13, background: 'var(--redS)', color: 'var(--red)', font: '600 12.5px Manrope,sans-serif', marginBottom: 14 }}>
            <Icon name="error" size={18} fill /> {error}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'center', gap: 7 }}>
          <Pill icon="lock_open">Sin registro</Pill>
          <Pill icon="schedule">Respuesta inmediata</Pill>
        </div>
      </form>

      {/* Barra fija de acción */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '12px 16px 20px', background: 'var(--bg)', borderTop: '1px solid var(--bd2)', zIndex: 40 }}>
        <Button onClick={submit} disabled={busy || !listo} icon="arrow_forward">
          {busy ? 'Enviando pedido…' : `Pedir ahora · ${money(q.total)}`}
        </Button>
      </div>
    </>
  );
}

export default function PedirPage() {
  return <Suspense fallback={<div style={{ flex: 1 }} />}><PedirForm /></Suspense>;
}
