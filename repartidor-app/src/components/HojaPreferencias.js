'use client';

import { useState } from 'react';
import Hoja from './Hoja';
import { Icon, Button } from './ui';
import { guardarPreferencias, ZONAS, HORARIOS } from '../lib/cuenta';

/* Dónde y cuándo trabaja. La zona no es decorativa: es la que decide a
   qué repartidor se le ofrece cada pedido. Poder cambiarla desde el
   teléfono le ahorra llamar a la oficina cuando se mueve de sector. */
export default function HojaPreferencias({ abierta, perfil, courierId, onClose, onGuardado }) {
  const [zona, setZona] = useState(perfil?.work_zone || 'Centro');
  const [horario, setHorario] = useState(perfil?.preferred_schedule || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const guardar = async () => {
    setBusy(true);
    setError('');
    const res = await guardarPreferencias(courierId, zona, horario);
    setBusy(false);
    if (!res.ok) return setError(res.mensaje);
    onGuardado(res.perfil);
    onClose();
  };

  return (
    <Hoja
      abierta={abierta}
      titulo="Dónde y cuándo trabajas"
      sub="Te llegan primero los pedidos de tu zona."
      onClose={onClose}
      pie={
        <Button full icon={busy ? undefined : 'check'} disabled={busy} onClick={guardar} style={{ opacity: busy ? .5 : 1 }}>
          {busy ? 'Guardando…' : 'Guardar'}
        </Button>
      }
    >
      <div style={{ font: '800 11.5px Manrope,sans-serif', letterSpacing: '.06em', color: 'var(--on-surface-variant)', marginBottom: 9 }}>
        ZONA DE TRABAJO
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
        {ZONAS.map((z) => {
          const on = zona === z;
          return (
            <button
              key={z}
              onClick={() => setZona(z)}
              style={{
                padding: '10px 14px', borderRadius: 99, fontSize: 12.5, fontWeight: 800,
                background: on ? 'var(--primary)' : 'var(--surface-container)',
                color: on ? 'var(--on-primary)' : 'var(--on-surface-variant)',
              }}
            >
              {z}
            </button>
          );
        })}
      </div>

      <div style={{ font: '800 11.5px Manrope,sans-serif', letterSpacing: '.06em', color: 'var(--on-surface-variant)', marginBottom: 9 }}>
        HORARIO PREFERIDO
      </div>
      <div style={{ display: 'grid', gap: 8 }}>
        {HORARIOS.map((h) => {
          const on = horario === h.id;
          return (
            <button
              key={h.id}
              onClick={() => setHorario(on ? '' : h.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px', textAlign: 'left',
                borderRadius: 'var(--sh-md)',
                background: on ? 'var(--primary-container)' : 'var(--surface-container)',
                border: `1.5px solid ${on ? 'var(--primary)' : 'transparent'}`,
              }}
            >
              <Icon name={h.icon} size={20} fill={on} color={on ? 'var(--on-primary-container)' : 'var(--on-surface-variant)'} />
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 13.5, fontWeight: 800, color: on ? 'var(--on-primary-container)' : 'var(--on-surface)' }}>{h.id}</span>
                <span style={{ display: 'block', fontSize: 11.5, color: 'var(--on-surface-variant)', marginTop: 1 }}>{h.pista}</span>
              </span>
              {on && <Icon name="check_circle" size={19} fill color="var(--primary)" />}
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginTop: 16, padding: 12, borderRadius: 'var(--sh-sm)', background: 'var(--surface-container)' }}>
        <Icon name="info" size={18} color="var(--on-surface-variant)" />
        <span style={{ flex: 1, fontSize: 12, color: 'var(--on-surface-variant)', lineHeight: 1.5 }}>
          El horario es una preferencia, no un turno fijo. Si estás en línea fuera de él, igual te llegan pedidos.
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
