'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../../lib/supabaseClient';

const STATUS_LABELS = {
  requested: 'Buscando repartidor…',
  assigned: 'Un repartidor va en camino a recoger',
  picked_up: 'Recogido',
  in_progress: 'En camino a la entrega',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
};

const SERVICE_LABELS = {
  mensajeria: 'Mensajería',
  encomienda: 'Encomienda',
  domicilio: 'Domicilio',
  mandado: 'Mandado',
  autorizacion_medica: 'Autorización médica',
};

function money(n) {
  return `$${Math.round(n || 0).toLocaleString('es-CO')}`;
}

export default function SeguimientoPage() {
  const { code } = useParams();
  const [request, setRequest] = useState(undefined);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const load = async () => {
      const { data, error } = await supabase.rpc('track_service_request', { p_tracking_code: code });
      if (!active) return;
      if (error) return setError(error.message);
      setRequest(data?.[0] || null);
    };
    load();
    const interval = setInterval(load, 8000);
    return () => { active = false; clearInterval(interval); };
  }, [code]);

  return (
    <div style={{ minHeight: '100dvh', padding: '28px 20px', maxWidth: 480, margin: '0 auto' }}>
      <div style={{ font: '800 24px Manrope,sans-serif', color: 'var(--navy)' }}>Domix</div>
      <div style={{ font: '600 13px Manrope,sans-serif', color: 'var(--mu)', marginTop: 4, marginBottom: 24 }}>
        Código de seguimiento: <b style={{ color: 'var(--tx)' }}>{code}</b>
      </div>

      {error && <div style={{ font: '600 12.5px Manrope,sans-serif', color: 'var(--red)' }}>{error}</div>}

      {request === undefined && !error && (
        <div style={{ font: '600 13px Manrope,sans-serif', color: 'var(--mu)' }}>Cargando…</div>
      )}

      {request === null && (
        <div style={{ font: '600 13px Manrope,sans-serif', color: 'var(--mu)' }}>No encontramos ningún pedido con ese código.</div>
      )}

      {request && (
        <div style={{ padding: 20, borderRadius: 18, background: 'var(--sf)', border: '1px solid var(--bd)' }}>
          <span style={{ font: '700 11.5px Manrope,sans-serif', color: 'var(--navy)', background: 'var(--navyS)', padding: '4px 10px', borderRadius: 999 }}>
            {SERVICE_LABELS[request.service_type]}
          </span>
          <div style={{ font: '800 17px Manrope,sans-serif', marginTop: 14 }}>{STATUS_LABELS[request.status]}</div>
          <div style={{ marginTop: 12, font: '600 13px Manrope,sans-serif' }}>{request.pickup_address}</div>
          <div style={{ font: '500 12px Manrope,sans-serif', color: 'var(--mu)' }}>→ {request.dropoff_address}</div>
          <div style={{ marginTop: 14, display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ font: '600 12px Manrope,sans-serif', color: 'var(--mu)' }}>Tarifa</span>
            <span style={{ font: '800 15px Manrope,sans-serif' }}>{money(request.price)}</span>
          </div>
        </div>
      )}

      <Link href="/" style={{ display: 'block', marginTop: 24, textAlign: 'center', font: '700 13px Manrope,sans-serif', color: 'var(--navy)' }}>
        Pedir otro servicio
      </Link>
    </div>
  );
}
