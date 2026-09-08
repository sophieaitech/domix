'use client';

import { useEffect, useRef } from 'react';

/* Mapa con Leaflet + teselas gratuitas de OpenStreetMap (sin API key).
   Leaflet se carga por CDN al montar, para no depender del bundler. */

const CSS_URL = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
const JS_URL = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
const TILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const ATTR = '&copy; OpenStreetMap';

let loader = null;
function loadLeaflet() {
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

function pinIcon(L, { color, icon, pulse }) {
  return L.divIcon({
    className: '',
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    html: `<div style="width:34px;height:34px;border-radius:50%;background:${color};display:flex;align-items:center;justify-content:center;
                       box-shadow:0 3px 12px rgba(20,16,10,.4);border:2.5px solid #fff;${pulse ? 'animation:dxPulse 2s infinite;' : ''}">
             <span class="mi mi-fill" style="font-size:18px;color:#fff">${icon}</span>
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
      L.tileLayer(TILES, { attribution: ATTR, maxZoom: 19 }).addTo(map);
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
      add(L.polyline(latlngs, { color: '#17140F', weight: 5, opacity: .85, lineCap: 'round' }));
      add(L.polyline(latlngs, { color: '#2F7A24', weight: 2, opacity: .9, dashArray: '1 10', lineCap: 'round' }));
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
