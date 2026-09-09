'use client';

import { useEffect, useState } from 'react';

const KEY = 'domix_splash_seen';
const DURACION = 1400;

/* Pantalla de arranque. El logo llega como llega una moto: entra desde la
   izquierda, frena y se asienta. Todo con CSS sobre una imagen de 10 KB,
   para que aparezca al instante incluso con señal débil.

   (El video del logo no se usa: es H.264, que no lleva canal alfa, y trae
   el cuadriculado de transparencia grabado como píxeles.) */
export default function Splash() {
  const [mostrar, setMostrar] = useState(false);
  const [saliendo, setSaliendo] = useState(false);

  useEffect(() => {
    let visto = false;
    try { visto = sessionStorage.getItem(KEY) === '1'; } catch { /* ignorar */ }
    if (visto) return;

    setMostrar(true);
    try { sessionStorage.setItem(KEY, '1'); } catch { /* ignorar */ }

    const t1 = setTimeout(() => setSaliendo(true), DURACION);
    const t2 = setTimeout(() => setMostrar(false), DURACION + 300);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  if (!mostrar) return null;

  return (
    <div
      style={{
        position: 'absolute', inset: 0, zIndex: 999, background: '#0a0a0a',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        opacity: saliendo ? 0 : 1,
        transition: 'opacity .3s ease',
        pointerEvents: saliendo ? 'none' : 'auto',
      }}
    >
      <style>{`
        @keyframes dxLlega {
          0%   { transform: translateX(-46px) scale(.94); opacity: 0 }
          55%  { transform: translateX(6px)   scale(1.02); opacity: 1 }
          100% { transform: translateX(0)     scale(1);    opacity: 1 }
        }
        @keyframes dxEstela {
          0%   { transform: translateX(0) scaleX(.3); opacity: 0 }
          35%  { opacity: .85 }
          100% { transform: translateX(58px) scaleX(1); opacity: 0 }
        }
        @keyframes dxTexto {
          from { opacity: 0; transform: translateY(7px) }
          to   { opacity: 1; transform: none }
        }
      `}</style>

      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* Estelas de velocidad, como las del logo */}
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              position: 'absolute',
              left: -34,
              top: `calc(50% + ${(i - 1) * 13}px)`,
              width: 30 - i * 6,
              height: 3,
              borderRadius: 99,
              background: i === 1 ? '#5FBF45' : 'rgba(255,255,255,.30)',
              animation: `dxEstela .85s cubic-bezier(.2,.8,.2,1) ${0.1 + i * 0.07}s both`,
            }}
          />
        ))}

        <div style={{ animation: 'dxLlega .72s cubic-bezier(.2,.9,.25,1) both' }}>
          {/* Logo sin fondo: el marino se convirtio en blanco para que se lea
              sobre el negro y el naranja de la caja siga siendo el acento. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/domix-logo-dark-sm.webp"
            alt="Domix"
            width={160}
            height={160}
            style={{ width: 160, height: 160, objectFit: 'contain', display: 'block' }}
          />
        </div>
      </div>

      <div style={{ animation: 'dxTexto .5s ease .5s both', textAlign: 'center', marginTop: 6 }}>
        <div style={{ font: '600 9.5px Manrope,sans-serif', letterSpacing: '.19em', color: 'rgba(255,255,255,.42)' }}>
          MENSAJERÍA &amp; LOGÍSTICA
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: 44, font: '500 10.5px Manrope,sans-serif', letterSpacing: '.18em', color: 'rgba(255,255,255,.32)' }}>
        BUENAVENTURA · VALLE DEL CAUCA
      </div>
    </div>
  );
}
