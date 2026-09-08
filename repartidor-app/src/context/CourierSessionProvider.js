'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

const CourierSessionContext = createContext(null);

export function CourierSessionProvider({ children }) {
  const [session, setSession] = useState(undefined); // undefined = cargando, null = sin sesion
  const [profile, setProfile] = useState(null);
  const [courierProfile, setCourierProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadCourierData = useCallback(async (userId) => {
    const [{ data: profileData }, { data: courierData }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
      supabase.from('courier_profiles').select('*').eq('id', userId).maybeSingle(),
    ]);
    setProfile(profileData || null);
    setCourierProfile(courierData || null);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
      if (data.session?.user?.id) loadCourierData(data.session.user.id);
      else setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession?.user?.id) loadCourierData(newSession.user.id);
      else {
        setProfile(null);
        setCourierProfile(null);
      }
    });

    return () => sub.subscription.unsubscribe();
  }, [loadCourierData]);

  useEffect(() => {
    if (profile !== null || courierProfile !== null) setLoading(false);
    else if (session === null) setLoading(false);
  }, [profile, courierProfile, session]);

  const setOnlineStatus = useCallback(async (isOnline) => {
    if (!session?.user?.id) return;
    const status = isOnline ? 'online' : 'offline';
    const { data, error } = await supabase
      .from('courier_profiles')
      .update({ status })
      .eq('id', session.user.id)
      .select()
      .maybeSingle();
    if (!error && data) setCourierProfile(data);
    return { data, error };
  }, [session]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return (
    <CourierSessionContext.Provider
      value={{ session, profile, courierProfile, loading, setOnlineStatus, signOut, reload: () => session?.user?.id && loadCourierData(session.user.id) }}
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
