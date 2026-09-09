'use client';

import { useRef, useState } from 'react';
import Hoja from './Hoja';
import { Icon, Button, Field } from './ui';
import { subirDocumento, enlaceDocumento, DOC_STATUS } from '../lib/cuenta';

const MAX_MB = 8;

/* Subir o reemplazar un documento. Se acepta foto o PDF; la cámara del
   celular entra por el mismo campo. */
export default function HojaDocumento({ abierta, doc, actual, courierId, onClose, onGuardado }) {
  const entrada = useRef(null);
  const [archivo, setArchivo] = useState(null);
  const [vista, setVista] = useState(null);
  const [vence, setVence] = useState(actual?.expires_at || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (!doc) return null;

  const estado = DOC_STATUS[actual?.status || 'falta'];

  const elegir = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > MAX_MB * 1024 * 1024) {
      setError(`El archivo pesa más de ${MAX_MB} MB. Toma la foto con menos calidad.`);
      return;
    }
    setError('');
    setArchivo(f);
    setVista(f.type.startsWith('image/') ? URL.createObjectURL(f) : null);
  };

  const guardar = async () => {
    if (!archivo) return;
    setBusy(true);
    setError('');
    const res = await subirDocumento(courierId, doc.type, archivo, doc.vence ? vence || null : null);
    setBusy(false);
    if (!res.ok) return setError(res.mensaje);
    onGuardado(res.documento);
    cerrar();
  };

  const cerrar = () => {
    if (vista) URL.revokeObjectURL(vista);
    setArchivo(null);
    setVista(null);
    setError('');
    onClose();
  };

  const verActual = async () => {
    const url = await enlaceDocumento(actual?.storage_path);
    if (url) window.open(url, '_blank', 'noopener');
  };

  return (
    <Hoja
      abierta={abierta}
      titulo={doc.label}
      sub={doc.ayuda}
      onClose={cerrar}
      pie={
        <Button full icon={busy ? undefined : 'cloud_upload'} disabled={!archivo || busy} onClick={guardar}
          style={{ opacity: !archivo || busy ? .5 : 1 }}>
          {busy ? 'Subiendo…' : actual ? 'Reemplazar documento' : 'Subir documento'}
        </Button>
      }
    >
      {/* Cómo va el que ya está */}
      {actual && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: 13, borderRadius: 'var(--sh-sm)', background: 'var(--surface-container)', marginBottom: 14 }}>
          <Icon name={estado.icon} size={20} fill color={estado.color} />
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: 'block', fontSize: 13, fontWeight: 800, color: estado.color }}>{estado.label}</span>
            {actual.review_notes && (
              <span style={{ display: 'block', fontSize: 11.5, color: 'var(--on-surface-variant)', marginTop: 2, lineHeight: 1.4 }}>
                {actual.review_notes}
              </span>
            )}
          </span>
          {actual.storage_path && (
            <button onClick={verActual} style={{ fontSize: 12, fontWeight: 800, color: 'var(--primary)', padding: '6px 4px' }}>Ver</button>
          )}
        </div>
      )}

      {/* Selector */}
      <input
        ref={entrada}
        type="file"
        accept="image/*,application/pdf"
        capture="environment"
        onChange={elegir}
        style={{ display: 'none' }}
      />

      <button
        onClick={() => entrada.current?.click()}
        style={{
          width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 9, padding: vista ? 0 : '30px 18px', minHeight: 168, overflow: 'hidden',
          borderRadius: 'var(--sh-md)', border: `2px dashed ${archivo ? 'var(--primary)' : 'var(--outline-variant)'}`,
          background: 'var(--surface-lowest)',
        }}
      >
        {vista ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={vista} alt="Documento" style={{ width: '100%', maxHeight: 260, objectFit: 'contain' }} />
        ) : archivo ? (
          <>
            <Icon name="picture_as_pdf" size={34} color="var(--primary)" />
            <span style={{ fontSize: 13, fontWeight: 800 }}>{archivo.name}</span>
          </>
        ) : (
          <>
            <span style={{ width: 54, height: 54, borderRadius: '50%', background: 'var(--primary-container)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="add_a_photo" size={26} color="var(--on-primary-container)" />
            </span>
            <span style={{ fontSize: 13.5, fontWeight: 800 }}>Toma la foto o busca el archivo</span>
            <span style={{ fontSize: 11.5, color: 'var(--on-surface-variant)', textAlign: 'center', lineHeight: 1.45 }}>
              Que se lea completo, sin reflejos y sin dedos encima.<br />Imagen o PDF, máximo {MAX_MB} MB.
            </span>
          </>
        )}
      </button>

      {archivo && (
        <button onClick={() => entrada.current?.click()} style={{ width: '100%', textAlign: 'center', fontSize: 12.5, fontWeight: 800, color: 'var(--primary)', padding: '11px 0' }}>
          Cambiar archivo
        </button>
      )}

      {doc.vence && (
        <div style={{ marginTop: 14 }}>
          <Field label="¿Cuándo vence?" icon="event" type="date" value={vence} onChange={(e) => setVence(e.target.value)} />
          <div style={{ fontSize: 11.5, color: 'var(--on-surface-variant)', marginTop: 7, lineHeight: 1.45 }}>
            Te avisamos un mes antes para que lo renueves sin quedar inactivo.
          </div>
        </div>
      )}

      {error && (
        <div style={{ display: 'flex', gap: 9, alignItems: 'flex-start', marginTop: 14, padding: 12, borderRadius: 'var(--sh-sm)', background: 'var(--error-container)' }}>
          <Icon name="error" size={18} fill color="var(--on-error-container)" />
          <span style={{ flex: 1, fontSize: 12.5, fontWeight: 600, color: 'var(--on-error-container)', lineHeight: 1.45 }}>{error}</span>
        </div>
      )}
    </Hoja>
  );
}
