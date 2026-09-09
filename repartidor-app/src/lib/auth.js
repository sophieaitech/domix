import { supabase } from './supabaseClient';

const KEY = 'domix_sesion';

/* Acceso con clave. El hash nunca sale de la base: aquí solo viaja la
   clave escrita y vuelve un sí o un no con el token de sesión. */

export async function iniciarSesion(usuario, clave) {
  const { data, error } = await supabase.rpc('iniciar_sesion', {
    p_usuario: usuario,
    p_clave: clave,
  });
  if (error) return { ok: false, mensaje: 'No hay conexión. Intenta de nuevo.' };

  const r = data?.[0];
  if (!r?.ok) {
    const mensajes = {
      usuario_no_existe: 'No encontramos ese usuario.',
      clave_incorrecta: 'Clave incorrecta.',
      bloqueado: 'Demasiados intentos. Espera 15 minutos.',
      inactivo: 'Esta cuenta está desactivada. Habla con Domix.',
      sin_clave: 'Aún no tienes clave. Pídele una al administrador.',
    };
    return { ok: false, motivo: r?.motivo, mensaje: mensajes[r?.motivo] || 'No se pudo entrar.' };
  }

  const sesion = { token: r.token, id: r.profile_id, nombre: r.nombre, rol: r.rol };
  guardarSesion(sesion);
  return { ok: true, sesion };
}

export function guardarSesion(sesion) {
  try { localStorage.setItem(KEY, JSON.stringify(sesion)); } catch { /* ignorar */ }
}

export function leerSesion() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

/* Se comprueba contra la base, no solo contra lo guardado en el
   dispositivo: una sesión revocada o vencida tiene que dejar de servir. */
export async function validarSesion(token) {
  if (!token) return null;
  const { data, error } = await supabase.rpc('validar_sesion', { p_token: token });
  if (error || !data?.length) return null;
  const r = data[0];
  return { token, id: r.profile_id, nombre: r.nombre, rol: r.rol };
}

export async function cerrarSesion(token) {
  if (token) await supabase.rpc('cerrar_sesion', { p_token: token }).catch(() => {});
  try { localStorage.removeItem(KEY); } catch { /* ignorar */ }
}
