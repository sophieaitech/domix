'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import Login from '../components/Login';
import { leerSesion, validarSesion, cerrarSesion } from '../lib/auth';

const AuthContext = createContext(null);

const ROLES_PANEL = ['admin', 'despachador'];

/* Puerta del panel: sin sesión válida no se ve nada de la operación.
   La sesión guardada se revalida contra la base en cada arranque, para
   que una cuenta desactivada deje de entrar aunque el token siga en el
   dispositivo. */
export function AuthProvider({ children }) {
  const [sesion, setSesion] = useState(null);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    let vivo = true;
    (async () => {
      const guardada = leerSesion();
      const valida = guardada ? await validarSesion(guardada.token) : null;
      if (!vivo) return;
      setSesion(valida && ROLES_PANEL.includes(valida.rol) ? valida : null);
      setListo(true);
    })();
    return () => { vivo = false; };
  }, []);

  const salir = useCallback(async () => {
    await cerrarSesion(sesion?.token);
    setSesion(null);
  }, [sesion?.token]);

  if (!listo) {
    return <div style={{ position: 'fixed', inset: 0, background: '#0a0a0a' }} />;
  }

  if (!sesion) {
    return (
      <Login
        titulo="Panel de Domix"
        subtitulo="Solo para el equipo de operaciones"
        rolesPermitidos={ROLES_PANEL}
        onEntrar={setSesion}
      />
    );
  }

  return (
    <AuthContext.Provider value={{ sesion, salir }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
