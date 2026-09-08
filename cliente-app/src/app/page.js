'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';

const SERVICES = [
  { value: 'mensajeria', label: 'Mensajería', desc: 'Documentos, cartas, correspondencia' },
  { value: 'encomienda', label: 'Encomienda', desc: 'Paquetes y mercancías' },
  { value: 'domicilio', label: 'Domicilio', desc: 'Restaurantes, tiendas, farmacias' },
  { value: 'mandado', label: 'Mandado', desc: 'Compras, pagos, diligencias' },
  { value: 'autorizacion_medica', label: 'Autorización médica', desc: 'Trámites en EPS y clínicas' },
];

const inputStyle = {
  width: '100%', padding: '13px 14px', borderRadius: 12,
  background: 'var(--sf)', border: '1px solid var(--bd)', font: '600 14px Manrope,sans-serif',
};

export default function PedirPage() {
  const router = useRouter();
  const [serviceType, setServiceType] = useState('mensajeria');
  const [form, setForm] = useState({ contact_name: '', contact_phone: '', pickup_address: '', dropoff_address: '', description: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    const { data, error } = await supabase
      .from('service_requests')
      .insert({
        service_type: serviceType,
        contact_name: form.contact_name,
        contact_phone: form.contact_phone,
        pickup_address: form.pickup_address,
        dropoff_address: form.dropoff_address,
        description: form.description || null,
        source: 'app',
      })
      .select('tracking_code')
      .single();
    setBusy(false);
    if (error) return setError(error.message);
    router.push(`/seguimiento/${data.tracking_code}`);
  };

  return (
    <div style={{ minHeight: '100dvh', padding: '28px 20px 48px', maxWidth: 480, margin: '0 auto' }}>
      <div style={{ font: '800 24px Manrope,sans-serif', color: 'var(--navy)' }}>Domix</div>
      <div style={{ font: '600 13px Manrope,sans-serif', color: 'var(--mu)', marginTop: 4, marginBottom: 24 }}>
        Pide tu servicio sin registrarte — desde $6.000
      </div>

      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <div style={{ font: '700 12px Manrope,sans-serif', color: 'var(--mu)', marginBottom: 8 }}>¿Qué necesitas?</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {SERVICES.map((s) => (
              <button
                type="button"
                key={s.value}
                onClick={() => setServiceType(s.value)}
                style={{
                  textAlign: 'left', padding: '12px', borderRadius: 14,
                  background: serviceType === s.value ? 'var(--navy)' : 'var(--sf)',
                  color: serviceType === s.value ? '#fff' : 'var(--tx)',
                  border: '1px solid var(--bd)',
                }}
              >
                <div style={{ font: '700 12.5px Manrope,sans-serif' }}>{s.label}</div>
                <div style={{ font: '500 10.5px Manrope,sans-serif', opacity: 0.75, marginTop: 2 }}>{s.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <input required placeholder="Tu nombre" value={form.contact_name} onChange={update('contact_name')} style={inputStyle} />
        <input required type="tel" placeholder="Tu celular (WhatsApp)" value={form.contact_phone} onChange={update('contact_phone')} style={inputStyle} />
        <input required placeholder="Dirección de recogida" value={form.pickup_address} onChange={update('pickup_address')} style={inputStyle} />
        <input required placeholder="Dirección de entrega" value={form.dropoff_address} onChange={update('dropoff_address')} style={inputStyle} />
        <textarea placeholder="Detalles (opcional): qué es, referencias, etc." value={form.description} onChange={update('description')} rows={3} style={{ ...inputStyle, resize: 'none' }} />

        {error && <div style={{ font: '600 12px Manrope,sans-serif', color: 'var(--red)' }}>{error}</div>}

        <button
          type="submit"
          disabled={busy}
          style={{ padding: '15px', borderRadius: 14, background: 'var(--pink)', color: '#fff', font: '700 14px Manrope,sans-serif' }}
        >
          {busy ? 'Enviando…' : 'Pedir ahora'}
        </button>
      </form>
    </div>
  );
}
