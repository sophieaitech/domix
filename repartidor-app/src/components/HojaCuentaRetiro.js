'use client';

import { useState } from 'react';
import Hoja from './Hoja';
import { Icon, Button, Field } from './ui';
import { guardarCuentaRetiro, METODOS_RETIRO } from '../lib/cuenta';

/* A dónde se le consigna. Sin esto no se puede pedir retiro. */
export default function HojaCuentaRetiro({ abierta, perfil, courierId, onClose, onGuardado }) {
  const [metodo, setMetodo] = useState(perfil?.payout_method || 'nequi');
  const [cuenta, setCuenta] = useState(perfil?.payout_account || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const elegido = METODOS_RETIRO.find((m) => m.id === metodo);

  const guardar = async () => {
    if (!cuenta.trim()) return setError('Escribe a dónde te consignamos.');
    setBusy(true);
    setError('');
    const res = await guardarCuentaRetiro(courierId, metodo, cuenta.trim());
    setBusy(false);
    if (!res.ok) return setError(res.mensaje);
    onGuardado(res.perfil);
    onClose();
  };

  return (
    <Hoja
      abierta={abierta}
      titulo="Cuenta para retiros"
      sub="Aquí te llega la plata de tus entregas."
      onClose={onClose}
      pie={
        <Button full icon={busy ? undefined : 'check'} disabled={busy} onClick={guardar} style={{ opacity: busy ? .5 : 1 }}>
          {busy ? 'Guardando…' : 'Guardar cuenta'}
        </Button>
      }
    >
      <div style={{ display: 'grid', gap: 8, marginBottom: 16 }}>
        {METODOS_RETIRO.map((m) => {
          const on = metodo === m.id;
          return (
            <button
              key={m.id}
              onClick={() => setMetodo(m.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px', textAlign: 'left',
                borderRadius: 'var(--sh-md)',
                background: on ? 'var(--primary-container)' : 'var(--surface-container)',
                border: `1.5px solid ${on ? 'var(--primary)' : 'transparent'}`,
              }}
            >
              <Icon name={m.icon} size={21} fill={on} color={on ? 'var(--on-primary-container)' : 'var(--on-surface-variant)'} />
              <span style={{ flex: 1, fontSize: 13.5, fontWeight: 800, color: on ? 'var(--on-primary-container)' : 'var(--on-surface)' }}>
                {m.label}
              </span>
              {on && <Icon name="check_circle" size={19} fill color="var(--primary)" />}
            </button>
          );
        })}
      </div>

      <Field
        label={elegido?.pista || 'Cuenta'}
        icon="account_balance_wallet"
        value={cuenta}
        onChange={(e) => setCuenta(e.target.value)}
        placeholder={metodo === 'efectivo' ? 'Nombre de quien recibe' : '315 792 4906'}
        type={metodo === 'efectivo' ? 'text' : 'tel'}
      />

      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginTop: 14, padding: 13, borderRadius: 'var(--sh-sm)', background: 'var(--surface-container)' }}>
        <Icon name="lock" size={18} color="var(--on-surface-variant)" />
        <span style={{ flex: 1, fontSize: 12, color: 'var(--on-surface-variant)', lineHeight: 1.5 }}>
          Revisa bien el número. La plata se consigna a lo que quede escrito aquí.
        </span>
      </div>

      {error && (
        <div style={{ display: 'flex', gap: 9, alignItems: 'flex-start', marginTop: 12, padding: 12, borderRadius: 'var(--sh-sm)', background: 'var(--error-container)' }}>
          <Icon name="error" size={18} fill color="var(--on-error-container)" />
          <span style={{ flex: 1, fontSize: 12.5, fontWeight: 600, color: 'var(--on-error-container)', lineHeight: 1.45 }}>{error}</span>
        </div>
      )}
    </Hoja>
  );
}
