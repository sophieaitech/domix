'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import BottomNav from '../../components/BottomNav';
import { Icon, Card, Overline, Button, Chip, EmptyState, Spinner, Field } from '../../components/ui';
import { useClientSession } from '../../context/ClientSessionProvider';
import { useAppMode } from '../../context/AppModeProvider';
import ModeSwitch from '../../components/ModeSwitch';
import ThemeToggle from '../../components/ThemeToggle';
import { fetchMyRequests, listDemoRequests, serviceInfo, STATUS_STEPS } from '../../lib/services';

const money = (n) => `$${Math.round(n || 0).toLocaleString('es-CO')}`;

const STATUS_TONE = {
  requested: ['var(--surface-container)', 'var(--on-surface-variant)'],
  assigned: ['var(--tertiary-container)', 'var(--on-tertiary-container)'],
  picked_up: ['var(--primary-container)', 'var(--on-primary-container)'],
  in_progress: ['var(--primary-container)', 'var(--on-primary-container)'],
  delivered: ['var(--secondary-container)', 'var(--on-secondary-container)'],
  cancelled: ['var(--error-container)', 'var(--on-error-container)'],
};

export default function MisPedidosPage() {
  const router = useRouter();
  const { client, ready, saveClient } = useClientSession();
  const { isDemo } = useAppMode();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [phone, setPhone] = useState('');

  useEffect(() => {
    if (!ready) return;
    if (isDemo) {
      setRows(listDemoRequests(client?.phone));
      setLoading(false);
      const t = setInterval(() => setRows(listDemoRequests(client?.phone)), 4000);
      return () => clearInterval(t);
    }
    if (!client?.phone) return setLoading(false);
    fetchMyRequests(client.phone).then(setRows).catch(() => setRows([])).finally(() => setLoading(false));
  }, [ready, client?.phone, isDemo]);

  const buscar = (e) => {
    e.preventDefault();
    saveClient({ name: client?.name || '', phone });
    setLoading(true);
  };

  return (
    <>
      <header className="dx-topbar" style={{ justifyContent: 'space-between' }}>
        <span className="dsp" style={{ fontWeight: 800, fontSize: 25 }}>Mis pedidos</span>
        <ThemeToggle compact />
        <ModeSwitch compact />
      </header>

      <div className="dx-page sc">
        {ready && !client?.phone && !isDemo && (
          <Card style={{ padding: 16 }}>
            <Overline style={{ color: 'var(--on-surface-variant)', marginBottom: 10 }}>Consulta tus pedidos</Overline>
            <form onSubmit={buscar} style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
              <Field required label="Tu celular" icon="call" type="tel" placeholder="315 792 4906" value={phone} onChange={(e) => setPhone(e.target.value)} />
              <Button full type="submit" icon="search">Ver mis pedidos</Button>
            </form>
            <div style={{ fontSize: 11.5, color: 'var(--on-surface-variant)', marginTop: 12, lineHeight: 1.5, textAlign: 'center' }}>
              Sin cuenta ni contraseña: usamos tu celular solo para encontrar tus pedidos.
            </div>
          </Card>
        )}

        {loading && client?.phone && <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner /></div>}

        {!loading && client?.phone && rows.length === 0 && (
          <EmptyState
            icon="receipt_long"
            title="Aún no tienes pedidos"
            body="Cuando pidas un servicio, aquí verás su estado y su código de seguimiento."
            action={<Button icon="add" color="var(--primary)" onClick={() => router.push('/pedir')}>Pedir un servicio</Button>}
          />
        )}

        {rows.map((r) => {
          const info = serviceInfo(r.service_type);
          const [bg, fg] = STATUS_TONE[r.status] || STATUS_TONE.requested;
          const label = r.status === 'cancelled' ? 'Cancelado' : STATUS_STEPS.find((s) => s.id === r.status)?.label || r.status;
          return (
            <Card key={r.id} style={{ padding: 0, marginBottom: 11, overflow: 'hidden' }}>
              <button onClick={() => router.push(`/seguimiento/${r.tracking_code}`)} style={{ width: '100%', padding: 15, textAlign: 'left', background: 'transparent' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ width: 44, height: 44, borderRadius: 'var(--sh-sm)', background: 'var(--primary-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
                    <Icon name={info.icon} size={21} color="var(--on-primary-container)" />
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontWeight: 700, fontSize: 14.5 }}>{info.label}</span>
                    <span style={{ display: 'block', fontSize: 11.5, color: 'var(--on-surface-variant)', marginTop: 1 }}>
                      #{r.tracking_code} · {new Date(r.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
                    </span>
                  </span>
                  <span className="dsp" style={{ fontWeight: 800, fontSize: 17 }}>{money(r.price)}</span>
                </div>

                <div style={{ display: 'flex', gap: 9, alignItems: 'center', fontSize: 12.5, fontWeight: 600, color: 'var(--on-surface-variant)', marginTop: 12 }}>
                  <Icon name="location_on" size={16} />
                  <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.dropoff_address}</span>
                </div>

                <div style={{ marginTop: 12, display: 'flex', alignItems: 'center' }}>
                  <Chip bg={bg} color={fg}>{label}</Chip>
                  <span style={{ flex: 1 }} />
                  <Icon name="chevron_right" size={20} color="var(--outline)" />
                </div>
              </button>
            </Card>
          );
        })}
      </div>

      <BottomNav badges={{ '/pedidos': rows.filter((r) => !['delivered', 'cancelled'].includes(r.status)).length }} />
    </>
  );
}
