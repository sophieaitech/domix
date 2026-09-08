'use client';

import { useEffect, useState, useCallback } from 'react';
import RequireSession from '../../components/RequireSession';
import BottomNav from '../../components/BottomNav';
import Icon from '../../components/Icon';
import { useCourierSession } from '../../context/CourierSessionProvider';
import { fetchNearbyRequests, fetchTodayEarnings, fetchCourierDeliveries, acceptRequest, serviceLabel } from '../../lib/serviceRequests';

function money(n) {
  return `$${Math.round(n || 0).toLocaleString('es-CO')}`;
}

function initials(profile) {
  const a = profile?.first_name?.[0] || 'D';
  const b = profile?.last_name?.[0] || '';
  return (a + b).toUpperCase();
}

function HomeContent() {
  const { profile, courierProfile, setOnlineStatus } = useCourierSession();
  const [todayEarnings, setTodayEarnings] = useState(0);
  const [todayCount, setTodayCount] = useState(0);
  const [nearby, setNearby] = useState([]);
  const [toggling, setToggling] = useState(false);
  const [loadingList, setLoadingList] = useState(true);

  const isOnline = courierProfile?.status === 'online';

  const refresh = useCallback(async () => {
    if (!courierProfile?.id) return;
    setLoadingList(true);
    try {
      const [earnings, deliveries, requests] = await Promise.all([
        fetchTodayEarnings(courierProfile.id),
        fetchCourierDeliveries(courierProfile.id),
        isOnline ? fetchNearbyRequests({ lat: null, lon: null }) : Promise.resolve([]),
      ]);
      setTodayEarnings(earnings);
      const today = new Date().toDateString();
      setTodayCount(deliveries.filter((d) => d.status === 'delivered' && new Date(d.delivered_at).toDateString() === today).length);
      setNearby(requests);
    } catch {
      // Supabase sin configurar o sin red: se mantienen los valores en cero.
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

  const stats = [
    { icon: 'payments', color: 'var(--green)', value: money(todayEarnings), label: 'Ganado hoy' },
    { icon: 'check_circle', color: 'var(--blue)', value: todayCount, label: 'Entregas' },
    { icon: 'star', color: 'var(--amber)', value: Number(courierProfile?.rating || 5).toFixed(1), label: 'Calificación' },
  ];

  return (
    <>
      <div style={{ flex: 'none', padding: '18px 20px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, color: 'var(--muted)', flex: 'none' }}>
            {initials(profile)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="dsp" style={{ fontWeight: 700, fontSize: 18 }}>Hola, {profile?.first_name || 'Repartidor'}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--muted)', fontWeight: 600, marginTop: 1 }}>
              <Icon name="star" size={14} fill color="var(--amber)" />
              {Number(courierProfile?.rating || 5).toFixed(1)} · Zona {courierProfile?.work_zone || 'Centro'}
            </div>
          </div>
        </div>
      </div>

      <div className="sc" style={{ flex: 1, overflowY: 'auto', padding: '6px 20px 108px' }}>
        <div style={{ borderRadius: 28, padding: 20, background: 'linear-gradient(145deg,#1B355C 0%,#0C1A31 64%)', color: '#fff', boxShadow: '0 18px 44px rgba(12,26,49,.28)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: -44, top: -54, width: 190, height: 190, borderRadius: '50%', background: 'radial-gradient(circle,rgba(245,130,32,.36),rgba(245,130,32,0) 70%)' }} />
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '.09em', color: 'rgba(255,255,255,.5)' }}>GANADO HOY</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, height: 26, padding: '0 11px', borderRadius: 999, background: 'rgba(255,255,255,.1)', fontSize: 10.5, fontWeight: 800, letterSpacing: '.04em', color: '#9FD98A' }}>
              <Icon name="two_wheeler" size={14} />
              {(courierProfile?.total_deliveries || 0)} entregas
            </span>
          </div>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 7 }}>
            <span className="dsp" style={{ fontWeight: 800, fontSize: 38, letterSpacing: '-.03em' }}>{money(todayEarnings)}</span>
          </div>

          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 12, marginTop: 18, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,.1)' }}>
            <span style={{ width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none', background: isOnline ? 'rgba(87,166,57,.22)' : 'rgba(255,255,255,.1)' }}>
              <Icon name={isOnline ? 'bolt' : 'bedtime'} size={19} fill color={isOnline ? '#8FD46E' : 'rgba(255,255,255,.6)'} />
            </span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: 'block', fontSize: 14.5, fontWeight: 800 }}>{isOnline ? 'Estás en línea' : 'Estás desconectado'}</span>
              <span style={{ display: 'block', fontSize: 11.5, color: 'rgba(255,255,255,.5)', marginTop: 1 }}>
                {isOnline ? `Recibiendo pedidos en zona ${courierProfile?.work_zone || 'Centro'}` : 'Conéctate para recibir pedidos'}
              </span>
            </span>
            <button
              onClick={handleToggle}
              disabled={toggling}
              style={{ width: 54, height: 31, borderRadius: 99, padding: 3, display: 'flex', flex: 'none', background: isOnline ? 'var(--green)' : 'rgba(255,255,255,.22)' }}
            >
              <span style={{ width: 25, height: 25, borderRadius: '50%', background: '#fff', transition: 'transform .22s cubic-bezier(.32,.72,0,1)', transform: isOnline ? 'translateX(23px)' : 'translateX(0)' }} />
            </button>
          </div>
        </div>

        {isOnline && nearby.map((req) => (
          <div key={req.id} style={{ marginTop: 14, background: 'var(--surface)', border: '1.5px solid var(--primary)', borderRadius: 20, overflow: 'hidden', boxShadow: '0 12px 34px rgba(245,130,32,.16)', animation: 'pop .22s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 16px', background: 'linear-gradient(90deg,#FDF1E6,#FFF9F4)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, fontWeight: 800, color: 'var(--primary)', letterSpacing: '.04em' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)', animation: 'glow 1s infinite' }} />
                NUEVO PEDIDO
              </span>
              <span style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--muted)' }}>{serviceLabel(req.service_type)}</span>
            </div>
            <div style={{ padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 9 }}>
                <span className="dsp" style={{ fontWeight: 800, fontSize: 30 }}>{money(req.price)}</span>
                {Number(req.tip) > 0 && (
                  <span style={{ fontSize: 12.5, color: 'var(--green)', fontWeight: 800 }}>+{money(req.tip)} propina</span>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', marginTop: 16 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 'none', paddingTop: 3 }}>
                    <span style={{ width: 11, height: 11, borderRadius: '50%', background: 'var(--text)' }} />
                    <span style={{ width: 2, height: 34, background: 'var(--border)' }} />
                  </span>
                  <span style={{ flex: 1, minWidth: 0, paddingBottom: 14 }}>
                    <span style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--muted)', letterSpacing: '.05em' }}>RECOGER EN</span>
                    <span style={{ display: 'block', fontSize: 14, fontWeight: 700, marginTop: 2 }}>{req.pickup_address}</span>
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <span style={{ width: 11, height: 11, borderRadius: '50%', background: 'var(--primary)', flex: 'none', marginTop: 3 }} />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--muted)', letterSpacing: '.05em' }}>ENTREGAR EN</span>
                    <span style={{ display: 'block', fontSize: 14, fontWeight: 700, marginTop: 2 }}>{req.dropoff_address}</span>
                    {req.contact_name && <span style={{ display: 'block', fontSize: 12, color: 'var(--muted)', marginTop: 1 }}>{req.contact_name} · {req.contact_phone}</span>}
                  </span>
                </div>
              </div>

              <button
                onClick={() => handleAccept(req.id)}
                style={{ width: '100%', height: 52, borderRadius: 16, background: 'var(--primary)', color: '#fff', fontWeight: 700, fontSize: 15.5, marginTop: 18, boxShadow: '0 10px 24px rgba(245,130,32,.32)' }}
              >
                Aceptar pedido
              </button>
            </div>
          </div>
        ))}

        {isOnline && !loadingList && nearby.length === 0 && (
          <div style={{ marginTop: 14, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: '30px 20px', textAlign: 'center', boxShadow: 'var(--shadowSm)' }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', border: '3px solid var(--surface2)', borderTopColor: 'var(--primary)', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
            <div className="dsp" style={{ fontWeight: 700, fontSize: 17, marginTop: 16 }}>Buscando pedidos cerca</div>
            <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5, marginTop: 5 }}>
              Estás en zona {courierProfile?.work_zone || 'Centro'}. Te avisamos apenas llegue uno.
            </div>
          </div>
        )}

        {!isOnline && (
          <div style={{ marginTop: 14, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: '30px 20px', textAlign: 'center', boxShadow: 'var(--shadowSm)' }}>
            <span style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
              <Icon name="bedtime" size={26} color="var(--faint)" />
            </span>
            <div className="dsp" style={{ fontWeight: 700, fontSize: 17, marginTop: 16 }}>Estás desconectado</div>
            <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5, marginTop: 5 }}>Conéctate para empezar a recibir pedidos.</div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 11, marginTop: 16 }}>
          {stats.map((s) => (
            <div key={s.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, padding: 15, boxShadow: 'var(--shadowSm)' }}>
              <Icon name={s.icon} size={20} fill color={s.color} />
              <div className="dsp" style={{ fontWeight: 800, fontSize: 19, marginTop: 9 }}>{s.value}</div>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--muted)', marginTop: 3 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <BottomNav />
    </>
  );
}

export default function HomePage() {
  return (
    <RequireSession>
      <HomeContent />
    </RequireSession>
  );
}
