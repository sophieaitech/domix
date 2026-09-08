import { supabase } from './supabaseClient';

const SERVICE_LABELS = {
  mensajeria: 'Mensajería',
  encomienda: 'Encomienda',
  domicilio: 'Domicilio',
  mandado: 'Mandado',
  autorizacion_medica: 'Autorización médica',
};

export function serviceLabel(type) {
  return SERVICE_LABELS[type] || type;
}

export async function fetchNearbyRequests({ lat, lon, radiusMeters = 5000 }) {
  if (lat != null && lon != null) {
    const { data, error } = await supabase.rpc('nearby_requests_for_courier', {
      courier_lat: lat,
      courier_lon: lon,
      radius_meters: radiusMeters,
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
  const { data, error } = await supabase
    .from('service_requests')
    .update({ courier_id: courierId, status: 'assigned', assigned_at: new Date().toISOString() })
    .eq('id', requestId)
    .eq('status', 'requested')
    .select()
    .maybeSingle();
  return { data, error };
}

export async function updateRequestStatus(requestId, status) {
  const timestamps = {
    picked_up: { picked_up_at: new Date().toISOString() },
    delivered: { delivered_at: new Date().toISOString() },
  };
  const { data, error } = await supabase
    .from('service_requests')
    .update({ status, ...(timestamps[status] || {}) })
    .eq('id', requestId)
    .select()
    .maybeSingle();
  return { data, error };
}

export async function fetchTodayEarnings(courierId) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const { data, error } = await supabase
    .from('service_requests')
    .select('price, tip, delivered_at')
    .eq('courier_id', courierId)
    .eq('status', 'delivered')
    .gte('delivered_at', startOfDay.toISOString());
  if (error) throw error;
  return (data || []).reduce((sum, r) => sum + Number(r.price || 0) + Number(r.tip || 0), 0);
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
