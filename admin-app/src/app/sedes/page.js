'use client';

import { useState } from 'react';
import TopBar from '../../components/TopBar';
import GuiaSeccion from '../../components/GuiaSeccion';
import MapView from '../../components/MapView';
import { Icon, Card, Overline, Button, Chip, Field, EmptyState } from '../../components/ui';
import { useOps } from '../../context/OpsProvider';
import { CITY_PRESETS, findCityPreset, zonesFor } from '../../lib/cities';
import { createBranch, toggleBranch, OPEN_STATUSES } from '../../lib/ops';
import { money } from '../../lib/pricing';

function NuevaSede({ onClose, onCreated, isDemo, setBranches }) {
  const [city, setCity] = useState('Cali');
  const [radius, setRadius] = useState(8);
  const [whatsapp, setWhatsapp] = useState('573157924906');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const preset = findCityPreset(city);

  const submit = async (e) => {
    e.preventDefault();
    if (!preset) return setError('Elige una ciudad de la lista');
    setBusy(true);
    setError('');
    const branch = {
      name: preset.city, city: preset.city, department: preset.department,
      center_lat: preset.lat, center_lon: preset.lon,
      coverage_radius_km: Number(radius) || 8,
      whatsapp, zones: zonesFor(preset.city), is_active: false,
    };
    if (isDemo) {
      setBranches((rows) => [...rows, { ...branch, id: `demo-${Date.now()}`, opened_at: null }]);
      setBusy(false);
      return onCreated();
    }
    const { error } = await createBranch(branch);
    setBusy(false);
    if (error) return setError(error.message);
    onCreated();
  };

  return (
    <Card elevation={3} style={{ padding: 20, marginBottom: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <span className="dsp" style={{ fontWeight: 800, fontSize: 18 }}>Abrir una ciudad nueva</span>
        <button aria-label="Cerrar" onClick={onClose} style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--surface-container)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="close" size={19} />
        </button>
      </div>

      <form onSubmit={submit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(215px,1fr))', gap: 14 }}>
        <label>
          <span style={{ display: 'block', fontSize: 11.5, fontWeight: 800, color: 'var(--on-surface-variant)', marginBottom: 6 }}>Ciudad</span>
          <select value={city} onChange={(e) => setCity(e.target.value)} style={{ width: '100%', height: 52, padding: '0 14px', borderRadius: 'var(--sh-sm)', background: 'var(--surface-lowest)', border: '1px solid var(--outline-variant)', fontSize: 14.5, fontWeight: 600 }}>
            {CITY_PRESETS.map((c) => <option key={c.city} value={c.city}>{c.city} — {c.department}</option>)}
          </select>
        </label>
        <Field required label="Radio de cobertura (km)" icon="radio_button_checked" type="number" value={radius} onChange={(e) => setRadius(e.target.value)} />
        <Field required label="WhatsApp de la sede" icon="call" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />

        {preset && (
          <div style={{ gridColumn: '1 / -1' }}>
            <MapView height={190} center={{ lat: preset.lat, lon: preset.lon }} radiusKm={Number(radius) || 8} interactive={false} />
          </div>
        )}

        <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 12 }}>
          {error && <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--error)' }}>{error}</span>}
          <span style={{ flex: 1 }} />
          <Button variant="outlined" type="button" onClick={onClose}>Cancelar</Button>
          <Button type="submit" icon="add_business" disabled={busy}>{busy ? 'Creando…' : 'Crear sede'}</Button>
        </div>
      </form>
    </Card>
  );
}

