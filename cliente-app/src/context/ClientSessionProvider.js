'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';

const KEY = 'domix_cliente';
const ClientSessionContext = createContext(null);

/* Sin cuentas ni login: solo recordamos nombre y celular en el propio
   dispositivo para no volver a pedirlos y poder listar "mis pedidos". */
export function ClientSessionProvider({ children }) {
  const [client, setClient] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setClient(JSON.parse(raw));
    } catch { /* almacenamiento no disponible */ }
    setReady(true);
  }, []);

  const saveClient = useCallback((data) => {
    setClient(data);
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { /* ignorar */ }
  }, []);

  const clearClient = useCallback(() => {
    setClient(null);
    try { localStorage.removeItem(KEY); } catch { /* ignorar */ }
  }, []);

  return (
    <ClientSessionContext.Provider value={{ client, ready, saveClient, clearClient }}>
      {children}
    </ClientSessionContext.Provider>
  );
}

export function useClientSession() {
  const ctx = useContext(ClientSessionContext);
  if (!ctx) throw new Error('useClientSession debe usarse dentro de ClientSessionProvider');
  return ctx;
}
