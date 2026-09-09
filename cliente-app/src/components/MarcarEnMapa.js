'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon, Button } from './ui';
import { loadLeaflet } from './MapView';
import { BUENAVENTURA, reverseGeocode } from '../lib/geo';

/* Muchas direcciones de Buenaventura no están en OpenStreetMap. En vez de
   inventarles coordenadas, el cliente arrastra el mapa hasta su casa y el
   punto queda exacto. */
export default function MarcarEnMapa({ titulo, inicial, onConfirmar, onCerrar }) {
  const nodo = useRef(null);
  const mapa = useRef(null);
  const limpieza = useRef(null);
  const [centro, setCentro] = useState(inicial || BUENAVENTURA);
  const [referencia, setReferencia] = useState('');
  const [buscandoRef, setBuscandoRef] = useState(false);

  useEffect(() => {
    let vivo = true;
    (async () => {
      const L = await loadLeaflet();
      if (!vivo || !nodo.current || mapa.current) return;

      const m = L.map(nodo.current, { zoomControl: true, attributionControl: true })
        .setView([centro.lat, centro.lon], 16);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap',
      }).addTo(m);

      // El pin queda fijo en el centro: se mueve el mapa, no el pin.
      m.on('moveend', () => {
        const c = m.getCenter();
        setCentro({ lat: c.lat, lon: c.lng });
      });

      mapa.current = m;

      // El contenedor nace con tamaño cero dentro del portal; sin remedir,
      // Leaflet no pide ningún tile y el mapa se ve en blanco.
      const remedir = () => m.invalidateSize();
      requestAnimationFrame(remedir);
      const t1 = setTimeout(remedir, 150);
      const t2 = setTimeout(remedir, 500);
      const observer = new ResizeObserver(remedir);
      observer.observe(nodo.current);
      limpieza.current = () => { clearTimeout(t1); clearTimeout(t2); observer.disconnect(); };
    })();

    return () => {
      vivo = false;
      if (limpieza.current) { limpieza.current(); limpieza.current = null; }
      if (mapa.current) { mapa.current.remove(); mapa.current = null; }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // El campo de dirección vive dentro de un <label> posicionado, así que
  // sin portal esta hoja se dibujaría dentro del formulario.
  const [destino, setDestino] = useState(null);
  useEffect(() => {
    setDestino(document.querySelector('.dx-shell') || document.body);
  }, []);

  const confirmar = async () => {
    setBuscandoRef(true);
    // Se intenta nombrar el punto; si OSM no lo conoce, vale la referencia
    // que escribió el cliente.
    let etiqueta = referencia.trim();
    if (!etiqueta) {
      const encontrado = await reverseGeocode(centro).catch(() => null);
      etiqueta = encontrado?.label || `Punto marcado (${centro.lat.toFixed(4)}, ${centro.lon.toFixed(4)})`;
    }
    setBuscandoRef(false);
    onConfirmar({ address: etiqueta, point: { lat: centro.lat, lon: centro.lon } });
  };

  if (!destino) return null;

  return createPortal(
    <div style={{ position: 'absolute', inset: 0, zIndex: 300, background: 'var(--bg)', display: 'flex', flexDirection: 'column', animation: 'trUpS .26s cubic-bezier(.2,.8,.2,1)' }}>
      <div style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px' }}>
        <button onClick={onCerrar} style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--sf)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="arrow_back" size={20} />
        </button>
        <div style={{ flex: 1, font: '800 17px Manrope,sans-serif', letterSpacing: '-.03em' }}>{titulo}</div>
      </div>

      <div style={{ position: 'relative', flex: 1, minHeight: 0 }}>
        <div ref={nodo} style={{ position: 'absolute', inset: 0 }} />

        {/* Pin fijo en el centro */}
        <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-100%)', zIndex: 500, pointerEvents: 'none' }}>
          <Icon name="location_on" size={44} fill color="var(--green)" style={{ filter: 'drop-shadow(0 3px 6px rgba(0,0,0,.35))' }} />
        </div>

        <div style={{ position: 'absolute', left: 16, right: 16, top: 12, zIndex: 500, padding: '9px 13px', borderRadius: 11, background: 'var(--bg)', boxShadow: 'var(--sh2)', font: '500 12px/1.45 Manrope,sans-serif', color: 'var(--mu)', textAlign: 'center' }}>
          Mueve el mapa hasta el punto exacto
        </div>
      </div>

      <div style={{ flex: 'none', padding: '14px 16px 22px', borderTop: '1px solid var(--bd2)' }}>
        <label style={{ display: 'block' }}>
          <span style={{ display: 'block', font: '700 12px Manrope,sans-serif', color: 'var(--mu)', marginBottom: 7 }}>
            Referencia para el repartidor
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 15px', height: 52, borderRadius: 13, background: 'var(--sf)' }}>
            <Icon name="home" size={19} color="var(--mu)" />
            <input
              value={referencia}
              onChange={(e) => setReferencia(e.target.value)}
              placeholder="Casa verde de dos pisos, El Jorge"
              style={{ flex: 1, font: '600 14.5px Manrope,sans-serif' }}
            />
          </span>
        </label>

        <Button onClick={confirmar} disabled={buscandoRef} icon="check" style={{ marginTop: 12 }}>
          {buscandoRef ? 'Guardando…' : 'Confirmar este punto'}
        </Button>
      </div>
    </div>,
    destino,
  );
}
