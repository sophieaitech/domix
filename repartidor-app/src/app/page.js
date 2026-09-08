'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';
import { useCourierSession } from '../context/CourierSessionProvider';
import Icon from '../components/Icon';

function initials(name, last) {
  return ((name?.[0] || 'D') + (last?.[0] || '')).toUpperCase();
}

export default function ChooseCourierPage() {
  const router = useRouter();
  const { session, loading, selectCourier } = useCourierSession();
  const [couriers, setCouriers] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [error, setError] = useState('');
  const [selecting, setSelecting] = useState(null);

  useEffect(() => {
    if (!loading && session) router.replace('/home');
  }, [loading, session, router]);

  useEffect(() => {
    supabase
      .from('profiles')
      .select('id, first_name, last_name, phone_number')
      .eq('role', 'courier')
      .order('first_name')
      .then(({ data, error }) => {
        if (error) setError(error.message);
        setCouriers(data || []);
        setLoadingList(false);
      });
  }, []);

  const handleSelect = async (id) => {
    setSelecting(id);
    await selectCourier(id);
    router.replace('/home');
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#0C1A31', color: '#fff', padding: '0 24px 32px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', right: -70, top: -90, width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle,rgba(245,130,32,.28),rgba(245,130,32,0) 70%)' }} />
      <div style={{ position: 'absolute', left: -80, bottom: -60, width: 260, height: 260, borderRadius: '50%', background: 'radial-gradient(circle,rgba(87,166,57,.22),rgba(87,166,57,0) 70%)' }} />

      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 11, paddingTop: 30 }}>
        <div style={{ width: 40, height: 40, borderRadius: 13, background: 'linear-gradient(150deg,#F79E4E,#F58220)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none', boxShadow: '0 4px 14px rgba(245,130,32,.35)' }}>
          <Icon name="two_wheeler" size={22} fill color="#fff" />
        </div>
        <div>
          <div className="dsp" style={{ fontWeight: 800, fontSize: 19 }}>Domix</div>
          <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,.5)', fontWeight: 800, letterSpacing: '.08em' }}>REPARTIDOR</div>
        </div>
      </div>

      <div style={{ position: 'relative', marginTop: 34 }}>
        <div className="dsp" style={{ fontWeight: 800, fontSize: 30, lineHeight: 1.1 }}>Maneja tu tiempo.<br />Cobra lo que entregas.</div>
        <div style={{ marginTop: 11, color: 'rgba(255,255,255,.62)', fontSize: 14, lineHeight: 1.5 }}>
          Mensajería, encomiendas, domicilios y mandados en Buenaventura.
        </div>
      </div>

      <div className="sc" style={{ position: 'relative', flex: 1, marginTop: 28, overflowY: 'auto' }}>
        <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '.09em', color: 'rgba(255,255,255,.45)', marginBottom: 12 }}>¿QUIÉN ERES?</div>

        {loadingList && (
          <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid rgba(255,255,255,.14)', borderTopColor: 'var(--primary)', animation: 'spin 1s linear infinite', margin: '24px auto' }} />
        )}

        {error && (
          <div style={{ fontSize: 12.5, fontWeight: 600, color: '#FF9A88', lineHeight: 1.5 }}>
            No se pudo cargar la lista ({error}).
          </div>
        )}

        {!loadingList && !error && couriers.length === 0 && (
          <div style={{ borderRadius: 18, padding: 20, background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.12)' }}>
            <Icon name="person_add" size={24} color="rgba(255,255,255,.6)" />
            <div style={{ fontSize: 13.5, fontWeight: 700, marginTop: 10 }}>Todavía no hay repartidores</div>
            <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,.55)', marginTop: 4, lineHeight: 1.5 }}>
              Pídele al administrador de Domix que registre tu perfil.
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {couriers.map((c) => (
            <button
              key={c.id}
              onClick={() => handleSelect(c.id)}
              disabled={selecting === c.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 13, padding: '13px 15px', borderRadius: 18,
                background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.14)', textAlign: 'left', color: '#fff',
              }}
            >
              <span style={{ width: 42, height: 42, borderRadius: '50%', background: 'rgba(255,255,255,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, flex: 'none' }}>
                {initials(c.first_name, c.last_name)}
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontWeight: 700, fontSize: 14.5 }}>{c.first_name} {c.last_name}</span>
                <span style={{ display: 'block', fontSize: 11.5, color: 'rgba(255,255,255,.5)', marginTop: 2 }}>{c.phone_number}</span>
              </span>
              <Icon name={selecting === c.id ? 'hourglass_top' : 'chevron_right'} size={20} color="rgba(255,255,255,.5)" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
