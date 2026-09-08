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
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 42, height: 42, borderRadius: '50%', border: '3px solid var(--surface2)', borderTopColor: 'var(--primary)', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  return children;
}
