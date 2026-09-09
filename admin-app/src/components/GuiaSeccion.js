'use client';

import { useEffect, useState } from 'react';
import { Icon } from './ui';

/* Guía de sección: la primera vez que alguien entra a una pantalla del
   panel, le explica para qué sirve y qué se puede hacer ahí. Se cierra y
   no vuelve, pero queda a mano en el botón de ayuda de la cabecera.

   No es un tutorial aparte: es la misma pantalla con una capa que enseña
   lo que importa. */
export default function GuiaSeccion({ id, titulo, frase, puntos, tono = 'green' }) {
  const KEY = `domix_guia_${id}`;
  const [abierta, setAbierta] = useState(false);
  const [montado, setMontado] = useState(false);

  useEffect(() => {
    setMontado(true);
    try {
      if (localStorage.getItem(KEY) !== '1') setAbierta(true);
    } catch { /* ignorar */ }
  }, [KEY]);

  const cerrar = () => {
    setAbierta(false);
    try { localStorage.setItem(KEY, '1'); } catch { /* ignorar */ }
  };

  const tonos = {
    green: ['var(--greenS)', 'var(--green)'],
    navy: ['var(--navyS)', 'var(--navy)'],
    orange: ['var(--orangeS)', 'var(--orange)'],
    amber: ['var(--amberS)', 'var(--amber)'],
    purple: ['var(--purpleS)', 'var(--purple)'],
  };
  const [fondo, color] = tonos[tono] || tonos.green;

  if (!montado) return null;

  if (!abierta) {
    return (
      <button
        onClick={() => setAbierta(true)}
        title={`Qué puedes hacer en ${titulo}`}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, height: 30, padding: '0 11px',
          borderRadius: 99, background: fondo, color, font: '700 11.5px Manrope,sans-serif',
        }}
      >
        <Icon name="lightbulb" size={14} fill />
        Cómo funciona
      </button>
    );
  }

  return (
    <div
      className="dx-card"
      style={{
        padding: 0, overflow: 'hidden', marginBottom: 16,
        borderLeft: `3px solid ${color}`,
        animation: 'trUp .3s cubic-bezier(.2,.8,.2,1) both',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 13, padding: '17px 18px 15px' }}>
        <span style={{ width: 38, height: 38, borderRadius: 11, background: fondo, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
          <Icon name="lightbulb" size={20} fill color={color} />
        </span>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ font: '800 15px Manrope,sans-serif', letterSpacing: '-.02em' }}>{titulo}</div>
          <div style={{ font: '500 12.5px/1.55 Manrope,sans-serif', color: 'var(--mu)', marginTop: 5 }}>{frase}</div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 13 }}>
            {puntos.map((p) => (
              <span
                key={p.t}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7, padding: '8px 12px',
                  borderRadius: 10, background: 'var(--sf)', maxWidth: '100%',
                }}
              >
                <Icon name={p.i} size={16} color={color} />
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: 'block', font: '700 11.5px Manrope,sans-serif' }}>{p.t}</span>
                  <span style={{ display: 'block', font: '500 10.5px Manrope,sans-serif', color: 'var(--mu)', marginTop: 1 }}>{p.s}</span>
                </span>
              </span>
            ))}
          </div>
        </div>

        <button
          onClick={cerrar}
          title="Entendido"
          style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--sf)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}
        >
          <Icon name="close" size={17} color="var(--mu)" />
        </button>
      </div>
    </div>
  );
}
