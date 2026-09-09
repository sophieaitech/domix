import { supabase } from './supabaseClient';

/* Documentos, vehículo y retiros del repartidor.

   Todo lo que toca plata pasa por funciones de la base de datos: el
   monto disponible se calcula allá y allá se rechaza lo que no cuadre.
   Aquí no se valida nada de eso, porque cualquiera puede abrir el
   teléfono y cambiar lo que quiera. */

export const DOCS = [
  { type: 'cedula', label: 'Cédula', icon: 'badge', ayuda: 'Foto de la cédula por el lado de la foto.', vence: false },
  { type: 'licencia', label: 'Licencia de conducción', icon: 'directions_car', ayuda: 'Vigente y de la categoría de tu vehículo.', vence: true },
  { type: 'soat', label: 'SOAT', icon: 'health_and_safety', ayuda: 'Sin SOAT vigente no puedes rodar.', vence: true },
  { type: 'tarjeta_propiedad', label: 'Tarjeta de propiedad', icon: 'description', ayuda: 'La del vehículo con el que trabajas.', vence: false },
];

export const DOC_STATUS = {
  approved: { label: 'Aprobada', color: 'var(--secondary)', icon: 'check_circle' },
  pending: { label: 'En revisión', color: 'var(--on-surface-variant)', icon: 'schedule' },
  expiring_soon: { label: 'Vence pronto', color: 'var(--tertiary)', icon: 'error' },
  rejected: { label: 'Rechazada', color: 'var(--error)', icon: 'cancel' },
  falta: { label: 'Falta', color: 'var(--outline)', icon: 'add_circle' },
};

export const VEHICULOS = [
  { id: 'moto', label: 'Moto', icon: 'two_wheeler', placa: true },
  { id: 'carro', label: 'Carro', icon: 'directions_car', placa: true },
  { id: 'bicicleta', label: 'Bicicleta', icon: 'pedal_bike', placa: false },
  { id: 'a_pie', label: 'A pie', icon: 'directions_walk', placa: false },
];

export const METODOS_RETIRO = [
  { id: 'nequi', label: 'Nequi', icon: 'smartphone', pista: 'Tu número de Nequi' },
  { id: 'daviplata', label: 'Daviplata', icon: 'smartphone', pista: 'Tu número de Daviplata' },
  { id: 'bancolombia', label: 'Bancolombia', icon: 'account_balance', pista: 'Número de cuenta' },
  { id: 'efectivo', label: 'Efectivo en sede', icon: 'payments', pista: 'A quién se le entrega' },
];

export const dinero = (n) => `$${Math.round(Number(n) || 0).toLocaleString('es-CO')}`;

/* ---------- Documentos ---------- */

export async function fetchDocumentos(courierId) {
  const { data } = await supabase.from('courier_documents').select('*').eq('courier_id', courierId);
  return data || [];
}

/* El archivo va a un balde privado, en una carpeta por repartidor. El
   nombre lleva la hora para que subir de nuevo no pise el anterior. */
export async function subirDocumento(courierId, docType, file, venceEl) {
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const ruta = `${courierId}/${docType}-${Date.now()}.${ext}`;

  const { error: errSubida } = await supabase.storage
    .from('documentos')
    .upload(ruta, file, { cacheControl: '3600', upsert: false, contentType: file.type || undefined });

  if (errSubida) return { ok: false, mensaje: errSubida.message || 'No pudimos subir el archivo.' };

  const { data, error } = await supabase.rpc('registrar_documento', {
    p_courier_id: courierId,
    p_doc_type: docType,
    p_path: ruta,
    p_expires_at: venceEl || null,
  });

  if (error) return { ok: false, mensaje: error.message || 'No pudimos guardar el documento.' };
  return { ok: true, documento: Array.isArray(data) ? data[0] : data };
}

/* Los documentos no son públicos: se miran con un enlace que caduca. */
export async function enlaceDocumento(path, segundos = 120) {
  if (!path) return null;
  const { data } = await supabase.storage.from('documentos').createSignedUrl(path, segundos);
  return data?.signedUrl || null;
}

/* ---------- Vehículo ---------- */

export async function fetchVehiculo(courierId) {
  const { data } = await supabase
    .from('vehicles').select('*')
    .eq('courier_id', courierId).eq('is_active', true)
    .maybeSingle();
  return data || null;
}

export async function guardarVehiculo(courierId, { tipo, placa, modelo, color, year }) {
  const { data, error } = await supabase.rpc('guardar_vehiculo', {
    p_courier_id: courierId,
    p_tipo: tipo,
    p_placa: placa || null,
    p_modelo: modelo || null,
    p_color: color || null,
    p_year: year ? Number(year) : null,
  });
  if (error) return { ok: false, mensaje: limpiarError(error.message) };
  return { ok: true, vehiculo: Array.isArray(data) ? data[0] : data };
}

/* ---------- Plata ---------- */

export async function fetchSaldo(courierId) {
  const { data, error } = await supabase.rpc('saldo_repartidor', { p_courier_id: courierId });
  if (error) return { ganado: 0, retirado: 0, pendiente: 0, disponible: 0, entregas: 0 };
  const s = Array.isArray(data) ? data[0] : data;
  return {
    ganado: Number(s?.ganado || 0),
    retirado: Number(s?.retirado || 0),
    pendiente: Number(s?.pendiente || 0),
    disponible: Number(s?.disponible || 0),
    entregas: Number(s?.entregas || 0),
  };
}

export async function fetchRetiros(courierId, limite = 10) {
  const { data } = await supabase
    .from('payouts').select('*')
    .eq('courier_id', courierId)
    .order('requested_at', { ascending: false })
    .limit(limite);
  return data || [];
}

export async function solicitarRetiro(courierId, monto, metodo, cuenta) {
  const { data, error } = await supabase.rpc('solicitar_retiro', {
    p_courier_id: courierId,
    p_monto: monto,
    p_metodo: metodo || null,
    p_cuenta: cuenta || null,
  });
  if (error) return { ok: false, mensaje: limpiarError(error.message) };
  const r = Array.isArray(data) ? data[0] : data;
  return { ok: !!r?.ok, mensaje: r?.motivo || '', disponible: Number(r?.disponible || 0) };
}

export async function guardarCuentaRetiro(courierId, metodo, cuenta) {
  const { data, error } = await supabase.rpc('guardar_cuenta_retiro', {
    p_courier_id: courierId,
    p_metodo: metodo,
    p_cuenta: cuenta,
  });
  if (error) return { ok: false, mensaje: limpiarError(error.message) };
  return { ok: true, perfil: Array.isArray(data) ? data[0] : data };
}

export const ESTADO_RETIRO = {
  pending: { label: 'En camino a tu cuenta', color: 'var(--tertiary)', icon: 'schedule' },
  paid: { label: 'Consignado', color: 'var(--secondary)', icon: 'check_circle' },
  rejected: { label: 'Negado', color: 'var(--error)', icon: 'cancel' },
  failed: { label: 'Falló la consignación', color: 'var(--error)', icon: 'error' },
};

/* Postgres antepone su propio prefijo a las excepciones. El repartidor
   no tiene por qué leer eso. */
function limpiarError(msg = '') {
  return msg.replace(/^.*?(?:ERROR|error):\s*/, '').trim() || 'Algo salió mal. Intenta de nuevo.';
}
