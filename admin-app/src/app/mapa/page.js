'use client';

import { useState } from 'react';
import TopBar from '../../components/TopBar';
import MapView from '../../components/MapView';
import { Icon, Card, Overline, Chip, Button } from '../../components/ui';
import { useOps } from '../../context/OpsProvider';
import { SERVICE_LABELS, SERVICE_ICON, STATUS_META, OPEN_STATUSES } from '../../lib/ops';
import { money } from '../../lib/pricing';

export default function MapaPage() {
  const { requests, couriers, branches } = useOps();
  const [selected, setSelected] = useState(null);

  const activos = requests.filter((r) => OPEN_STATUSES.includes(r.status) && r.status !== 'requested');
  const branch = branches.find((b) => b.is_active) || branches[0];
  const centro = branch ? { lat: branch.center_lat, lon: branch.center_lon } : undefined;

  const req = selected ? requests.find((r) => r.id === selected) : null;
  const courierOf = (r) => couriers.find((c) => c.id === r?.courier_id);

  const flota = couriers
    .filter((c) => c.lat != null)
    .map((c) => ({ lat: c.lat, lon: c.lon, status: c.status, name: `${c.first_name} ${c.last_name || ''}`.trim() }));

  const pickup = req ? (req.pickup_point || (req.pickup_lat != null ? { lat: req.pickup_lat, lon: req.pickup_lon } : null)) : null;
  const dropoff = req ? (req.dropoff_point || (req.dropoff_lat != null ? { lat: req.dropoff_lat, lon: req.dropoff_lon } : null)) : null;
  const courier = courierOf(req);

  return (
    <>
      <TopBar
        title="Mapa de flota"
        subtitle="Dónde está cada repartidor y qué está entregando, en tiempo real"
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 330px', gap: 16, alignItems: 'start' }}>
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <MapView
            height={560}
            center={centro}
            couriers={req ? [] : flota}
            pickup={pickup}
            dropoff={dropoff}
            courier={courier?.lat != null ? { lat: courier.lat, lon: courier.lon } : null}
            radiusKm={req ? undefined : branch?.coverage_radius_km}
            style={{ borderRadius: 0, border: 'none' }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '13px 18px', borderTop: '1px solid var(--outline-variant)', flexWrap: 'wrap' }}>
            {[
              ['var(--primary)', 'En línea'],
              ['var(--secondary)', 'En entrega'],
              ['var(--outline)', 'Desconectado'],
            ].map(([c, l]) => (
              <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, fontWeight: 700, color: 'var(--on-surface-variant)' }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: c }} /> {l}
              </span>
            ))}
            <span style={{ flex: 1 }} />
            {req && <Button variant="outlined" icon="close" onClick={() => setSelected(null)} style={{ height: 34, fontSize: 12.5, padding: '0 13px' }}>Ver toda la flota</Button>}
          </div>
        </Card>

        <div>
          <Card style={{ padding: 16, marginBottom: 14 }}>
            <Overline style={{ color: 'var(--on-surface-variant)', marginBottom: 11 }}>Cobertura</Overline>
            <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
              <span style={{ width: 40, height: 40, borderRadius: 'var(--sh-sm)', background: 'var(--primary-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
                <Icon name="location_city" size={20} fill color="var(--on-primary-container)" />
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 13.5, fontWeight: 800 }}>{branch?.city || 'Buenaventura'}</span>
                <span style={{ display: 'block', fontSize: 11.5, color: 'var(--on-surface-variant)', marginTop: 1 }}>
                  Radio de {branch?.coverage_radius_km || 8} km
                </span>
              </span>
            </div>
          </Card>

          <Overline style={{ color: 'var(--on-surface-variant)', marginBottom: 10 }}>Entregas en curso ({activos.length})</Overline>

          {activos.length === 0 && (
            <Card style={{ padding: 20, textAlign: 'center', fontSize: 12.5, color: 'var(--on-surface-variant)', lineHeight: 1.5 }}>
              No hay entregas en la calle ahora mismo.
            </Card>
          )}

          {activos.map((r) => {
            const c = courierOf(r);
            const st = STATUS_META[r.status];
            const on = selected === r.id;
            return (
              <Card
                key={r.id}
                elevation={on ? 3 : 1}
                style={{ padding: 13, marginBottom: 10, cursor: 'pointer', border: on ? '1.5px solid var(--primary)' : undefined }}
                onClick={() => setSelected(on ? null : r.id)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 32, height: 32, borderRadius: 'var(--sh-xs)', background: 'var(--primary-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
                    <Icon name={SERVICE_ICON[r.service_type]} size={17} color="var(--on-primary-container)" />
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: 12.5, fontWeight: 800 }}>{SERVICE_LABELS[r.service_type]}</span>
                    <span style={{ display: 'block', fontSize: 11, color: 'var(--on-surface-variant)' }}>
                      {c ? `${c.first_name} ${c.last_name || ''}`.trim() : 'Sin repartidor'}
                    </span>
                  </span>
                  <span className="dsp" style={{ fontWeight: 800, fontSize: 15 }}>{money(r.price)}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
                  <Chip bg={st.bg} color={st.fg}>{st.label}</Chip>
                  {r.turbo && <Chip icon="bolt" bg="var(--secondary)" color="#fff">TURBO</Chip>}
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </>
  );
}
