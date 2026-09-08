'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import BottomNav from '../../components/BottomNav';
import ModeSwitch from '../../components/ModeSwitch';
import { Row, Pill, Button, Field, Spinner, EmptyState } from '../../components/ui';
import { useClientSession } from '../../context/ClientSessionProvider';
import { useAppMode } from '../../context/AppModeProvider';
import { fetchMyRequests, listDemoRequests, serviceInfo, STATUS_STEPS } from '../../lib/services';
import { money } from '../../lib/pricing';

const TONE = {
  requested: 'default',
  assigned: 'navy',
  picked_up: 'navy',
  in_progress: 'navy',
  delivered: 'green',
  cancelled: 'red',
};

export default function ActividadPage() {
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

  const abiertos = rows.filter((r) => !['delivered', 'cancelled'].includes(r.status));

  return (
    <>
      <div className="sb" style={{ position: 'absolute', inset: 0, overflowY: 'auto', padding: '10px 0 100px', animation: 'trFade .3s ease' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px 18px' }}>
          <div style={{ font: '800 26px Manrope,sans-serif', letterSpacing: '-.035em' }}>Actividad</div>
          <ModeSwitch compact />
        </div>

        {ready && !client?.phone && !isDemo && (
          <div style={{ padding: '0 16px' }}>
            <div style={{ borderRadius: 16, background: 'var(--sf)', padding: 18 }}>
              <div style={{ font: '700 15px Manrope,sans-serif', marginBottom: 4 }}>Consulta tus pedidos</div>
              <div style={{ font: '500 12.5px/1.5 Manrope,sans-serif', color: 'var(--mu)', marginBottom: 14 }}>
                Sin cuenta ni contraseña: usamos tu celular solo para encontrarlos.
              </div>
              <form onSubmit={buscar} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <Field required icon="call" type="tel" placeholder="315 792 4906" value={phone} onChange={(e) => setPhone(e.target.value)} />
                <Button type="submit" icon="search">Ver mis pedidos</Button>
              </form>
            </div>
          </div>
        )}

        {loading && client?.phone && <div style={{ display: 'flex', justifyContent: 'center', padding: 50 }}><Spinner /></div>}

        {!loading && client?.phone && rows.length === 0 && (
          <EmptyState
            icon="receipt_long"
            title="Aún no tienes pedidos"
            body="Cuando pidas un servicio, aquí verás su estado y su código de seguimiento."
            action={<Button full={false} icon="add" onClick={() => router.push('/pedir')}>Pedir un servicio</Button>}
          />
        )}

        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 9 }}>
          {rows.map((r) => {
            const info = serviceInfo(r.service_type);
            const label = r.status === 'cancelled' ? 'Cancelado' : STATUS_STEPS.find((s) => s.id === r.status)?.label || r.status;
            return (
              <Row
                key={r.id || r.tracking_code}
                image={info.img}
                title={info.label}
                subtitle={r.dropoff_address}
                onClick={() => router.push(`/seguimiento/${r.tracking_code}`)}
                right={
                  <span style={{ flex: 'none', textAlign: 'right' }}>
                    <span style={{ display: 'block', font: '800 15px Manrope,sans-serif', letterSpacing: '-.02em' }}>{money(r.price)}</span>
                    <span style={{ display: 'block', marginTop: 5 }}><Pill tone={TONE[r.status]}>{label}</Pill></span>
                  </span>
                }
              />
            );
          })}
        </div>
      </div>

      <BottomNav badges={{ '/pedidos': abiertos.length }} />
    </>
  );
}
