/* ============================================================
   Modo DEMO de Domix
   Genera operación simulada (pedidos, historial, métricas, flota)
   para poder mostrar y probar el sistema sin datos reales.
   En modo EN VIVO nada de esto se usa: solo Supabase.
   ============================================================ */

import { BUENAVENTURA } from './geo';

const NOMBRES = ['María Rentería', 'Jorge Moreno', 'Luisa Angulo', 'Carlos Valencia', 'Yeimi Caicedo', 'Andrés Riascos', 'Paola Mosquera', 'Deiver Grueso', 'Sandra Balanta', 'Wilmar Possu'];

const ORIGENES = [
  { label: 'Droguería La Salud, Centro', lat: 3.8836, lon: -77.0225 },
  { label: 'Supermercado La Bahía, El Jorge', lat: 3.8792, lon: -77.0338 },
  { label: 'Asadero El Puerto, Centro', lat: 3.8858, lon: -77.0281 },
  { label: 'EPS Comfandi, Av. Simón Bolívar', lat: 3.8703, lon: -77.0561 },
  { label: 'Almacén El Faro, Pueblo Nuevo', lat: 3.8925, lon: -77.0189 },
  { label: 'Variedades La 5ª, Centro', lat: 3.8871, lon: -77.0244 },
];

const DESTINOS = [
  { label: 'Cra 5 #12-45, Barrio El Jorge', lat: 3.8768, lon: -77.0402 },
  { label: 'Calle 8 #3-22, Juan XXIII', lat: 3.8951, lon: -77.0118 },
  { label: 'Barrio Nayita, Mz 4 Casa 12', lat: 3.8664, lon: -77.0489 },
  { label: 'Cra 40 #21-08, Cristo Rey', lat: 3.8598, lon: -77.0623 },
  { label: 'Calle 2 #1-40, Bellavista', lat: 3.8887, lon: -77.0355 },
  { label: 'Av. Simón Bolívar Km 3, La Independencia', lat: 3.8721, lon: -77.0688 },
];

const SERVICIOS = ['mensajeria', 'encomienda', 'domicilio', 'mandado', 'autorizacion_medica'];

export const DEMO_COURIERS = [
  { id: 'demo-c1', first_name: 'Yeison', last_name: 'Mosquera', phone_number: '+573157924906', status: 'online', work_zone: 'Centro', rating: 4.9, total_deliveries: 1284, payout_account: 'Nequi *** 7741', lat: 3.8845, lon: -77.0262, vehicle: 'Moto WQR-18C' },
  { id: 'demo-c2', first_name: 'Deiver', last_name: 'Grueso', phone_number: '+573156642210', status: 'online', work_zone: 'El Jorge', rating: 4.8, total_deliveries: 942, payout_account: 'Nequi *** 3390', lat: 3.8779, lon: -77.0371, vehicle: 'Moto KLM-92D' },
  { id: 'demo-c3', first_name: 'Wilmar', last_name: 'Possu', phone_number: '+573145583120', status: 'busy', work_zone: 'Centro', rating: 4.7, total_deliveries: 613, payout_account: 'Bancolombia *** 1180', lat: 3.8902, lon: -77.0208, vehicle: 'Moto TRX-44A' },
  { id: 'demo-c4', first_name: 'Sandra', last_name: 'Balanta', phone_number: '+573112287740', status: 'offline', work_zone: 'Pueblo Nuevo', rating: 5.0, total_deliveries: 388, payout_account: 'Nequi *** 5502', lat: 3.8931, lon: -77.0175, vehicle: 'Moto PLQ-77B' },
];

const rand = (n) => Math.floor(Math.random() * n);
const pick = (arr) => arr[rand(arr.length)];

function code() {
  return Math.random().toString(16).slice(2, 10);
}

