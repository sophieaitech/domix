'use client';

import { useState } from 'react';
import Hoja from './Hoja';
import { Icon, Button, Field } from './ui';
import { guardarVehiculo, VEHICULOS } from '../lib/cuenta';

/* Con qué trabaja el repartidor. La placa es lo que ve el cliente
   cuando le llega el pedido, así que para moto y carro es obligatoria. */
export default function HojaVehiculo({ abierta, actual, courierId, onClose, onGuardado }) {
  const [tipo, setTipo] = useState(actual?.vehicle_type || 'moto');
  const [placa, setPlaca] = useState(actual?.plate || '');
  const [modelo, setModelo] = useState(actual?.model || '');
  const [color, setColor] = useState(actual?.color || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const pidePlaca = VEHICULOS.find((v) => v.id === tipo)?.placa;

  const guardar = async () => {
    setBusy(true);
    setError('');
    const res = await guardarVehiculo(courierId, { tipo, placa, modelo, color });
    setBusy(false);
    if (!res.ok) return setError(res.mensaje);
    onGuardado(res.vehiculo);
    onClose();
  };

  return (
    <Hoja
      abierta={abierta}
      titulo="Mi vehículo"
      sub="Con esto el cliente te reconoce cuando llegas."
      onClose={onClose}
      pie={
        <Button full icon={busy ? undefined : 'check'} disabled={busy} onClick={guardar} style={{ opacity: busy ? .5 : 1 }}>
          {busy ? 'Guardando…' : 'Guardar vehículo'}
        </Button>
      }
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9, marginBottom: 16 }}>
        {VEHICULOS.map((v) => {
          const on = tipo === v.id;
          return (
            <button
              key={v.id}
              onClick={() => setTipo(v.id)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '16px 8px',
                borderRadius: 'var(--sh-md)', fontSize: 13, fontWeight: 800,
                background: on ? 'var(--primary)' : 'var(--surface-container)',
                color: on ? 'var(--on-primary)' : 'var(--on-surface-variant)',
                border: `1.5px solid ${on ? 'var(--primary)' : 'transparent'}`,
                transition: 'background .18s var(--ease-out)',
              }}
            >
              <Icon name={v.icon} size={24} fill={on} />
              {v.label}
            </button>
          );
        })}
      </div>

      {pidePlaca && (
        <div style={{ display: 'grid', gap: 12 }}>
          <Field label="Placa" icon="pin" value={placa} onChange={(e) => setPlaca(e.target.value.toUpperCase())} placeholder="ABC12D" required />
          <Field label="Marca y modelo" icon="two_wheeler" value={modelo} onChange={(e) => setModelo(e.target.value)} placeholder="Bajaj Boxer 150" />
          <Field label="Color" icon="palette" value={color} onChange={(e) => setColor(e.target.value)} placeholder="Rojo" />
        </div>
      )}

      {!pidePlaca && (
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: 13, borderRadius: 'var(--sh-sm)', background: 'var(--surface-container)' }}>
          <Icon name="info" size={19} color="var(--on-surface-variant)" />
          <span style={{ flex: 1, fontSize: 12.5, color: 'var(--on-surface-variant)', lineHeight: 1.5 }}>
            {tipo === 'a_pie'
              ? 'A pie te llegan pedidos del centro y de distancias cortas.'
              : 'En bicicleta te llegan pedidos cercanos y sin carga pesada.'}
          </span>
        </div>
      )}

      {error && (
        <div style={{ display: 'flex', gap: 9, alignItems: 'flex-start', marginTop: 14, padding: 12, borderRadius: 'var(--sh-sm)', background: 'var(--error-container)' }}>
          <Icon name="error" size={18} fill color="var(--on-error-container)" />
          <span style={{ flex: 1, fontSize: 12.5, fontWeight: 600, color: 'var(--on-error-container)', lineHeight: 1.45 }}>{error}</span>
        </div>
      )}
    </Hoja>
  );
}
