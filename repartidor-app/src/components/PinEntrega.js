'use client';

import { useRef, useState } from 'react';
import { Icon, Button } from './ui';
import { confirmDelivery } from '../lib/serviceRequests';
import { useIdioma } from '../context/IdiomaProvider';

const TECLAS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'borrar'];

/* Hoja de confirmación: el cliente dicta 4 dígitos y aquí se verifican.
   El PIN nunca viaja hacia esta app; solo se manda a comprobar. */
export default function PinEntrega({ request, onClose, onConfirmado }) {
  const { t } = useIdioma();
  const [pin, setPin] = useState('');
  const pinRef = useRef('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [listo, setListo] = useState(false);

  /* La verificación se dispara al completar el cuarto dígito, no desde un
     efecto: un efecto que dependa de `busy` se cancela a sí mismo al
     ponerse en marcha y nunca llega a mostrar el resultado. */
  const verificar = async (codigo) => {
    setBusy(true);
    const res = await confirmDelivery(request.id, codigo);
    setBusy(false);
    if (res.ok) {
      setListo(true);
      setTimeout(() => onConfirmado(res), 1100);
    } else {
      setError(res.mensaje);
      pinRef.current = '';
      setPin('');
    }
  };

  /* El valor vive también en una referencia: si el repartidor teclea rápido,
     varios toques seguidos leerían el mismo estado viejo y se perderían
     dígitos. La referencia siempre tiene lo último. */
  const teclear = (t) => {
    if (busy || listo) return;
    setError('');

    if (t === 'borrar') {
      pinRef.current = pinRef.current.slice(0, -1);
      setPin(pinRef.current);
      return;
    }
    if (pinRef.current.length >= 4) return;

    pinRef.current += t;
    setPin(pinRef.current);
    if (pinRef.current.length === 4) verificar(pinRef.current);
  };

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 200, background: 'var(--surface)', display: 'flex', flexDirection: 'column', animation: 'dxSlideUp .26s var(--ease-out)' }}>
      <div style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px' }}>
        <button aria-label="Cerrar" onClick={onClose} style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--surface-container)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="close" size={20} />
        </button>
        <div style={{ flex: 1, font: '800 18px Manrope,sans-serif', letterSpacing: '-.03em' }}>{t('entregas.confirmarEntrega')}</div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 24px', textAlign: 'center' }}>
        {listo ? (
          <div style={{ animation: 'dxPop .3s var(--ease-out)' }}>
            <div style={{ width: 84, height: 84, borderRadius: '50%', background: 'var(--secondary-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
              <Icon name="check_circle" size={46} fill color="var(--secondary)" />
            </div>
            <div style={{ font: '800 22px Manrope,sans-serif', letterSpacing: '-.03em' }}>¡Entrega confirmada!</div>
            <div style={{ font: '500 13.5px Manrope,sans-serif', color: 'var(--on-surface-variant)', marginTop: 6 }}>
              Ya se sumó a tus ganancias del día.
            </div>
          </div>
        ) : (
          <>
            <div style={{ font: '800 20px Manrope,sans-serif', letterSpacing: '-.03em' }}>
              Pídele el código al cliente
            </div>
            <div style={{ font: '500 13.5px/1.5 Manrope,sans-serif', color: 'var(--on-surface-variant)', marginTop: 7 }}>
              {t('entregas.pinAyuda', { nombre: request.contact_name || t('entregas.elCliente') })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, margin: '28px 0 10px' }}>
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  style={{
                    width: 54, height: 64, borderRadius: 14,
                    background: pin[i] ? 'var(--inverse-surface)' : 'var(--surface-container)',
                    color: pin[i] ? 'var(--on-inverse-surface)' : 'var(--on-surface)',
                    border: error ? '1.5px solid var(--error)' : '1.5px solid transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    font: "800 28px 'IBM Plex Mono',monospace",
                    transition: 'background .15s ease',
                  }}
                >
                  {pin[i] || ''}
                </span>
              ))}
            </div>

            <div style={{ height: 22, font: '600 12.5px Manrope,sans-serif', color: error ? 'var(--error)' : 'var(--on-surface-variant)' }}>
              {busy ? t('entregas.verificando') : error}
            </div>
          </>
        )}
      </div>

      {!listo && (
        <div style={{ flex: 'none', padding: '0 20px 26px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
            {TECLAS.map((t, i) => (
              t === '' ? <span key={i} /> : (
                <button
                  key={i}
                  onClick={() => teclear(t)}
                  disabled={busy}
                  style={{
                    height: 58, borderRadius: 14, background: 'var(--surface-container)',
                    font: t === 'borrar' ? '600 13px Manrope,sans-serif' : "700 22px 'IBM Plex Mono',monospace",
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  {t === 'borrar' ? <Icon name="backspace" size={21} /> : t}
                </button>
              )
            ))}
          </div>

          <Button variant="tonal" onClick={onClose} style={{ width: '100%', marginTop: 14 }}>
            El cliente no tiene el código
          </Button>
        </div>
      )}
    </div>
  );
}
