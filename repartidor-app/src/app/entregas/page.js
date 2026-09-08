'use client';

import { useEffect, useState } from 'react';
import RequireSession from '../../components/RequireSession';
import BottomNav from '../../components/BottomNav';
import { Icon, Card, Overline, Button, Chip, EmptyState } from '../../components/ui';
import { useCourierSession } from '../../context/CourierSessionProvider';
import { useAppMode } from '../../context/AppModeProvider';
import ModeSwitch from '../../components/ModeSwitch';
import { fetchCourierDeliveries, updateRequestStatus, serviceLabel, SERVICE_ICON } from '../../lib/serviceRequests';

const money = (n) => `$${Math.round(n || 0).toLocaleString('es-CO')}`;

const STATUS = {
  requested: { label: 'Solicitado', bg: 'var(--surface-container)', fg: 'var(--on-surface-variant)' },
  assigned: { label: 'Por recoger', bg: 'var(--tertiary-container)', fg: 'var(--on-tertiary-container)' },
  picked_up: { label: 'Recogido', bg: 'var(--primary-container)', fg: 'var(--on-primary-container)' },
  in_progress: { label: 'En camino', bg: 'var(--primary-container)', fg: 'var(--on-primary-container)' },
  delivered: { label: 'Entregado', bg: 'var(--secondary-container)', fg: 'var(--on-secondary-container)' },
  cancelled: { label: 'Cancelado', bg: 'var(--error-container)', fg: 'var(--on-error-container)' },
};

const NEXT = { assigned: 'picked_up', picked_up: 'in_progress', in_progress: 'delivered' };
const NEXT_LABEL = { assigned: 'Marcar recogido', picked_up: 'Voy en camino', in_progress: 'Marcar entregado' };
const NEXT_ICON = { assigned: 'inventory', picked_up: 'navigation', in_progress: 'task_alt' };

const FILTERS = [
  { id: 'activos', label: 'Activos', match: (s) => ['assigned', 'picked_up', 'in_progress'].includes(s) },
  { id: 'entregados', label: 'Entregados', match: (s) => s === 'delivered' },
  { id: 'todos', label: 'Todos', match: () => true },
];

