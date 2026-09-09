'use client';

import { useRouter } from 'next/navigation';
import { Icon } from './ui';
import { useIdioma } from '../context/IdiomaProvider';
import { STATUS_STEPS } from '../lib/services';

/* La barra del pedido en curso.

   Va arriba de todo y ocupa lo que haga falta. Es la decisión que toman
   Uber, DiDi y Yango: cuando hay algo en marcha, esa es la pantalla, y
   lo demás pasa a segundo plano. Antes esta tarjeta estaba enterrada
   debajo del buscador y de tres píldoras de publicidad, que es donde
   nadie la busca cuando está esperando un envío.

   El punto que late no es adorno: dice que la información es de ahora,
   no de cuando se abrió la app. */

const ORDEN = ['requested', 'assigned', 'picked_up', 'in_progress', 'delivered'];

const CLAVE_ESTADO = {
  requested: 'buscando',
  assigned: 'asignado',
  picked_up: 'recogido',
  in_progress: 'enCamino',
  delivered: 'entregado',
  cancelled: 'cancelado',
};

export default function PedidoEnVivo({ pedido }) {
  const router = useRouter();
  const { t } = useIdioma();
  if (!pedido) return null;

  const paso = Math.max(0, ORDEN.indexOf(pedido.status));
  const clave = CLAVE_ESTADO[pedido.status] || 'buscando';
  const icono = STATUS_STEPS.find((s) => s.id === pedido.status)?.icon || 'moped';
  const eta = pedido.eta_minutes;

  return (
    <div style={{ padding: '0 16px 18px' }}>
      <button
        className="dx-toque"
        onClick={() => router.push(`/seguimiento/${pedido.tracking_code}`)}
        style={{
          width: '100%', padding: '15px 16px 14px', borderRadius: 20, textAlign: 'left',
          background: 'var(--inv)', color: 'var(--invtx)', boxShadow: 'var(--sh)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
          <span style={{ position: 'relative', width: 44, height: 44, borderRadius: 14, background: 'rgba(255,255,255,.13)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
            <Icon name={icono} size={23} fill />
          </span>

          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span className="dx-vivo" style={{ width: 7, height: 7, borderRadius: '50%', background: '#5FBF45', flex: 'none' }} />
              <span style={{ font: '700 10px Manrope,sans-serif', letterSpacing: '.14em', opacity: 0.6 }}>
                {t('inicio.pedidoEnCurso')}
              </span>
            </span>
            <span style={{ display: 'block', font: '800 16.5px Manrope,sans-serif', letterSpacing: '-.02em', marginTop: 4 }}>
              {t(`seguimiento.${clave}`)}
            </span>
            <span style={{ display: 'block', font: '500 12px Manrope,sans-serif', opacity: 0.55, marginTop: 2 }}>
              {t(`seguimiento.${clave}Desc`)}
            </span>
          </span>

          {eta > 0 && (
            <span style={{ flex: 'none', textAlign: 'right', paddingLeft: 6 }}>
              <span className="num" style={{ display: 'block', font: '800 20px "IBM Plex Mono",monospace', letterSpacing: '-.03em' }}>{eta}</span>
              <span style={{ display: 'block', font: '700 10px Manrope,sans-serif', opacity: 0.55 }}>{t('comun.minutos')}</span>
            </span>
          )}

          <Icon name="chevron_right" size={21} style={{ opacity: 0.5, flex: 'none' }} />
        </div>

        {/* Cuánto falta, de un vistazo */}
        <div style={{ display: 'flex', gap: 4, marginTop: 14 }}>
          {ORDEN.map((id, i) => (
            <span
              key={id}
              style={{
                flex: 1, height: 3, borderRadius: 99,
                background: i <= paso ? '#5FBF45' : 'rgba(255,255,255,.16)',
                transition: 'background .4s var(--ease)',
              }}
            />
          ))}
        </div>

        <div style={{ font: '500 11px "IBM Plex Mono",monospace', opacity: 0.4, marginTop: 9 }}>
          #{pedido.tracking_code}
        </div>
      </button>
    </div>
  );
}
