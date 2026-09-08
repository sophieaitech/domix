'use client';

import { useState } from 'react';
import { useAppMode } from '../context/AppModeProvider';
import { Icon } from './ui';

/* Interruptor DEMO / EN VIVO.
   DEMO = operación simulada con métricas e historial.
   EN VIVO = solo datos reales; arranca en ceros. */
export default function ModeSwitch({ compact = false }) {
  const { isDemo, changeMode } = useAppMode();
  const [confirm, setConfirm] = useState(false);

  const go = (next) => {
    if (next === 'live' && isDemo) return setConfirm(true);
    changeMode(next);
  };

  return (
    <>
      <div
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 3, padding: 3,
          borderRadius: 'var(--sh-full)', background: 'var(--surface-container)',
          border: '1px solid var(--outline-variant)',
        }}
      >
        <button
          onClick={() => go('demo')}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, height: compact ? 30 : 34, padding: compact ? '0 11px' : '0 14px',
            borderRadius: 'var(--sh-full)', fontSize: compact ? 11.5 : 12.5, fontWeight: 800,
            background: isDemo ? 'linear-gradient(135deg,#57A82F,#43922B)' : 'transparent',
            color: isDemo ? '#fff' : 'var(--on-surface-variant)',
            boxShadow: isDemo ? '0 2px 10px rgba(67,146,43,.34)' : 'none',
          }}
        >
          <Icon name="science" size={compact ? 15 : 16} fill={isDemo} />
          Demo
        </button>
        <button
          onClick={() => go('live')}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, height: compact ? 30 : 34, padding: compact ? '0 11px' : '0 14px',
            borderRadius: 'var(--sh-full)', fontSize: compact ? 11.5 : 12.5, fontWeight: 800,
            background: !isDemo ? 'linear-gradient(135deg,#57A82F,#43922B)' : 'transparent',
            color: !isDemo ? '#fff' : 'var(--on-surface-variant)',
            boxShadow: !isDemo ? '0 2px 10px rgba(67,146,43,.3)' : 'none',
          }}
        >
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: !isDemo ? '#fff' : 'var(--outline)', animation: !isDemo ? 'dxGlow 1.4s infinite' : 'none' }} />
          En vivo
        </button>
      </div>

      {confirm && (
        <div
          onClick={() => setConfirm(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'var(--scrim)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, animation: 'dxFadeIn .15s ease' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: '100%', maxWidth: 380, borderRadius: 'var(--sh-xl)', background: 'var(--surface-lowest)', padding: 24, boxShadow: 'var(--elev-4)', animation: 'dxPop .2s var(--ease-out)' }}
          >
            <span style={{ width: 48, height: 48, borderRadius: 'var(--sh-md)', background: 'var(--secondary-container)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="rocket_launch" size={24} fill color="var(--on-secondary-container)" />
            </span>
            <div className="dsp" style={{ fontWeight: 800, fontSize: 20, marginTop: 14 }}>Pasar a operación en vivo</div>
            <div style={{ fontSize: 13.5, color: 'var(--on-surface-variant)', lineHeight: 1.55, marginTop: 8 }}>
              Se ocultan los datos de prueba y el panel queda en ceros: solo verás pedidos y repartidores reales.
              Puedes volver a Demo cuando quieras, nada se borra.
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button
                onClick={() => setConfirm(false)}
                style={{ flex: 1, height: 46, borderRadius: 'var(--sh-full)', border: '1px solid var(--outline)', fontSize: 13.5, fontWeight: 700, color: 'var(--on-surface)' }}
              >
                Seguir en Demo
              </button>
              <button
                onClick={() => { changeMode('live'); setConfirm(false); }}
                style={{ flex: 1, height: 46, borderRadius: 'var(--sh-full)', background: 'linear-gradient(135deg,#57A82F,#43922B)', color: '#fff', fontSize: 13.5, fontWeight: 800 }}
              >
                Activar en vivo
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
