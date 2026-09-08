/* ============================================================
   Sedes de Domix. Abrir una ciudad nueva = crear una sede aquí
   (o desde el panel), sin tocar código: cada sede trae su centro
   en el mapa, su cobertura, su WhatsApp y sus reglas de tarifa.
   ============================================================ */

export const CITY_PRESETS = [
  { city: 'Buenaventura', department: 'Valle del Cauca', lat: 3.8801, lon: -77.0312 },
  { city: 'Cali', department: 'Valle del Cauca', lat: 3.4516, lon: -76.532 },
  { city: 'Palmira', department: 'Valle del Cauca', lat: 3.5394, lon: -76.3036 },
  { city: 'Tuluá', department: 'Valle del Cauca', lat: 4.0847, lon: -76.1954 },
  { city: 'Buga', department: 'Valle del Cauca', lat: 3.9006, lon: -76.2978 },
  { city: 'Jamundí', department: 'Valle del Cauca', lat: 3.2611, lon: -76.5389 },
  { city: 'Popayán', department: 'Cauca', lat: 2.4448, lon: -76.6147 },
  { city: 'Tumaco', department: 'Nariño', lat: 1.7986, lon: -78.8156 },
  { city: 'Quibdó', department: 'Chocó', lat: 5.6947, lon: -76.6611 },
  { city: 'Medellín', department: 'Antioquia', lat: 6.2442, lon: -75.5812 },
  { city: 'Bogotá', department: 'Cundinamarca', lat: 4.711, lon: -74.0721 },
  { city: 'Barranquilla', department: 'Atlántico', lat: 10.9685, lon: -74.7813 },
  { city: 'Cartagena', department: 'Bolívar', lat: 10.3910, lon: -75.4794 },
  { city: 'Pereira', department: 'Risaralda', lat: 4.8133, lon: -75.6961 },
  { city: 'Armenia', department: 'Quindío', lat: 4.5339, lon: -75.6811 },
  { city: 'Manizales', department: 'Caldas', lat: 5.0703, lon: -75.5138 },
  { city: 'Pasto', department: 'Nariño', lat: 1.2136, lon: -77.2811 },
  { city: 'Ibagué', department: 'Tolima', lat: 4.4389, lon: -75.2322 },
  { city: 'Neiva', department: 'Huila', lat: 2.9273, lon: -75.2819 },
  { city: 'Villavicencio', department: 'Meta', lat: 4.142, lon: -73.6266 },
  { city: 'Santa Marta', department: 'Magdalena', lat: 11.2408, lon: -74.199 },
  { city: 'Bucaramanga', department: 'Santander', lat: 7.1193, lon: -73.1227 },
  { city: 'Cúcuta', department: 'Norte de Santander', lat: 7.8939, lon: -72.5078 },
];

/* Sede principal por defecto: la que ya opera hoy. */
export const HOME_BRANCH = {
  id: 'buenaventura',
  name: 'Buenaventura',
  city: 'Buenaventura',
  department: 'Valle del Cauca',
  center_lat: 3.8801,
  center_lon: -77.0312,
  coverage_radius_km: 8,
  whatsapp: '573157924906',
  is_active: true,
};

/* Zonas de trabajo sugeridas por ciudad (las de Buenaventura son reales). */
export const ZONES_BY_CITY = {
  Buenaventura: ['Centro', 'El Jorge', 'Pueblo Nuevo', 'Juan XXIII', 'Cristo Rey', 'Bellavista', 'La Independencia'],
};

export function zonesFor(city) {
  return ZONES_BY_CITY[city] || ['Centro', 'Norte', 'Sur', 'Oriente', 'Occidente'];
}

export function findCityPreset(city) {
  return CITY_PRESETS.find((c) => c.city.toLowerCase() === (city || '').toLowerCase()) || null;
}
