/* ============================================================
   Lugares de Buenaventura
   ------------------------------------------------------------
   OpenStreetMap no tiene mapeada toda la ciudad: barrios donde
   Domix trabaja todos los días, como El Jorge o Cristo Rey, no
   aparecen en ninguna búsqueda. Este listado los complementa.

   Las coordenadas de abajo vienen de OpenStreetMap y están
   verificadas. Los barrios que OSM no conoce NO están aquí con
   coordenadas inventadas: para esos, el cliente marca el punto
   en el mapa (ver AddressField), que es más preciso que un
   centro de barrio aproximado.
   ============================================================ */

export const LUGARES_BUENAVENTURA = [
  // --- Barrios y sectores ---
  { nombre: 'Centro', tipo: 'barrio', lat: 3.88840, lon: -77.07712 },
  { nombre: 'Pueblo Nuevo', tipo: 'barrio', lat: 3.88339, lon: -77.07487 },
  { nombre: 'Juan XXIII', tipo: 'barrio', lat: 3.87746, lon: -77.03149 },
  { nombre: 'Bellavista', tipo: 'barrio', lat: 3.88097, lon: -77.02290 },
  { nombre: 'La Independencia', tipo: 'barrio', lat: 3.87543, lon: -77.00015 },
  { nombre: 'El Piñal', tipo: 'barrio', lat: 3.88305, lon: -77.05573 },
  { nombre: 'La Playita', tipo: 'barrio', lat: 3.87760, lon: -77.06668 },
  { nombre: 'Isla Cascajal', tipo: 'sector', lat: 3.88338, lon: -77.06607 },
  { nombre: 'El Pailón', tipo: 'sector', lat: 3.86540, lon: -76.99613 },

  // --- Puntos de referencia ---
  { nombre: 'Terminal Marítimo', tipo: 'referencia', lat: 3.88918, lon: -77.07998 },
  { nombre: 'Terminal de Transportes', tipo: 'referencia', lat: 3.89015, lon: -77.07366 },
  { nombre: 'Muelle Turístico', tipo: 'referencia', lat: 3.88889, lon: -77.08091 },
  { nombre: 'Universidad del Pacífico', tipo: 'referencia', lat: 3.84757, lon: -76.99723 },
];

/* Barrios que Domix atiende pero que OpenStreetMap no tiene mapeados.
   Se ofrecen en el buscador para que el cliente los reconozca, pero
   sin coordenadas: al elegirlos se le pide marcar el punto en el mapa. */
export const BARRIOS_SIN_MAPEAR = ['El Jorge', 'Cristo Rey'];

function normalizar(texto) {
  return (texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')   // quita tildes: "Piñal" encuentra "pinal"
    .trim();
}

/* Busca en el listado local. Devuelve el mismo formato que el
   buscador de mapas, para poder mezclar los resultados. */
export function buscarLugaresLocales(consulta) {
  const q = normalizar(consulta);
  if (q.length < 2) return [];

  const conCoordenadas = LUGARES_BUENAVENTURA
    .filter((l) => normalizar(l.nombre).includes(q))
    .map((l) => ({
      label: `${l.nombre}, Buenaventura`,
      lat: l.lat,
      lon: l.lon,
      local: true,
      tipo: l.tipo,
    }));

  const sinCoordenadas = BARRIOS_SIN_MAPEAR
    .filter((b) => normalizar(b).includes(q))
    .map((b) => ({
      label: `${b}, Buenaventura`,
      lat: null,
      lon: null,
      local: true,
      requierePin: true,
      tipo: 'barrio',
    }));

  return [...conCoordenadas, ...sinCoordenadas];
}
