'use client';

import { useState } from 'react';
import Hoja from './Hoja';
import { Icon, Button } from './ui';
import { solicitarRetiro, dinero, METODOS_RETIRO } from '../lib/cuenta';

const MINIMO = 10000;

/* Pedir la plata. El monto se comprueba otra vez en la base de datos:
   lo que se escriba aquí es una propuesta, no la última palabra. */
export default function HojaRetiro({ abierta, disponible, perfil, courierId, onClose, onListo }) {
  const [monto, setMonto] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [listo, setListo] = useState(false);

  const valor = Number(String(monto).replace(/\D/g, '')) || 0;
  const metodo = METODOS_RETIRO.find((m) => m.id === perfil?.payout_method);
  const sinCuenta = !perfil?.payout_account;

  const atajos = [
    { label: '20.000', v: 20000 },
    { label: '50.000', v: 50000 },
    { label: 'Todo', v: Math.floor(disponible) },
  ].filter((a) => a.v >= MINIMO && a.v <= disponible);

  const pedir = async () => {
    setBusy(true);
    setError('');
    const res = await solicitarRetiro(courierId, valor, perfil?.payout_method, perfil?.payout_account);
    setBusy(false);
    if (!res.ok) return setError(res.mensaje);
    setListo(true);
    setTimeout(() => { cerrar(); onListo(); }, 1400);
  };

  const cerrar = () => {
    setMonto('');
    setError('');
    setListo(false);
    onClose();
  };

  if (listo) {
    return (
      <Hoja abierta={abierta} titulo="Retiro solicitado" sub=" " onClose={cerrar}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '24px 0 34px', textAlign: 'center' }}>
          <span style={{ width: 74, height: 74, borderRadius: '50%', background: 'var(--secondary-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'dxPop .4s var(--ease-out) both' }}>
            <Icon name="check_circle" size={40} fill color="var(--on-secondary-container)" />
          </span>
          <span className="num" style={{ font: '800 32px "IBM Plex Mono",monospace', letterSpacing: '-.02em' }}>{dinero(valor)}</span>
          <span style={{ fontSize: 13.5, color: 'var(--on-surface-variant)', lineHeight: 1.5, maxWidth: 260 }}>
            Va en camino a tu {metodo?.label || 'cuenta'}. Te avisamos apenas quede consignado.
          </span>
        </div>
      </Hoja>
    );
  }

  return (
    <Hoja
      abierta={abierta}
      titulo="Solicitar retiro"
      sub={sinCuenta ? 'Primero dinos a dónde te consignamos.' : `Se consigna a tu ${metodo?.label || 'cuenta'} ${perfil?.payout_account}`}
      onClose={cerrar}
      pie={
        <Button
          full
          icon={busy ? undefined : 'send_money'}
          disabled={busy || sinCuenta || valor < MINIMO || valor > disponible}
          onClick={pedir}
          color="var(--secondary)"
          style={{ opacity: busy || sinCuenta || valor < MINIMO || valor > disponible ? .5 : 1 }}
        >
          {busy ? 'Enviando…' : valor > 0 ? `Retirar ${dinero(valor)}` : 'Escribe el monto'}
        </Button>
      }
    >
      {sinCuenta ? (
        <div style={{ display: 'flex', gap: 11, alignItems: 'flex-start', padding: 14, borderRadius: 'var(--sh-sm)', background: 'var(--tertiary-container)' }}>
          <Icon name="account_balance" size={20} fill color="var(--on-tertiary-container)" />
          <span style={{ flex: 1, fontSize: 12.5, fontWeight: 600, color: 'var(--on-tertiary-container)', lineHeight: 1.5 }}>
            Ve a <b>Cuenta → Cuenta para retiros</b> y registra tu Nequi, Daviplata o número de cuenta. Sin eso no podemos consignarte.
          </span>
        </div>
      ) : (
        <>
          <div style={{ textAlign: 'center', padding: '10px 0 4px' }}>
            <div style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: '.08em', color: 'var(--on-surface-variant)' }}>DISPONIBLE</div>
            <div className="num" style={{ font: '800 15px "IBM Plex Mono",monospace', color: 'var(--secondary)', marginTop: 3 }}>{dinero(disponible)}</div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '14px 0 18px' }}>
            <span className="num" style={{ font: '800 34px "IBM Plex Mono",monospace', color: valor > 0 ? 'var(--on-surface)' : 'var(--outline)' }}>$</span>
            <input
              type="tel"
              inputMode="numeric"
              value={valor ? valor.toLocaleString('es-CO') : ''}
              onChange={(e) => { setError(''); setMonto(e.target.value); }}
              placeholder="0"
              className="num"
              style={{
                width: 190, font: '800 40px "IBM Plex Mono",monospace', letterSpacing: '-.02em',
                textAlign: 'left', background: 'transparent', border: 'none', outline: 'none',
                color: valor > disponible ? 'var(--error)' : 'var(--on-surface)',
              }}
            />
          </div>

          {atajos.length > 0 && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {atajos.map((a) => (
                <button
                  key={a.label}
                  onClick={() => { setError(''); setMonto(String(a.v)); }}
                  style={{ flex: 1, padding: '11px 6px', borderRadius: 99, background: 'var(--surface-container)', fontSize: 12.5, fontWeight: 800, color: 'var(--on-surface-variant)' }}
                >
                  {a.label}
                </button>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: 12, borderRadius: 'var(--sh-sm)', background: 'var(--surface-container)' }}>
            <Icon name="schedule" size={18} color="var(--on-surface-variant)" />
            <span style={{ flex: 1, fontSize: 12, color: 'var(--on-surface-variant)', lineHeight: 1.5 }}>
              Retiro mínimo {dinero(MINIMO)}. Se consigna en el siguiente corte de pagos y solo puedes tener un retiro en curso.
            </span>
          </div>
        </>
      )}

      {error && (
        <div style={{ display: 'flex', gap: 9, alignItems: 'flex-start', marginTop: 12, padding: 12, borderRadius: 'var(--sh-sm)', background: 'var(--error-container)' }}>
          <Icon name="error" size={18} fill color="var(--on-error-container)" />
          <span style={{ flex: 1, fontSize: 12.5, fontWeight: 600, color: 'var(--on-error-container)', lineHeight: 1.45 }}>{error}</span>
        </div>
      )}
    </Hoja>
  );
}
