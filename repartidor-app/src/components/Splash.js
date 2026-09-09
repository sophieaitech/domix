'use client';

import { useEffect, useState } from 'react';

const KEY = 'domix_splash_seen_repartidor';
const DURATION = 1500;

/* Pantalla de arranque: el logo entra, la barra corre y entra a la app.
   Solo se muestra en la primera carga de la sesión. */
export default function Splash() {
  const [show, setShow] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    let seen = false;
    try { seen = sessionStorage.getItem(KEY) === '1'; } catch { /* ignorar */ }
    if (seen) return;

    setShow(true);
    try { sessionStorage.setItem(KEY, '1'); } catch { /* ignorar */ }

    const fade = setTimeout(() => setLeaving(true), DURATION);
    const hide = setTimeout(() => setShow(false), DURATION + 320);
    return () => { clearTimeout(fade); clearTimeout(hide); };
  }, []);

  if (!show) return null;

  return (
    <div
      style={{
        position: 'absolute', inset: 0, zIndex: 999, background: '#0a0a0a',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        opacity: leaving ? 0 : 1, transition: 'opacity .3s ease', pointerEvents: leaving ? 'none' : 'auto',
      }}
    >
      <div style={{ animation: 'trPop .7s cubic-bezier(.2,.8,.2,1) both', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* El logo va sobre fondo blanco, así que lo montamos en un badge
            redondeado: se lee como el icono de la app sobre el negro. */}
        <div>{/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/domix-logo-dark-sm.png" alt="Domix" style={{ width: 150, height: 150, objectFit: 'contain' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, marginTop: 22 }}>
          <div style={{ font: "800 34px/1 'Bricolage Grotesque',sans-serif", letterSpacing: '-.05em', color: '#fff' }}>
            Domi<span style={{ color: '#5FBF45' }}>X</span>
          </div>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#5FBF45', marginBottom: 6 }} />
        </div>
      </div>

      <div style={{ width: 110, height: 2, background: 'rgba(255,255,255,.16)', overflow: 'hidden', borderRadius: 2, marginTop: 26 }}>
        <div style={{ width: '100%', height: '100%', background: '#5FBF45', transformOrigin: 'left', animation: `trBar ${DURATION}ms cubic-bezier(.4,0,.2,1) both` }} />
      </div>

      <div style={{ position: 'absolute', bottom: 44, font: '500 10.5px Manrope,sans-serif', letterSpacing: '.18em', color: 'rgba(255,255,255,.38)' }}>
        REPARTIDOR · BUENAVENTURA
      </div>
    </div>
  );
}
