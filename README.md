# Domix — Mensajería & Logística

Sistema interno de Domix (Buenaventura). Tres aplicaciones sobre la misma base de datos.

| App | Carpeta | Puerto local | Para quién |
|---|---|---|---|
| **Panel interno** | `admin-app` | 3002 | El equipo de Domix: pedidos en vivo, flota, tarifas, sedes |
| **App de repartidor** | `repartidor-app` | 3000 | Los domiciliarios: reciben pedidos, entregan, cobran |
| **App de cliente** | `cliente-app` | 3001 | Quien pide el servicio, sin registrarse |

## Stack

- **Next.js 15** (App Router) + React 19, una app por rol
- **Supabase** — Postgres + PostGIS + Realtime (sin backend propio)
- **Leaflet + OpenStreetMap** — mapas y rutas sin API key
- **Nominatim / OSRM** — geocodificación y ruta real por calles, gratis

## Correr en local

```bash
cd admin-app && npm install && npm run dev     # http://localhost:3002
cd repartidor-app && npm install && npm run dev # http://localhost:3000
cd cliente-app && npm install && npm run dev    # http://localhost:3001
```

Cada app necesita su `.env.local` (copiar de `.env.local.example`):

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
```

## Base de datos

En el SQL Editor de Supabase, en orden:

1. `database/schema.sql` — tablas base
2. `database/migracion_02_sedes_tracking_turbo.sql` — sedes, tracking en vivo, Turbo

## Modo Demo y Modo En vivo

Toda app trae un interruptor **Demo / En vivo**:

- **Demo** — operación simulada: historial de la semana, flota, pedidos activos y un botón para simular pedidos entrantes. Sirve para mostrar y entrenar sin tocar datos reales.
- **En vivo** — solo datos reales de Supabase. Arranca en ceros y se llena con los pedidos que hagan los clientes.

## Motor de despacho

La tarifa se calcula igual en las tres apps (`src/lib/pricing.js`): tarifa base con km incluidos,
costo por km adicional, recargo por tipo de servicio, multiplicador por demanda (manual o automático
según la carga de la flota), recargos por lluvia y horario nocturno, y el recargo de **Domix Turbo**.
Se ajusta desde el panel en *Motor de despacho*.

## Desplegar

Cada carpeta es un proyecto Next.js independiente (`output: standalone`), así que se despliega por separado.

**Vercel** (lo más rápido): importar el repo tres veces, una por app, y en cada proyecto definir
*Root Directory* (`admin-app`, `repartidor-app` o `cliente-app`) y las dos variables de entorno de Supabase.

Sugerencia de dominios:

- `panel.domix.co` → admin-app
- `repartidor.domix.co` → repartidor-app
- `pedir.domix.co` → cliente-app

## Pendiente antes de producción con dinero real

El sistema opera **sin inicio de sesión** para simplificar el arranque, y las políticas RLS de Supabase
están abiertas. Antes de manejar pagos reales hay que activar autenticación por rol y cerrar esas políticas
(las versiones restringidas quedaron comentadas en `database/schema.sql`).
