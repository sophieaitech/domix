-- ============================================================
-- Domix - Mensajería & Logística — Esquema de base de datos
-- Adaptado del esquema de Turapp (Supabase + PostGIS)
--
-- ⚠️ MODO SIN LOGIN (temporal, a pedido explícito para no complicar
-- el arranque): ninguna tabla depende de Supabase Auth. Las políticas
-- de abajo son PERMISIVAS (cualquiera con la anon key puede leer/escribir),
-- porque la app no tiene forma de saber "quién eres" todavía.
-- Antes de manejar pagos reales o abrir la app de cliente al público hay
-- que: (a) agregar autenticación real (SMS OTP, PIN, o lo que se decida),
-- y (b) reemplazar estas políticas por las que ya quedaron comentadas
-- como referencia, basadas en auth.uid().
-- ============================================================

create extension if not exists postgis;
create extension if not exists "uuid-ossp";

-- ------------------------------------------------------------
-- 1. Perfiles (repartidores y staff de Domix)
--    Nota: ya NO referencia auth.users — no depende de Supabase Auth.
-- ------------------------------------------------------------
create table if not exists public.profiles (
    id uuid default uuid_generate_v4() primary key,
    phone_number text unique,
    first_name text,
    last_name text,
    avatar_url text,
    role text check (role in ('client', 'courier', 'admin')) default 'client',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profiles enable row level security;

create policy "Acceso abierto a perfiles (sin login, temporal)"
    on public.profiles for all
    using ( true )
    with check ( true );

-- ------------------------------------------------------------
-- 2. Perfil de repartidor (equivalente a driver_profiles)
-- ------------------------------------------------------------
create table if not exists public.courier_profiles (
    id uuid references public.profiles(id) primary key,
    document_id text,
    is_active boolean default false,
    current_location geometry(Point, 4326),
    status text check (status in ('offline', 'online', 'busy')) default 'offline',
    work_zone text default 'Centro',
    preferred_schedule text,
    payout_account text,
    rating numeric(3,2) default 5.00,
    total_deliveries integer default 0,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists courier_location_idx on public.courier_profiles using gist (current_location);

alter table public.courier_profiles enable row level security;

create policy "Acceso abierto a perfiles de repartidor (sin login, temporal)"
    on public.courier_profiles for all
    using ( true )
    with check ( true );

-- ------------------------------------------------------------
-- 3. Vehículo del repartidor
-- ------------------------------------------------------------
create table if not exists public.vehicles (
    id uuid default uuid_generate_v4() primary key,
    courier_id uuid references public.courier_profiles(id) not null,
    vehicle_type text check (vehicle_type in ('moto', 'bicicleta', 'a_pie', 'carro')) default 'moto',
    plate text,
    model text,
    is_active boolean default true,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.vehicles enable row level security;

create policy "Acceso abierto a vehiculos (sin login, temporal)"
    on public.vehicles for all
    using ( true )
    with check ( true );

-- ------------------------------------------------------------
-- 4. Documentos del repartidor (cédula, licencia, SOAT, tarjeta de propiedad)
-- ------------------------------------------------------------
create table if not exists public.courier_documents (
    id uuid default uuid_generate_v4() primary key,
    courier_id uuid references public.courier_profiles(id) not null,
    doc_type text check (doc_type in ('cedula', 'licencia', 'soat', 'tarjeta_propiedad')) not null,
    file_url text,
    status text check (status in ('pending', 'approved', 'expiring_soon', 'rejected')) default 'pending',
    expires_at date,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique (courier_id, doc_type)
);

alter table public.courier_documents enable row level security;

create policy "Acceso abierto a documentos (sin login, temporal)"
    on public.courier_documents for all
    using ( true )
    with check ( true );

-- ------------------------------------------------------------
-- 5. Solicitudes de servicio (mensajería, encomienda, domicilio,
--    mandado, autorización médica) — reemplaza trips/favors de Turapp
-- ------------------------------------------------------------
create table if not exists public.service_requests (
    id uuid default uuid_generate_v4() primary key,
    client_id uuid references public.profiles(id),
    courier_id uuid references public.courier_profiles(id),
    service_type text check (service_type in ('mensajeria', 'encomienda', 'domicilio', 'mandado', 'autorizacion_medica')) not null,
    description text,
    pickup_address text not null,
    pickup_location geometry(Point, 4326),
    dropoff_address text not null,
    dropoff_location geometry(Point, 4326),
    contact_name text,
    contact_phone text,
    -- El cliente pide como invitado (sin cuenta). tracking_code es lo único
    -- que necesita para consultar el estado de su pedido después.
    tracking_code text unique default substr(md5(random()::text || clock_timestamp()::text), 1, 8),
    price decimal(10,2) not null default 6000,
    max_budget decimal(10,2),
    tip decimal(10,2) default 0,
    payment_method text check (payment_method in ('cash', 'transfer', 'wallet')) default 'cash',
    status text check (status in ('requested', 'assigned', 'picked_up', 'in_progress', 'delivered', 'cancelled')) default 'requested',
    source text check (source in ('whatsapp', 'app', 'admin')) default 'whatsapp',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    assigned_at timestamp with time zone,
    picked_up_at timestamp with time zone,
    delivered_at timestamp with time zone
);

create index if not exists service_requests_status_idx on public.service_requests(status);
create index if not exists service_requests_courier_idx on public.service_requests(courier_id);
create index if not exists service_requests_tracking_idx on public.service_requests(tracking_code);

alter table public.service_requests enable row level security;

create policy "Acceso abierto a solicitudes (sin login, temporal)"
    on public.service_requests for all
    using ( true )
    with check ( true );

-- Referencia para cuando se agregue autenticación real (NO está activa):
--
-- create policy "Repartidores, admin y dueno de cuenta ven las solicitudes"
--     on public.service_requests for select
--     using ( auth.uid() = courier_id
--             or (client_id is not null and auth.uid() = client_id)
--             or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') );
--
-- create policy "Cualquiera (con o sin cuenta) crea una solicitud"
--     on public.service_requests for insert
--     with check ( client_id is null or auth.uid() = client_id );
--
-- create policy "Repartidor y admin actualizan la solicitud"
--     on public.service_requests for update
--     using ( auth.uid() = courier_id
--             or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') );

-- Función de consulta pública de estado por código de seguimiento (útil ya
-- desde ahora para un link tipo "sigue tu pedido" sin exponer toda la tabla).
create or replace function public.track_service_request(p_tracking_code text)
returns table (
    id uuid,
    service_type text,
    status text,
    pickup_address text,
    dropoff_address text,
    price decimal,
    created_at timestamp with time zone
) as $$
    select id, service_type, status, pickup_address, dropoff_address, price, created_at
    from public.service_requests
    where tracking_code = p_tracking_code;
$$ language sql security definer stable;

-- ------------------------------------------------------------
-- 6. Pagos / liquidaciones al repartidor
-- ------------------------------------------------------------
create table if not exists public.payouts (
    id uuid default uuid_generate_v4() primary key,
    courier_id uuid references public.courier_profiles(id) not null,
    amount decimal(10,2) not null,
    status text check (status in ('pending', 'paid', 'failed')) default 'pending',
    period_start date,
    period_end date,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.payouts enable row level security;

create policy "Acceso abierto a pagos (sin login, temporal)"
    on public.payouts for all
    using ( true )
    with check ( true );

-- ------------------------------------------------------------
-- Función: pedidos disponibles cerca de un repartidor (radio en metros)
-- ------------------------------------------------------------
create or replace function nearby_requests_for_courier(
    courier_lat double precision,
    courier_lon double precision,
    radius_meters double precision default 5000
)
returns setof public.service_requests as $$
    select sr.*
    from public.service_requests sr
    where sr.status = 'requested'
      and (
        sr.pickup_location is null
        or st_dwithin(
            sr.pickup_location,
            st_setsrid(st_makepoint(courier_lon, courier_lat), 4326)::geography,
            radius_meters
        )
      )
    order by sr.created_at asc;
$$ language sql stable;
