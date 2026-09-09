'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCourierSession } from '../context/CourierSessionProvider';
import { useAppMode } from '../context/AppModeProvider';
import { DEMO_COURIERS } from '../lib/demo';
import ModeSwitch from '../components/ModeSwitch';
import Login from '../components/Login';
import { Icon, Spinner } from '../components/ui';

/* En vivo se entra con clave. En Demo se elige un repartidor de ejemplo,
   porque ahí no hay cuentas reales que proteger. */
export default function EntrarPage() {
  const router = useRouter();
  const { session, loading, selectCourier } = useCourierSession();
  const { isDemo, ready } = useAppMode();
  const [entrando, setEntrando] = useState(null);

  useEffect(() => {
    if (!loading && session) router.replace('/home');
  }, [loading, session, router]);

  const entrarConSesion = async (sesion) => {
    await selectCourier(sesion.id, sesion);
    router.replace('/home');
  };

  if (!ready || loading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spinner />
      </div>
    );
  }

  if (!isDemo) {
    return (
      <>
        <Login
          titulo="App de repartidores"
          subtitulo="Entra con tu celular y la clave que te dio Domix"
          rolesPermitidos={['courier']}
          onEntrar={entrarConSesion}
        />
        <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 950 }}>
          <ModeSwitch compact />
        </div>
      </>
    );
  }

  // --- Modo Demo: repartidores de ejemplo, sin clave ---
  const demo = DEMO_COURIERS.map((c) => ({
    id: c.id, first_name: c.first_name, last_name: c.last_name, phone_number: c.phone_number,
  }));

  const elegirDemo = async (id) => {
    setEntrando(id);
    await selectCourier(id);
    router.replace('/home');
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', background: 'linear-gradient(165deg,#1A4A80 0%,#0B2547 55%,#071A34 100%)', color: '#fff', padding: '0 22px 26px' }}>
      <div style={{ position: 'absolute', right: -80, top: -100, width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle,rgba(245,130,32,.30),transparent 70%)' }} />

      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 22 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/domix-logo-dark-sm.webp" alt="Domix" width={44} height={44} style={{ width: 44, height: 44, objectFit: 'contain' }} />
          <span style={{ font: '600 9px Manrope,sans-serif', letterSpacing: '.12em', color: 'rgba(255,255,255,.5)' }}>
            MENSAJERÍA &amp; LOGÍSTICA
          </span>
        </span>
        <ModeSwitch compact />
      </div>

      <div style={{ position: 'relative', marginTop: 26 }}>
        <div style={{ font: '800 26px/1.14 Manrope,sans-serif', letterSpacing: '-.03em' }}>
          Maneja tu tiempo.<br />Cobra lo que entregas.
        </div>
        <div style={{ marginTop: 9, color: 'rgba(255,255,255,.6)', font: '500 13.5px/1.5 Manrope,sans-serif' }}>
          Estás en modo de prueba: elige un repartidor de ejemplo.
        </div>
      </div>

      <div className="sc" style={{ position: 'relative', flex: 1, marginTop: 22, minHeight: 0 }}>
        <div style={{ font: '600 10.5px Manrope,sans-serif', letterSpacing: '.12em', color: 'rgba(255,255,255,.45)', marginBottom: 10 }}>
          ¿QUIÉN ERES?
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {demo.map((c) => (
            <button
              key={c.id}
              onClick={() => elegirDemo(c.id)}
              disabled={entrando === c.id}
              style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '13px 15px', borderRadius: 18, background: 'rgba(255,255,255,.09)', border: '1px solid rgba(255,255,255,.15)', color: '#fff', textAlign: 'left' }}
            >
              <span style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,.13)', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '800 14.5px Manrope,sans-serif', flex: 'none' }}>
                {((c.first_name?.[0] || 'D') + (c.last_name?.[0] || '')).toUpperCase()}
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', font: '700 14.5px Manrope,sans-serif' }}>{c.first_name} {c.last_name}</span>
                <span style={{ display: 'block', font: '500 11.5px Manrope,sans-serif', color: 'rgba(255,255,255,.55)', marginTop: 2 }}>{c.phone_number}</span>
              </span>
              <Icon name={entrando === c.id ? 'hourglass_top' : 'chevron_right'} size={21} color="rgba(255,255,255,.55)" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
