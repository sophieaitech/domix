'use client';

import { useEffect, useRef, useState } from 'react';

/* iPhone 17 Pro Max: 440×956 pt. Se escala para caber siempre en la
   ventana (máx. 80%) y en móvil real ocupa la pantalla completa. */
const W = 440;
const H = 956;

export default function PhoneFrame({ children }) {
  const [fit, setFit] = useState(0.8);
  const [isPhone, setIsPhone] = useState(false);
  const [clock, setClock] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    const measure = () => {
      const phone = window.innerWidth < 640;
      setIsPhone(phone);
      if (phone) return setFit(1);
      setFit(Math.min(0.8, (window.innerHeight - 40) / H, (window.innerWidth - 40) / W));
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit', hour12: false }));
    tick();
    const t = setInterval(tick, 20000);
    return () => clearInterval(t);
  }, []);

  if (isPhone) {
    return <div className="dx-shell dx-shell--bare">{children}</div>;
  }

  return (
    <div
      ref={ref}
      className="dx-device"
      style={{
        width: W, height: H, transform: `scale(${fit})`, transformOrigin: 'top center',
        margin: `20px ${(W * fit - W) / 2}px ${H * fit - H + 20}px`,
      }}
    >
      {/* Dynamic Island */}
      <div className="dx-island" />

      {/* Barra de estado */}
      <div className="dx-status">
        <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-.01em' }}>{clock}</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span className="mi mi-fill" style={{ fontSize: 16 }}>signal_cellular_alt</span>
          <span className="mi mi-fill" style={{ fontSize: 16 }}>wifi</span>
          <span className="mi mi-fill" style={{ fontSize: 18 }}>battery_full</span>
        </span>
      </div>

      <div className="dx-screen">{children}</div>

      {/* Indicador de inicio */}
      <div className="dx-homebar" />
    </div>
  );
}
