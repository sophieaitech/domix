'use client';

import { useEffect } from 'react';
import { Icon } from './ui';

/* Hoja que sube desde abajo. Vive dentro del marco del teléfono, no en
   el <body>, para que el panel de vista previa siga viéndose como un
   celular. */
export default function Hoja({ abierta, titulo, sub, onClose, children, pie }) {
  useEffect(() => {
    if (!abierta) return;
    const alTeclado = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', alTeclado);
    return () => window.removeEventListener('keydown', alTeclado);
  }, [abierta, onClose]);

  if (!abierta) return null;

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 300, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <button
        aria-label="Cerrar"
        onClick={onClose}
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(3px)', animation: 'dxFadeIn .2s ease both' }}
      />

      <div
        style={{
          position: 'relative', maxHeight: '92%', display: 'flex', flexDirection: 'column',
          background: 'var(--surface)', borderRadius: '26px 26px 0 0',
          boxShadow: '0 -18px 48px rgba(0,0,0,.34)',
          animation: 'dxSlideUp .28s var(--ease-out) both',
        }}
      >
        <div style={{ flex: 'none', padding: '10px 0 0' }}>
          <span style={{ display: 'block', width: 38, height: 4, borderRadius: 99, background: 'var(--outline-variant)', margin: '0 auto' }} />
        </div>

        <div style={{ flex: 'none', display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 18px 12px' }}>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span className="dsp" style={{ display: 'block', font: '800 20px Manrope,sans-serif', letterSpacing: '-.03em' }}>{titulo}</span>
            {sub && <span style={{ display: 'block', fontSize: 12.5, color: 'var(--on-surface-variant)', marginTop: 3, lineHeight: 1.45 }}>{sub}</span>}
          </span>
          <button
            onClick={onClose}
            style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--surface-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}
          >
            <Icon name="close" size={19} color="var(--on-surface-variant)" />
          </button>
        </div>

        <div className="sc" style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '0 18px 18px' }}>
          {children}
        </div>

        {pie && (
          <div style={{ flex: 'none', padding: '13px 18px', borderTop: '1px solid var(--outline-variant)', background: 'var(--surface)' }}>
            {pie}
          </div>
        )}
      </div>
    </div>
  );
}
