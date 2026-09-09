'use client';

import { useEffect, useState } from 'react';

/* El marco de iPhone existe para mirar la app desde un computador. En un
   celular de verdad no debe aparecer nunca.

   Antes eso se decidía en JavaScript, con un estado que empezaba en
   "no es celular": el marco alcanzaba a dibujarse y un instante después
   desaparecía. Desde el teléfono se veía la app encapsulada y luego
   acomodándose, que es justo lo que no debe pasar al abrir.

   Ahora lo decide el CSS. El navegador aplica la media query antes de
   pintar, así que en un celular el marco no llega a existir: no hay
   estado inicial equivocado que corregir. El JavaScript solo calcula
   cuánto encoger el marco en pantallas grandes. */

const W = 440;
const H = 956;
const ESCRITORIO = '(min-width: 640px)';

export default function PhoneFrame({ children }) {
  const [fit, setFit] = useState(null);
  const [reloj, setReloj] = useState('');

  useEffect(() => {
    const mq = window.matchMedia(ESCRITORIO);

    const medir = () => {
      if (!mq.matches) return setFit(null);
      setFit(Math.min(0.8, (window.innerHeight - 40) / H, (window.innerWidth - 40) / W));
    };

    medir();
    window.addEventListener('resize', medir);
    mq.addEventListener('change', medir);
    return () => {
      window.removeEventListener('resize', medir);
      mq.removeEventListener('change', medir);
    };
  }, []);

  /* El reloj de la barra de estado solo se ve dentro del marco, así que
     no vale la pena mantenerlo andando en un celular. */
  useEffect(() => {
    if (fit === null) return;
    const tick = () => setReloj(new Date().toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit', hour12: false }));
    tick();
    const t = setInterval(tick, 20000);
    return () => clearInterval(t);
  }, [fit]);

  /* Mientras no se ha medido, el marco se dibuja a escala 1 y el CSS lo
     encoge; en celular la media query lo desarma antes de pintar. */
  const escala = fit ?? 0.8;

  return (
    <div
      className="dx-device"
      style={{
        '--dx-fit': escala,
        '--dx-hueco-x': `${(W * escala - W) / 2}px`,
        '--dx-hueco-y': `${H * escala - H + 20}px`,
      }}
    >
      <div className="dx-island" />

      <div className="dx-status">
        <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-.01em' }}>{reloj}</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span className="mi mi-fill" style={{ fontSize: 16 }}>signal_cellular_alt</span>
          <span className="mi mi-fill" style={{ fontSize: 16 }}>wifi</span>
          <span className="mi mi-fill" style={{ fontSize: 18 }}>battery_full</span>
        </span>
      </div>

      <div className="dx-screen">{children}</div>

      <div className="dx-homebar" />
    </div>
  );
}
