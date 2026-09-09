import { supabase } from './supabaseClient';

const SERVICE_LABELS = {
  mensajeria: 'Mensajería',
  encomienda: 'Encomienda',
  domicilio: 'Domicilio',
  mandado: 'Mandado',
  autorizacion_medica: 'Autorización médica',
};

export const SERVICE_ICON = {
  mensajeria: 'mail',
  encomienda: 'inventory_2',
  domicilio: 'moped',
  mandado: 'shopping_bag',
  autorizacion_medica: 'medical_information',
};

export function serviceLabel(type) {
  return SERVICE_LABELS[type] || type;
}

export async function fetchNearbyRequests({ lat, lon, radiusMeters = 5000 } = {}) {
  if (lat != null && lon != null) {
    const { data, error } = await supabase.rpc('nearby_requests_for_courier', {
      courier_lat: lat, courier_lon: lon, radius_meters: radiusMeters,
    });
    if (!error) return data || [];
  }
  const { data, error } = await supabase
    .from('service_requests')
    .select('*')
    .eq('status', 'requested')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function fetchCourierDeliveries(courierId) {
  const { data, error } = await supabase
    .from('service_requests')
    .select('*')
    .eq('courier_id', courierId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function acceptRequest(requestId, courierId) {
  return supabase
    .from('service_requests')
    .update({ courier_id: courierId, status: 'assigned', assigned_at: new Date().toISOString() })
    .eq('id', requestId)
    .eq('status', 'requested')
    .select()
    .maybeSingle();
}

export async function updateRequestStatus(requestId, status) {
  const stamps = {
    picked_up: { picked_up_at: new Date().toISOString() },
    delivered: { delivered_at: new Date().toISOString() },
  };
  return supabase
    .from('service_requests')
    .update({ status, ...(stamps[status] || {}) })
    .eq('id', requestId)
    .select()
    .maybeSingle();
}

/* La entrega se cierra con el PIN que el cliente dicta. El repartidor
   nunca puede leer el PIN: solo mandarlo a verificar. */
export async function confirmDelivery(requestId, pin) {
  const { data, error } = await supabase.rpc('confirm_delivery', {
    p_request_id: requestId,
    p_pin: String(pin),
  });
  if (error) return { ok: false, motivo: 'error_red', mensaje: error.message };

  const r = data?.[0] || {};
  const mensajes = {
    entregado: '¡Entrega confirmada!',
    ya_entregado: 'Este pedido ya estaba entregado.',
    pin_incorrecto: `Código incorrecto. Intento ${r.intentos} de 5.`,
    bloqueado: 'Demasiados intentos. Pide ayuda a Domix para cerrarlo.',
    pedido_no_encontrado: 'No encontramos este pedido.',
  };
  return { ok: !!r.ok, motivo: r.motivo, intentos: r.intentos, mensaje: mensajes[r.motivo] || 'No se pudo confirmar.' };
}

export async function fetchTodayEarnings(courierId) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const { data, error } = await supabase
    .from('service_requests')
    .select('price, tip')
    .eq('courier_id', courierId)
    .eq('status', 'delivered')
    .gte('delivered_at', start.toISOString());
  if (error) throw error;
  return (data || []).reduce((s, r) => s + Number(r.price || 0) + Number(r.tip || 0), 0);
}

export async function fetchWeekEarnings(courierId) {
  const start = new Date();
  start.setDate(start.getDate() - 6);
  start.setHours(0, 0, 0, 0);
  const { data, error } = await supabase
    .from('service_requests')
    .select('id, service_type, price, tip, delivered_at')
    .eq('courier_id', courierId)
    .eq('status', 'delivered')
    .gte('delivered_at', start.toISOString())
    .order('delivered_at', { ascending: false });
  if (error) throw error;
  return data || [];
}
