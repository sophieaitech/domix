'use client';

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAppMode } from './AppModeProvider';
import { buildDemoData, demoCourierProfile, makeIncomingRequest, DEMO_COURIERS } from '../lib/demo';
import { watchPosition } from '../lib/geo';

const KEY = 'domix_courier_id';
const CourierSessionContext = createContext(null);

export function CourierSessionProvider({ children }) {
  const { isDemo, ready: modeReady } = useAppMode();

  const [courierId, setCourierId] = useState(undefined);
  const [profile, setProfile] = useState(null);
  const [courierProfile, setCourierProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [demoRequests, setDemoRequests] = useState([]);
  const positionStop = useRef(null);

  /* ---------- Modo DEMO: perfil y operación simulada ---------- */
  useEffect(() => {
    if (!modeReady || !isDemo) return;
    const stored = (() => { try { return localStorage.getItem(KEY); } catch { return null; } })();
    const id = DEMO_COURIERS.some((c) => c.id === stored) ? stored : null;
    if (id) {
      const { profile: p, courier: c } = demoCourierProfile(id);
      setProfile(p);
      setCourierProfile(c);
      setCourierId(id);
    } else {
      setCourierId(null);
      setProfile(null);
      setCourierProfile(null);
    }
    setDemoRequests(buildDemoData());
    setLoading(false);
  }, [isDemo, modeReady]);

  /* ---------- Modo EN VIVO: datos reales de Supabase ---------- */
  const loadReal = useCallback(async (id) => {
    const [{ data: p }, { data: c }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', id).maybeSingle(),
      supabase.from('courier_profiles').select('*').eq('id', id).maybeSingle(),
    ]);
    setProfile(p || null);
    setCourierProfile(c || null);
  }, []);

  useEffect(() => {
    if (!modeReady || isDemo) return;
    const stored = (() => { try { return localStorage.getItem(KEY); } catch { return null; } })();
    const id = stored && !stored.startsWith('demo-') ? stored : null;
    setCourierId(id);
    if (id) loadReal(id).finally(() => setLoading(false));
    else { setProfile(null); setCourierProfile(null); setLoading(false); }
  }, [isDemo, modeReady, loadReal]);

  const selectCourier = useCallback(async (id) => {
    try { localStorage.setItem(KEY, id); } catch { /* ignorar */ }
    setCourierId(id);
    setLoading(true);
    if (id.startsWith('demo-')) {
      const { profile: p, courier: c } = demoCourierProfile(id);
      setProfile(p);
      setCourierProfile(c);
    } else {
      await loadReal(id);
    }
    setLoading(false);
  }, [loadReal]);

  const setOnlineStatus = useCallback(async (isOnline) => {
    const status = isOnline ? 'online' : 'offline';
    if (isDemo || courierId?.startsWith('demo-')) {
      setCourierProfile((c) => (c ? { ...c, status } : c));
      return { data: { status } };
    }
    const { data, error } = await supabase
      .from('courier_profiles').update({ status }).eq('id', courierId).select().maybeSingle();
    if (!error && data) setCourierProfile(data);
    return { data, error };
  }, [courierId, isDemo]);

  /* Ubicación en vivo: se publica mientras el repartidor está en línea. */
  useEffect(() => {
    const online = courierProfile?.status === 'online' || courierProfile?.status === 'busy';
    if (!online || !courierId) {
      positionStop.current?.();
      positionStop.current = null;
      return;
    }
    positionStop.current = watchPosition(async ({ lat, lon, heading }) => {
      setCourierProfile((c) => (c ? { ...c, last_lat: lat, last_lon: lon } : c));
      if (isDemo || courierId.startsWith('demo-')) return;
      await supabase.from('courier_profiles')
        .update({ last_lat: lat, last_lon: lon, heading: heading ?? null, last_seen_at: new Date().toISOString() })
        .eq('id', courierId);
    });
    return () => { positionStop.current?.(); positionStop.current = null; };
  }, [courierProfile?.status, courierId, isDemo]);

  /* Acciones sobre pedidos simulados (solo en DEMO). */
  const demoAccept = useCallback((id) => {
    setDemoRequests((rows) => rows.map((r) => (r.id === id
      ? { ...r, status: 'assigned', courier_id: courierId, assigned_at: new Date().toISOString() }
      : r)));
  }, [courierId]);

  const demoAdvance = useCallback((id, status) => {
    const stamps = {
      picked_up: { picked_up_at: new Date().toISOString() },
      delivered: { delivered_at: new Date().toISOString() },
    };
    setDemoRequests((rows) => rows.map((r) => (r.id === id ? { ...r, status, ...(stamps[status] || {}) } : r)));
  }, []);

  const demoInject = useCallback((opts) => {
    const req = makeIncomingRequest(opts);
    setDemoRequests((rows) => [req, ...rows]);
    return req;
  }, []);

  const signOut = useCallback(() => {
    try { localStorage.removeItem(KEY); } catch { /* ignorar */ }
    setCourierId(null);
    setProfile(null);
    setCourierProfile(null);
  }, []);

  return (
    <CourierSessionContext.Provider
      value={{
        courierId,
        session: courierId ? { user: { id: courierId } } : courierId === null ? null : undefined,
        profile, courierProfile, loading,
        selectCourier, setOnlineStatus, signOut,
        demoRequests, demoAccept, demoAdvance, demoInject,
        reload: () => (courierId && !courierId.startsWith('demo-') ? loadReal(courierId) : null),
      }}
    >
      {children}
    </CourierSessionContext.Provider>
  );
}

export function useCourierSession() {
  const ctx = useContext(CourierSessionContext);
  if (!ctx) throw new Error('useCourierSession debe usarse dentro de CourierSessionProvider');
  return ctx;
}
