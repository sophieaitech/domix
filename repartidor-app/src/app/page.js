'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';
import { useCourierSession } from '../context/CourierSessionProvider';
import { useAppMode } from '../context/AppModeProvider';
import { DEMO_COURIERS } from '../lib/demo';
import ModeSwitch from '../components/ModeSwitch';
import { Icon, Overline, Spinner } from '../components/ui';

export default function ChooseCourierPage() {
  const router = useRouter();
  const { session, loading, selectCourier } = useCourierSession();
  const { isDemo, ready } = useAppMode();
  const [couriers, setCouriers] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [error, setError] = useState('');
  const [selecting, setSelecting] = useState(null);

  useEffect(() => { if (!loading && session) router.replace('/home'); }, [loading, session, router]);

  useEffect(() => {
    if (!ready) return;
    setError('');
    if (isDemo) {
      setCouriers(DEMO_COURIERS.map((c) => ({ id: c.id, first_name: c.first_name, last_name: c.last_name, phone_number: c.phone_number, status: c.status })));
      setLoadingList(false);
      return;
    }
    setLoadingList(true);
    supabase.from('profiles').select('id, first_name, last_name, phone_number').eq('role', 'courier').order('first_name')
      .then(({ data, error }) => {
        if (error) setError(error.message);
        setCouriers(data || []);
        setLoadingList(false);
      });
  }, [isDemo, ready]);

  const pick = async (id) => {
    setSelecting(id);
    await selectCourier(id);
    router.replace('/home');
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', background: 'linear-gradient(165deg,#2A241E 0%,#17140F 55%,#12100D 100%)', color: '#fff', padding: '0 22px 26px' }}>
      <div style={{ position: 'absolute', right: -80, top: -100, width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle,rgba(87,168,47,.32),transparent 70%)' }} />
      <div style={{ position: 'absolute', left: -90, bottom: -70, width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle,rgba(27,79,143,.22),transparent 70%)' }} />

      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 12, paddingTop: 26 }}>
        <span style={{ width: 46, height: 46, borderRadius: 'var(--sh-md)', background: 'linear-gradient(150deg,#57A82F,#43922B)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none', boxShadow: '0 6px 18px rgba(67,146,43,.4)' }}>
          <Icon name="two_wheeler" size={25} fill color="#fff" />
        </span>
        <span style={{ flex: 1 }}>
          <span className="dsp" style={{ display: 'block', fontWeight: 800, fontSize: 21, lineHeight: 1 }}>
            Domi<span style={{ color: '#8CCB6E' }}>X</span>
          </span>
          <Overline style={{ color: 'rgba(255,255,255,.5)', fontSize: 9.5, marginTop: 3 }}>Mensajería &amp; Logística</Overline>
        </span>
        <ModeSwitch compact />
      </div>

      <div style={{ position: 'relative', marginTop: 26 }}>
        <div className="dsp" style={{ fontWeight: 800, fontSize: 27, lineHeight: 1.12 }}>
          Maneja tu tiempo.<br />Cobra lo que entregas.
        </div>
        <div style={{ marginTop: 9, color: 'rgba(255,255,255,.6)', fontSize: 13.5, lineHeight: 1.5 }}>
          Mensajería, encomiendas, domicilios y mandados en Buenaventura.
        </div>
      </div>

      <div className="sc" style={{ position: 'relative', flex: 1, marginTop: 22, minHeight: 0 }}>
        <Overline style={{ color: 'rgba(255,255,255,.45)', marginBottom: 10 }}>¿Quién eres?</Overline>

        {loadingList && <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}><Spinner color="#F79E4E" /></div>}

        {error && <div style={{ fontSize: 12.5, fontWeight: 600, color: '#F0A79A', lineHeight: 1.5 }}>No se pudo cargar la lista ({error}).</div>}

        {!loadingList && !error && couriers.length === 0 && (
          <div style={{ borderRadius: 'var(--sh-lg)', padding: 20, background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.14)' }}>
            <Icon name="person_add" size={26} color="rgba(255,255,255,.65)" />
            <div style={{ fontSize: 14, fontWeight: 700, marginTop: 10 }}>Todavía no hay repartidores</div>
            <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,.55)', marginTop: 4, lineHeight: 1.5 }}>
              Domix debe registrarte desde el panel de la empresa.
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {couriers.map((c) => (
            <button
              key={c.id}
              onClick={() => pick(c.id)}
              disabled={selecting === c.id}
              style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '13px 15px', borderRadius: 'var(--sh-lg)', background: 'rgba(255,255,255,.09)', border: '1px solid rgba(255,255,255,.15)', color: '#fff', textAlign: 'left' }}
            >
              <span style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,.13)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14.5, flex: 'none' }}>
                {((c.first_name?.[0] || 'D') + (c.last_name?.[0] || '')).toUpperCase()}
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontWeight: 700, fontSize: 14.5 }}>{c.first_name} {c.last_name}</span>
                <span style={{ display: 'block', fontSize: 11.5, color: 'rgba(255,255,255,.55)', marginTop: 2 }}>{c.phone_number}</span>
              </span>
              <Icon name={selecting === c.id ? 'hourglass_top' : 'chevron_right'} size={21} color="rgba(255,255,255,.55)" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
