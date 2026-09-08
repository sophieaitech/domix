'use client';

import { useEffect, useRef, useState } from 'react';
import { Icon, Spinner } from './ui';
import { searchAddress, currentPosition, reverseGeocode } from '../lib/geo';

/* Campo de dirección con autocompletado de OpenStreetMap y botón
   "usar mi ubicación". Devuelve texto + coordenadas para calcular tarifa. */
export default function AddressField({ label, icon = 'location_on', placeholder, value, point, onChange, allowLocate = false, required }) {
  const [text, setText] = useState(value || '');
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [locating, setLocating] = useState(false);
  const timer = useRef(null);
  const controller = useRef(null);

  useEffect(() => { setText(value || ''); }, [value]);

  const handleType = (e) => {
    const v = e.target.value;
    setText(v);
    onChange({ address: v, point: null });
    clearTimeout(timer.current);
    controller.current?.abort();
    if (v.trim().length < 3) return setItems([]);
    setBusy(true);
    timer.current = setTimeout(async () => {
      controller.current = new AbortController();
      const res = await searchAddress(v, { signal: controller.current.signal });
      setItems(res);
      setOpen(true);
      setBusy(false);
    }, 450);
  };

  const choose = (item) => {
    setText(item.label);
    setItems([]);
    setOpen(false);
    onChange({ address: item.label, point: { lat: item.lat, lon: item.lon } });
  };

  const locate = async () => {
    setLocating(true);
    try {
      const pos = await currentPosition();
      const found = await reverseGeocode(pos);
      const label = found?.label || `Mi ubicación (${pos.lat.toFixed(4)}, ${pos.lon.toFixed(4)})`;
      setText(label);
      onChange({ address: label, point: { lat: pos.lat, lon: pos.lon } });
    } catch {
      onChange({ address: text, point: null });
    } finally {
      setLocating(false);
    }
  };

  return (
    <label style={{ display: 'block', position: 'relative' }}>
      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--on-surface-variant)', letterSpacing: '.02em' }}>{label}</span>
        {allowLocate && (
          <button type="button" onClick={locate} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 800, color: 'var(--secondary)' }}>
            <Icon name={locating ? 'sync' : 'my_location'} size={15} fill />
            {locating ? 'Ubicando…' : 'Usar mi ubicación'}
          </button>
        )}
      </span>

      <span style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px', height: 52, borderRadius: 'var(--sh-sm)', background: 'var(--surface-lowest)', border: `1px solid ${point ? 'var(--secondary)' : 'var(--outline-variant)'}` }}>
        <Icon name={icon} size={19} color={point ? 'var(--secondary)' : 'var(--on-surface-variant)'} fill={!!point} />
        <input
          required={required}
          value={text}
          onChange={handleType}
          onFocus={() => items.length && setOpen(true)}
          placeholder={placeholder}
          style={{ flex: 1, fontSize: 14.5, fontWeight: 600 }}
        />
        {busy && <Spinner size={18} />}
        {point && !busy && <Icon name="check_circle" size={18} fill color="var(--secondary)" />}
      </span>

      {open && items.length > 0 && (
        <div style={{ position: 'absolute', left: 0, right: 0, top: '100%', marginTop: 6, zIndex: 60, borderRadius: 'var(--sh-md)', background: 'var(--surface-lowest)', border: '1px solid var(--outline-variant)', boxShadow: 'var(--elev-3)', overflow: 'hidden', animation: 'dxDrop .16s var(--ease-out)' }}>
          {items.map((it, i) => (
            <button
              key={`${it.lat}-${it.lon}-${i}`}
              type="button"
              onClick={() => choose(it)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '11px 13px', textAlign: 'left', borderTop: i ? '1px solid var(--outline-variant)' : 'none', background: 'transparent' }}
            >
              <Icon name="location_on" size={17} color="var(--on-surface-variant)" />
              <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, fontWeight: 600, lineHeight: 1.35 }}>{it.label}</span>
            </button>
          ))}
        </div>
      )}
    </label>
  );
}