export default function SedesPage() {
  const { branches, couriers, requests, isDemo, setBranches, reload } = useOps();
  const [nueva, setNueva] = useState(false);

  const toggle = async (b) => {
    if (isDemo) {
      setBranches((rows) => rows.map((x) => (x.id === b.id ? { ...x, is_active: !x.is_active, opened_at: x.opened_at || new Date().toISOString().slice(0, 10) } : x)));
      return;
    }
    await toggleBranch(b.id, !b.is_active);
    reload();
  };

  return (
    <>
      <TopBar
        title="Sedes y ciudades"
        subtitle="Domix opera hoy en Buenaventura. Abre una ciudad nueva cuando tengas repartidores allá."
        actions={<Button icon="add_business" onClick={() => setNueva(true)} style={{ height: 44 }}>Abrir ciudad</Button>}
      />

      <div className="dx-content sb" style={{ animation: 'trFade .3s ease' }}>
        <GuiaSeccion
          id="sedes"
          tono="purple"
          titulo="Cuando Buenaventura te quede chico"
          frase="Hoy operas en una ciudad. Cuando tengas repartidores en otra, abres la sede y arranca con su propia cobertura."
          puntos={[{ i: 'add_business', t: 'Abrir ciudad', s: 'Cali, Tumaco, la que sea' }, { i: 'map', t: 'Su cobertura', s: 'Cada sede con su radio' }, { i: 'groups', t: 'Su equipo', s: 'Los repartidores quedan por sede' }]}
        />


      {nueva && <NuevaSede isDemo={isDemo} setBranches={setBranches} onClose={() => setNueva(false)} onCreated={() => { setNueva(false); if (!isDemo) reload(); }} />}

      {branches.length === 0 && (
        <EmptyState icon="location_city" title="Sin sedes" body="Crea tu primera sede para empezar a operar." action={<Button icon="add_business" onClick={() => setNueva(true)}>Abrir ciudad</Button>} />
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(330px,1fr))', gap: 16 }}>
        {branches.map((b) => {
          const flota = couriers.filter((c) => (c.branch_id ? c.branch_id === b.id : b.city === 'Buenaventura'));
          const enLinea = flota.filter((c) => c.status === 'online').length;
          const pedidos = requests.filter((r) => (r.branch_id ? r.branch_id === b.id : b.city === 'Buenaventura'));
          const entregados = pedidos.filter((r) => r.status === 'delivered');
          const facturado = entregados.reduce((s, r) => s + Number(r.price || 0), 0);

          return (
            <Card key={b.id} style={{ padding: 0, overflow: 'hidden' }} elevation={b.is_active ? 2 : 1}>
              <MapView
                height={150}
                center={{ lat: b.center_lat, lon: b.center_lon }}
                radiusKm={b.coverage_radius_km}
                couriers={flota.filter((c) => c.lat != null).map((c) => ({ lat: c.lat, lon: c.lon, status: c.status, name: c.first_name }))}
                interactive={false}
                style={{ borderRadius: 0, border: 'none' }}
              />

              <div style={{ padding: 17 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 11 }}>
                  <span style={{ width: 42, height: 42, borderRadius: 'var(--sh-sm)', background: b.is_active ? 'var(--secondary-container)' : 'var(--surface-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
                    <Icon name="location_city" size={21} fill color={b.is_active ? 'var(--on-secondary-container)' : 'var(--on-surface-variant)'} />
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span className="dsp" style={{ display: 'block', fontWeight: 800, fontSize: 17 }}>{b.city}</span>
                    <span style={{ display: 'block', fontSize: 11.5, color: 'var(--on-surface-variant)', marginTop: 2 }}>{b.department}</span>
                  </span>
                  <Chip
                    icon={b.is_active ? 'check_circle' : 'schedule'}
                    bg={b.is_active ? 'var(--secondary-container)' : 'var(--surface-container)'}
                    color={b.is_active ? 'var(--on-secondary-container)' : 'var(--on-surface-variant)'}
                  >
                    {b.is_active ? 'Operando' : 'Por abrir'}
                  </Chip>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 15, paddingTop: 15, borderTop: '1px solid var(--outline-variant)' }}>
                  {[
                    { v: flota.length, l: 'Repartidores' },
                    { v: enLinea, l: 'En línea' },
                    { v: money(facturado), l: 'Facturado' },
                  ].map((s) => (
                    <span key={s.l} style={{ textAlign: 'center' }}>
                      <span className="dsp" style={{ display: 'block', fontWeight: 800, fontSize: 15 }}>{s.v}</span>
                      <span style={{ display: 'block', fontSize: 10, fontWeight: 700, color: 'var(--on-surface-variant)', marginTop: 2 }}>{s.l}</span>
                    </span>
                  ))}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 15, flexWrap: 'wrap' }}>
                  <Chip icon="radio_button_checked">{b.coverage_radius_km} km</Chip>
                  {b.whatsapp && <Chip icon="call">{b.whatsapp.replace('57', '')}</Chip>}
                  <span style={{ flex: 1 }} />
                  <Button
                    variant={b.is_active ? 'outlined' : 'filled'}
                    icon={b.is_active ? 'pause' : 'rocket_launch'}
                    color={b.is_active ? 'var(--on-surface-variant)' : 'var(--secondary)'}
                    onClick={() => toggle(b)}
                    style={{ height: 38, fontSize: 12.5, padding: '0 14px' }}
                  >
                    {b.is_active ? 'Pausar' : 'Abrir sede'}
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
      </div>
    </>
  );
}