function makeRequest({ status, minutesAgo, courierId = null, turbo = false }) {
  const origen = pick(ORIGENES);
  const destino = pick(DESTINOS);
  const created = new Date(Date.now() - minutesAgo * 60000);
  const price = 6000 + rand(9) * 800 + (turbo ? 3500 : 0);
  const delivered = status === 'delivered';
  return {
    id: `demo-${Math.random().toString(36).slice(2, 10)}`,
    tracking_code: code(),
    service_type: pick(SERVICIOS),
    status,
    contact_name: pick(NOMBRES),
    contact_phone: `31${rand(9)}${String(rand(9999999)).padStart(7, '0')}`,
    pickup_address: origen.label,
    dropoff_address: destino.label,
    pickup_point: { lat: origen.lat, lon: origen.lon },
    dropoff_point: { lat: destino.lat, lon: destino.lon },
    price,
    tip: Math.random() > 0.6 ? [1000, 2000, 3000][rand(3)] : 0,
    turbo,
    courier_id: courierId,
    source: pick(['app', 'whatsapp', 'admin']),
    created_at: created.toISOString(),
    assigned_at: status !== 'requested' ? new Date(created.getTime() + 120000).toISOString() : null,
    picked_up_at: ['picked_up', 'in_progress', 'delivered'].includes(status) ? new Date(created.getTime() + 420000).toISOString() : null,
    delivered_at: delivered ? new Date(created.getTime() + 1500000).toISOString() : null,
    is_demo: true,
  };
}

/* Operación completa simulada: historial de 7 días + pedidos vivos. */
export function buildDemoData() {
  const rows = [];

  // Historial de la semana (entregados)
  for (let d = 6; d >= 0; d--) {
    const cantidad = d === 0 ? 9 : 8 + rand(9);
    for (let i = 0; i < cantidad; i++) {
      const minutesAgo = d * 1440 + 60 + rand(700);
      rows.push({ ...makeRequest({ status: 'delivered', minutesAgo, courierId: pick(DEMO_COURIERS).id, turbo: Math.random() > 0.78 }) });
    }
  }

  // Pedidos activos ahora mismo
  rows.push(makeRequest({ status: 'in_progress', minutesAgo: 14, courierId: 'demo-c1' }));
  rows.push(makeRequest({ status: 'picked_up', minutesAgo: 9, courierId: 'demo-c3', turbo: true }));
  rows.push(makeRequest({ status: 'assigned', minutesAgo: 5, courierId: 'demo-c2' }));
  rows.push(makeRequest({ status: 'requested', minutesAgo: 2 }));
  rows.push(makeRequest({ status: 'requested', minutesAgo: 1, turbo: true }));

  return rows.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

/* Un pedido entrante nuevo, para el botón "simular pedido". */
export function makeIncomingRequest({ turbo = false } = {}) {
  return makeRequest({ status: 'requested', minutesAgo: 0, turbo });
}

export function demoCourierProfile(id = 'demo-c1') {
  const c = DEMO_COURIERS.find((x) => x.id === id) || DEMO_COURIERS[0];
  return {
    profile: { id: c.id, first_name: c.first_name, last_name: c.last_name, phone_number: c.phone_number, role: 'courier' },
    courier: {
      id: c.id, status: c.status, work_zone: c.work_zone, rating: c.rating,
      total_deliveries: c.total_deliveries, payout_account: c.payout_account,
      preferred_schedule: '11 a.m. – 9 p.m.',
    },
  };
}

export const DEMO_DOCS = [
  { doc_type: 'cedula', status: 'approved' },
  { doc_type: 'licencia', status: 'approved' },
  { doc_type: 'soat', status: 'expiring_soon', expires_at: '2026-09-14' },
  { doc_type: 'tarjeta_propiedad', status: 'approved' },
];

export const DEMO_VEHICLE = { vehicle_type: 'moto', plate: 'WQR-18C', model: 'Bajaj Boxer 150', is_active: true };

export { BUENAVENTURA };