function EntregasContent() {
  const { courierProfile, courierId, demoRequests, demoAdvance } = useCourierSession();
  const { isDemo } = useAppMode();
  const [liveItems, setLiveItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('activos');

  const load = () => {
    if (isDemo) return setLoading(false);
    if (!courierProfile?.id) return;
    fetchCourierDeliveries(courierProfile.id).then(setLiveItems).catch(() => setLiveItems([])).finally(() => setLoading(false));
  };
  useEffect(load, [courierProfile?.id, isDemo]);

  const items = isDemo ? demoRequests.filter((r) => r.courier_id === courierId) : liveItems;

  const advance = async (req) => {
    const next = NEXT[req.status];
    if (!next) return;
    if (isDemo) return demoAdvance(req.id, next);
    const { error } = await updateRequestStatus(req.id, next);
    if (!error) load();
  };

  const q = query.toLowerCase();
  const activeFilter = FILTERS.find((f) => f.id === filter);
  const list = items.filter((d) => activeFilter.match(d.status)).filter((d) =>
    !q || [d.pickup_address, d.dropoff_address, d.contact_name, d.tracking_code].some((v) => v?.toLowerCase().includes(q))
  );

  return (
    <>
      <header className="dx-topbar" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 12 }}>
        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span className="dsp" style={{ fontWeight: 800, fontSize: 25 }}>Entregas</span>
          <ModeSwitch compact />
        </span>

        <span style={{ display: 'flex', alignItems: 'center', gap: 10, height: 48, padding: '0 15px', borderRadius: 'var(--sh-full)', background: 'var(--surface-container)' }}>
          <Icon name="search" size={20} color="var(--on-surface-variant)" />
          <input
            placeholder="Cliente, dirección o código"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ flex: 1, fontSize: 14, fontWeight: 600 }}
          />
          {query && <button onClick={() => setQuery('')} style={{ display: 'flex' }}><Icon name="close" size={18} color="var(--on-surface-variant)" /></button>}
        </span>

        <span style={{ display: 'flex', gap: 8 }}>
          {FILTERS.map((f) => {
            const on = filter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                style={{
                  height: 34, padding: '0 14px', borderRadius: 'var(--sh-xs)', fontSize: 12.5, fontWeight: 700,
                  background: on ? 'var(--secondary-container)' : 'transparent',
                  color: on ? 'var(--on-secondary-container)' : 'var(--on-surface-variant)',
                  border: on ? '1px solid transparent' : '1px solid var(--outline-variant)',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                {on && <Icon name="check" size={16} />}
                {f.label}
              </button>
            );
          })}
        </span>
      </header>

      <div className="dx-page sc">
        {!loading && list.length === 0 && (
          <EmptyState
            icon="receipt_long"
            title={filter === 'activos' ? 'Sin entregas activas' : 'Nada por aquí'}
            body={filter === 'activos' ? 'Los pedidos que aceptes aparecerán aquí con su paso a paso.' : 'Prueba con otro filtro o búsqueda.'}
          />
        )}

        {list.map((req) => {
          const st = STATUS[req.status] || STATUS.requested;
          return (
            <Card key={req.id} elevation={1} style={{ padding: 15, marginBottom: 11 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ width: 44, height: 44, borderRadius: 'var(--sh-sm)', background: 'var(--primary-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
                  <Icon name={SERVICE_ICON[req.service_type] || 'inventory_2'} size={21} color="var(--on-primary-container)" />
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', fontWeight: 700, fontSize: 14.5 }}>{serviceLabel(req.service_type)}</span>
                  <span style={{ display: 'block', fontSize: 11.5, color: 'var(--on-surface-variant)', marginTop: 1 }}>
                    #{req.tracking_code} · {new Date(req.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
                  </span>
                </span>
                <span className="dsp" style={{ fontWeight: 800, fontSize: 18 }}>{money(req.price)}</span>
              </div>

              <div style={{ marginTop: 13, paddingTop: 13, borderTop: '1px solid var(--outline-variant)' }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 13, fontWeight: 600 }}>
                  <span style={{ width: 9, height: 9, borderRadius: '50%', border: '2.5px solid var(--primary)', flex: 'none' }} />
                  <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{req.pickup_address}</span>
                </div>
                <div style={{ width: 2, height: 12, background: 'var(--outline-variant)', marginLeft: 4 }} />
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 13, fontWeight: 600 }}>
                  <span style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--primary)', flex: 'none' }} />
                  <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{req.dropoff_address}</span>
                </div>
              </div>

              {req.contact_phone && ['assigned', 'picked_up', 'in_progress'].includes(req.status) && (
                <a
                  href={`https://wa.me/57${req.contact_phone.replace(/\D/g, '').slice(-10)}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, padding: '10px 12px', borderRadius: 'var(--sh-sm)', background: 'var(--secondary-container)', color: 'var(--on-secondary-container)', fontSize: 12.5, fontWeight: 700 }}
                >
                  <Icon name="chat" size={17} fill />
                  Escribir a {req.contact_name || 'cliente'}
                </a>
              )}

              <div style={{ marginTop: 13, display: 'flex', alignItems: 'center', gap: 10 }}>
                <Chip bg={st.bg} color={st.fg}>{st.label}</Chip>
                <span style={{ flex: 1 }} />
                {NEXT[req.status] && (
                  <Button icon={NEXT_ICON[req.status]} onClick={() => advance(req)} style={{ height: 42, padding: '0 16px', fontSize: 13 }}>
                    {NEXT_LABEL[req.status]}
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <BottomNav badges={{ '/entregas': items.filter((d) => ['assigned', 'picked_up', 'in_progress'].includes(d.status)).length }} />
    </>
  );
}

export default function EntregasPage() {
  return <RequireSession><EntregasContent /></RequireSession>;
}
