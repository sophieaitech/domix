'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';
import { useCourierSession } from '../context/CourierSessionProvider';

function initials(name) {
  return (name || 'D').trim().charAt(0).toUpperCase();
}

export default function ChooseCourierPage() {
  const router = useRouter();
  const { session, loading, selectCourier } = useCourierSession();
  const [couriers, setCouriers] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [error, setError] = useState('');
  const [selecting, setSelecting] = useState(null);

  useEffect(() => {
    if (!loading && session) {
      router.replace('/home');
    }
  }, [loading, session, router]);

  useEffect(() => {
    supabase
      .from('profiles')
      .select('id, first_name, last_name, phone_number, courier_profiles(status)')
      .eq('role', 'courier')
      .then(({ data, error }) => {
        if (error) setError(error.message);
        setCouriers(data || []);
        setLoadingList(false);
      });
  }, []);

  if (!loading && session) return null;

  const handleSelect = async (id) => {
    setSelecting(id);
    await selectCourier(id);
    router.replace('/home');
  };

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', padding: '32px 24px', gap: 24 }}>
      <div>
        <div style={{ font: '800 26px Manrope,sans-serif', color: 'var(--navy)' }}>Domix</div>
        <div style={{ font: '600 13px Manrope,sans-serif', color: 'var(--mu)', marginTop: 4 }}>Mensajería &amp; Logística — App de repartidores</div>
      </div>

      <div style={{ font: '700 13px Manrope,sans-serif', color: 'var(--mu)' }}>¿Quién eres?</div>

      {loadingList && <div style={{ font: '600 12.5px Manrope,sans-serif', color: 'var(--mu)' }}>Cargando repartidores…</div>}

      {error && (
        <div style={{ font: '600 12.5px Manrope,sans-serif', color: 'var(--red)' }}>
          No se pudo cargar la lista ({error}). Verifica que Supabase esté configurado.
        </div>
      )}

      {!loadingList && !error && couriers.length === 0 && (
        <div style={{ font: '600 12.5px Manrope,sans-serif', color: 'var(--mu)' }}>
          Todavía no hay repartidores creados. Pídele al administrador de Domix que registre tu perfil.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {couriers.map((c) => (
          <button
            key={c.id}
            onClick={() => handleSelect(c.id)}
            disabled={selecting === c.id}
            style={{
              display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
              borderRadius: 16, background: 'var(--sf)', border: '1px solid var(--bd)', textAlign: 'left',
            }}
          >
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--navyS)', color: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '800 14px Manrope,sans-serif' }}>
              {initials(c.first_name)}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ font: '700 14px Manrope,sans-serif' }}>{c.first_name} {c.last_name}</div>
              <div style={{ font: '600 11.5px Manrope,sans-serif', color: 'var(--mu)' }}>{c.phone_number}</div>
            </div>
            {selecting === c.id && <span style={{ font: '600 11px Manrope,sans-serif', color: 'var(--mu)' }}>Entrando…</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
