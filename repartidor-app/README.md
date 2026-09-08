# Domix Repartidor — PWA

App de repartidores de **Domix - Mensajería & Logística** (Buenaventura). Reemplaza el "modelo restaurante" de Turafood por servicios genéricos: mensajería, encomiendas, domicilios, mandados y autorizaciones médicas.

## Stack

- Next.js 15 (App Router) + React 19
- Supabase: Auth (OTP por teléfono), Postgres + PostGIS, RLS, Realtime
- Sin backend propio: el frontend habla directo con Supabase (mismo patrón que Turapp)

## Puesta en marcha

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. En el SQL Editor de Supabase, ejecuta [`../database/schema.sql`](../database/schema.sql).
3. En Authentication → Providers, habilita **Phone** (SMS OTP vía Twilio/MessageBird).
4. Copia `.env.local.example` a `.env.local` y pon la URL y anon key de tu proyecto.
5. `npm install`
6. `npm run dev` — abre `http://localhost:3000`

## Pantallas

- `/` — login por teléfono (OTP)
- `/home` — estado en línea, ganado hoy, pedidos cercanos para aceptar
- `/ganancias` — resumen semanal, tarifas, propinas
- `/entregas` — entregas asignadas, con flujo recogido → en camino → entregado
- `/cuenta` — perfil, documentos (cédula/licencia/SOAT/tarjeta de propiedad), vehículo, zona, cierre de sesión

## Pendiente (siguientes pasos)

- Ubicación en vivo del repartidor (`courier_profiles.current_location`) vía `navigator.geolocation.watchPosition` + `nearby_requests_for_courier`.
- Subida de documentos a Supabase Storage desde `/cuenta`.
- Registro de repartidor nuevo (hoy asume que el admin lo crea manualmente en Supabase).
- Panel admin (`domix-admin`) para ver repartidores en el mapa, asignar pedidos manualmente y aprobar documentos.
- App de cliente (`domix-cliente`) para pedir sin pasar por WhatsApp.
