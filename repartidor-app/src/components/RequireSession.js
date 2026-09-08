'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCourierSession } from '../context/CourierSessionProvider';

export default function RequireSession({ children }) {
  const router = useRouter();
  const { session, loading } = useCourierSession();

  useEffect(() => {
    if (!loading && session === null) router.replace('/');
  }, [loading, session, router]);

  if (loading || !session) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ font: '600 13px Manrope,sans-serif', color: 'var(--mu)' }}>Cargando…</span>
      </div>
    );
  }

  return children;
}
