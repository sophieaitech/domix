'use client';

import { useEffect } from 'react';

/* Registra el service worker. Solo en producción: en desarrollo estorba,
   porque sirve versiones viejas mientras uno edita. */
export default function RegistrarSW() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Sin service worker la app funciona igual, solo sin modo sin conexión.
    });
  }, []);
  return null;
}
