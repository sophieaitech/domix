'use client';

import { useEffect, useState, useCallback } from 'react';
import RequireSession from '../../components/RequireSession';
import BottomNav from '../../components/BottomNav';
import { useCourierSession } from '../../context/CourierSessionProvider';
import { fetchNearbyRequests, fetchTodayEarnings, acceptRequest, serviceLabel } from '../../lib/serviceRequests';

function money(n) {
  return `$${Math.round(n || 0).toLocaleString('es-CO')}`;
}

function HomeContent() {
  const { profile, courierProfile, setOnlineStatus } = useCourierSession();
  const [todayEarnings, setTodayEarnings] = useState(0);
  const [nearby, setNearby] = useState([]);
  const [toggling, setToggling] = useState(false);
  const [loadingList, setLoadingList] = useState(true);

  const isOnline = courierProfile?.status === 'online';

  const refresh = useCallback(async () => {
    if (!courierProfile?.id) return;
    setLoadingList(true);
    try {
      const [earnings, requests] = await Promise.all([
        fetchTodayEarnings(courierProfile.id),
        isOnline ? fetchNearbyRequests({ lat: null, lon: null }) : Promise.resolve([]),
      ]);
      setTodayEarnings(earnings);
      setNearby(requests);
    } catch (e) {
      // silencioso: probablemente Supabase aún no está configurado
    } finally {
      setLoadingList(false);
    }
  }, [courierProfile?.id, isOnline]);

  useEffect(() => { refresh(); }, [refresh]);

  const handleToggle = async () => {
    setToggling(true);
    await setOnlineStatus(!isOnline);
    setToggling(false);
  };

  const handleAccept = async (requestId) => {
    if (!courierProfile?.id) return;
    const { error } = await acceptRequest(requestId, courierProfile.id);
    if (!error) refresh();
  };

  return (
    <div style={{ minHeight: '100dvh', paddingBottom: 90 }}>
      <div style={{ background: 'var(--navy)', color: '#fff', padding: '20px 20px 28px', borderRadius: '0 0 28px 28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ font: '700 16px Manrope,sans-serif' }}>Hola, {profile?.first_name || 'Repartidor'}</div>
        </div>
        <div style={{ marginTop: 18, font: '600 11px Manrope,sans-serif', opacity: 0.75 }}>GANADO HOY</div>
        <div style={{ font: '800 32px Manrope,sans-serif', marginTop: 4 }}>{money(todayEarnings)}</div>

        <button
          onClick={handleToggle}
          disabled={toggling}
          style={{
            marginTop: 18, width: '100%', padding: '12px 16px', borderRadius: 14,
            background: isOnline ? 'var(--green)' : 'rgba(255,255,255,.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 8, font: '700 13px Manrope,sans-serif' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: isOnline ? '#fff' : '#8a93a6' }} />
            {isOnline ? 'Estás en línea' : 'Estás desconectado'}
          </span>
          <span style={{ font: '700 12px Manrope,sans-serif', opacity: 0.9 }}>{toggling ? '…' : isOnline ? 'Desconectar' : 'Conectar'}</span>
        </button>
      </div>

      <div style={{ padding: '20px' }}>
        <div style={{ font: '700 14px Manrope,sans-serif', marginBottom: 12 }}>
          {isOnline ? 'Pedidos cerca de ti' : 'Conéctate para ver pedidos'}
        </div>

        {!isOnline && (
          <div style={{ padding: 24, borderRadius: 16, background: 'var(--sf)', border: '1px solid var(--bd)', textAlign: 'center', color: 'var(--mu)', font: '600 12.5px Manrope,sans-serif' }}>
            Activa el modo en línea para empezar a recibir mensajería, encomiendas y mandados.
          </div>
        )}

        {isOnline && loadingList && (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--mu)', font: '600 12.5px Manrope,sans-serif' }}>Buscando pedidos cerca…</div>
        )}

        {isOnline && !loadingList && nearby.length === 0 && (
          <div style={{ padding: 24, borderRadius: 16, background: 'var(--sf)', border: '1px solid var(--bd)', textAlign: 'center', color: 'var(--mu)', font: '600 12.5px Manrope,sans-serif' }}>
            No hay pedidos disponibles por ahora. Te avisaremos apenas llegue uno.
          </div>
        )}

        {isOnline && nearby.map((req) => (
          <div key={req.id} style={{ padding: 16, borderRadius: 16, background: 'var(--sf)', border: '1px solid var(--bd)', marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ font: '700 12px Manrope,sans-serif', color: 'var(--navy)', background: 'var(--navyS)', padding: '4px 10px', borderRadius: 999 }}>
                {serviceLabel(req.service_type)}
              </span>
              <span style={{ font: '800 15px Manrope,sans-serif' }}>{money(req.price)}</span>
            </div>
            <div style={{ marginTop: 10, font: '600 13px Manrope,sans-serif' }}>{req.pickup_address}</div>
            <div style={{ font: '500 12px Manrope,sans-serif', color: 'var(--mu)' }}>→ {req.dropoff_address}</div>
            <button
              onClick={() => handleAccept(req.id)}
              style={{ marginTop: 12, width: '100%', padding: '10px', borderRadius: 12, background: 'var(--navy)', color: '#fff', font: '700 13px Manrope,sans-serif' }}
            >
              Aceptar pedido
            </button>
          </div>
        ))}
      </div>

      <BottomNav />
    </div>
  );
}

export default function HomePage() {
  return (
    <RequireSession>
      <HomeContent />
    </RequireSession>
  );
}
