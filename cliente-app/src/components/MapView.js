'use client';

import { useEffect, useRef } from 'react';

/* Mapa con Leaflet + teselas gratuitas de OpenStreetMap (sin API key).
   Leaflet se carga por CDN al montar, para no depender del bundler. */

const CSS_URL = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
const JS_URL = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
/* OpenStreetMap, que no pide clave ni cuota. Para el modo oscuro no se
   cambia de proveedor: se le aplica un filtro a las teselas claras, así
   el mapa acompaña el tema sin depender de un servicio de pago. */
const TILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const ATTR = '&copy; OpenStreetMap';

function esOscuro() {
  if (typeof document === 'undefined') return false;
  const t = document.documentElement.getAttribute('data-theme');
  if (t === 'dark') return true;
  if (t === 'light') return false;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches || false;
}

let loader = null;
export function loadLeaflet() {
  if (typeof window === 'undefined') return Promise.reject(new Error('sin ventana'));
  if (window.L) return Promise.resolve(window.L);
  if (loader) return loader;
  loader = new Promise((resolve, reject) => {
    if (!document.querySelector(`link[href="${CSS_URL}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = CSS_URL;
      document.head.appendChild(link);
    }
    const script = document.createElement('script');
    script.src = JS_URL;
    script.async = true;
    script.onload = () => resolve(window.L);
    script.onerror = () => reject(new Error('No se pudo cargar Leaflet'));
    document.head.appendChild(script);
  });
  return loader;
}

/* Marcador con halo. El del repartidor late, para que se note que la
   posición es de verdad y no una foto vieja. */
function pinIcon(L, { color, icon, pulse, size = 34 }) {
  const halo = pulse
    ? `<span style="position:absolute;inset:-9px;border-radius:50%;background:${color};opacity:.22;animation:dxLate 1.9s ease-out infinite"></span>`
    : '';
  return L.divIcon({
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `<div style="position:relative;width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center">
             ${halo}
             <span style="position:relative;width:${size}px;height:${size}px;border-radius:50%;background:${color};
                          display:flex;align-items:center;justify-content:center;
                          box-shadow:0 4px 14px rgba(10,10,10,.45);border:2.5px solid #fff">
               <span class="mi mi-fill" style="font-size:${Math.round(size * 0.53)}px;color:#fff">${icon}</span>
             </span>
           </div>`,
  });
}

export default function MapView({
  height = 220,
  center,
  pickup,
  dropoff,
  courier,
  route = [],
  couriers = [],
  radiusKm,
  interactive = true,
  style,
}) {
  const nodeRef = useRef(null);
  const mapRef = useRef(null);
  const layersRef = useRef([]);
  const observerRef = useRef(null);
  const tileRef = useRef(null);
  const courierMarkerRef = useRef(null);

  /* El mapa vive mientras la app cambia de claro a oscuro: se le
     reemplazan las teselas en vez de volverlo a construir. */
  useEffect(() => {
    const obs = new MutationObserver(() => {
      nodeRef.current?.classList.toggle('dx-mapa-oscuro', esOscuro());
    });
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadLeaflet().then((L) => {
      if (cancelled || !nodeRef.current || mapRef.current) return;
      const start = center || pickup || dropoff || { lat: 3.8801, lon: -77.0312 };
      const map = L.map(nodeRef.current, {
        center: [start.lat, start.lon],
        zoom: 14,
        zoomControl: interactive,
        dragging: interactive,
        scrollWheelZoom: false,
        attributionControl: true,
      });
      const capa = L.tileLayer(TILES, { attribution: ATTR, maxZoom: 19 }).addTo(map);
      tileRef.current = capa;
      nodeRef.current.classList.toggle('dx-mapa-oscuro', esOscuro());
      mapRef.current = map;
      draw();

      // Leaflet mide el contenedor al crearse; si aún no tenía su tamaño
      // final (animaciones, layouts flex), las teselas quedan corridas.
      const fix = () => map.invalidateSize({ animate: false });
      requestAnimationFrame(fix);
      setTimeout(fix, 250);
      const ro = new ResizeObserver(fix);
      ro.observe(nodeRef.current);
      observerRef.current = ro;
    }).catch(() => {});
    return () => {
      cancelled = true;
      observerRef.current?.disconnect();
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const draw = () => {
    const L = window.L;
    const map = mapRef.current;
    if (!L || !map) return;

    layersRef.current.forEach((l) => map.removeLayer(l));
    layersRef.current = [];
    const add = (layer) => { layer.addTo(map); layersRef.current.push(layer); return layer; };
    const bounds = [];

    if (route?.length > 1) {
      const latlngs = route.map((p) => [p.lat, p.lon]);
      const oscuro = esOscuro();
      add(L.polyline(latlngs, { color: oscuro ? '#0a0a0a' : '#17140F', weight: 7, opacity: .28, lineCap: 'round' }));
      add(L.polyline(latlngs, { color: oscuro ? '#f7f7f8' : '#17140F', weight: 4, opacity: .9, lineCap: 'round' }));
      const guion = L.polyline(latlngs, { color: '#5FBF45', weight: 2.5, opacity: .95, dashArray: '2 12', lineCap: 'round', className: 'dx-ruta' });
      add(guion);
      latlngs.forEach((p) => bounds.push(p));
    }

    if (pickup) {
      add(L.marker([pickup.lat, pickup.lon], { icon: pinIcon(L, { color: '#17140F', icon: 'store' }) }));
      bounds.push([pickup.lat, pickup.lon]);
    }
    if (dropoff) {
      add(L.marker([dropoff.lat, dropoff.lon], { icon: pinIcon(L, { color: '#2F7A24', icon: 'location_on' }) }));
      bounds.push([dropoff.lat, dropoff.lon]);
    }
    if (courier) {
      add(L.marker([courier.lat, courier.lon], { icon: pinIcon(L, { color: '#1B4F8F', icon: 'two_wheeler', pulse: true }) }));
      bounds.push([courier.lat, courier.lon]);
    }
    couriers.forEach((c) => {
      if (c.lat == null || c.lon == null) return;
      add(L.marker([c.lat, c.lon], {
        icon: pinIcon(L, { color: c.status === 'online' ? '#2F7A24' : c.status === 'busy' ? '#1B4F8F' : '#B6AFA4', icon: 'two_wheeler' }),
      })).bindTooltip(c.name || 'Repartidor', { direction: 'top', offset: [0, -16] });
      bounds.push([c.lat, c.lon]);
    });

    if (radiusKm && center) {
      add(L.circle([center.lat, center.lon], {
        radius: radiusKm * 1000, color: '#2F7A24', weight: 1.5, fillColor: '#2F7A24', fillOpacity: .07,
      }));
    }

    if (bounds.length > 1) map.fitBounds(bounds, { padding: [34, 34], maxZoom: 16 });
    else if (bounds.length === 1) map.setView(bounds[0], 15);
    else if (center) map.setView([center.lat, center.lon], radiusKm ? 12 : 14);
  };

  useEffect(() => { draw(); });

  return (
    <div
      ref={nodeRef}
      style={{
        height, width: '100%', borderRadius: 'var(--sh-lg)', overflow: 'hidden',
        background: 'var(--surface-container)', border: '1px solid var(--outline-variant)',
        // Leaflet usa z-index 400+ en sus paneles internos; sin un contexto de
        // apilamiento propio, el mapa se pinta encima de overlays como la oferta.
        position: 'relative', zIndex: 0, isolation: 'isolate',
        ...style,
      }}
    />
  );
}
