'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

const STORAGE_KEY = 'domix_courier_id';
const CourierSessionContext = createContext(null);

export function CourierSessionProvider({ children }) {
  const [courierId, setCourierId] = useState(undefined); // undefined = cargando, null = sin elegir
  const [profile, setProfile] = useState(null);
  const [courierProfile, setCourierProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadCourierData = useCallback(async (id) => {
    const [{ data: profileData }, { data: courierData }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', id).maybeSingle(),
      supabase.from('courier_profiles').select('*').eq('id', id).maybeSingle(),
    ]);
    setProfile(profileData || null);
    setCourierProfile(courierData || null);
  }, []);

  useEffect(() => {
    const storedId = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    setCourierId(storedId || null);
    if (storedId) loadCourierData(storedId).finally(() => setLoading(false));
    else setLoading(false);
  }, [loadCourierData]);

  const selectCourier = useCallback(async (id) => {
    localStorage.setItem(STORAGE_KEY, id);
    setCourierId(id);
    setLoading(true);
    await loadCourierData(id);
    setLoading(false);
  }, [loadCourierData]);

  const setOnlineStatus = useCallback(async (isOnline) => {
    if (!courierId) return;
    const status = isOnline ? 'online' : 'offline';
    const { data, error } = await supabase
      .from('courier_profiles')
      .update({ status })
      .eq('id', courierId)
      .select()
      .maybeSingle();
    if (!error && data) setCourierProfile(data);
    return { data, error };
  }, [courierId]);

  const signOut = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setCourierId(null);
    setProfile(null);
    setCourierProfile(null);
  }, []);

  return (
    <CourierSessionContext.Provider
      value={{
        courierId,
        session: courierId ? { user: { id: courierId } } : courierId === null ? null : undefined,
        profile,
        courierProfile,
        loading,
        selectCourier,
        setOnlineStatus,
        signOut,
        reload: () => courierId && loadCourierData(courierId),
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
