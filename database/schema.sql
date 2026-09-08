-- ============================================================
-- Domix - Mensajería & Logística — Esquema de base de datos
-- Adaptado del esquema de Turapp (Supabase + PostGIS + RLS)
-- ============================================================

create extension if not exists postgis;
create extension if not exists "uuid-ossp";

-- ------------------------------------------------------------
-- 1. Perfiles (clientes, repartidores y staff de Domix)
-- ------------------------------------------------------------
create table if not exists public.profiles (
    id uuid references auth.users(id) primary key,
    phone_number text unique not null,
    first_name text,
    last_name text,
    avatar_url text,
    role text check (role in ('client', 'courier', 'admin')) default 'client',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profiles enable row level security;

create policy "Los perfiles son visibles para todos"
    on public.profiles for select
    using ( true );

create policy "Un usuario crea su propio perfil"
    on public.profiles for insert
    with check ( auth.uid() = id );

create policy "Un usuario actualiza su propio perfil"
    on public.profiles for update
    using ( auth.uid() = id );

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

create policy "Perfiles de repartidor visibles para todos"
    on public.courier_profiles for select
    using ( true );

create policy "Un repartidor actualiza su propio estado/ubicacion"
    on public.courier_profiles for update
    using ( auth.uid() = id );

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

create policy "Vehiculos visibles para todos"
    on public.vehicles for select
    using ( true );

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

create policy "Un repartidor ve y edita sus propios documentos"
    on public.courier_documents for all
    using ( auth.uid() = courier_id );

create policy "El admin ve todos los documentos"
    on public.courier_documents for select
    using ( exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') );

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

alter table public.service_requests enable row level security;

create policy "Clientes y repartidores ven sus propias solicitudes"
    on public.service_requests for select
    using ( auth.uid() = client_id or auth.uid() = courier_id
            or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') );

create policy "Clientes y admin crean solicitudes"
    on public.service_requests for insert
    with check ( auth.uid() = client_id
                 or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') );

create policy "Repartidor, cliente y admin actualizan la solicitud"
    on public.service_requests for update
    using ( auth.uid() = client_id or auth.uid() = courier_id
            or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') );

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

create policy "Un repartidor ve sus propios pagos"
    on public.payouts for select
    using ( auth.uid() = courier_id
            or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') );

-- ------------------------------------------------------------
-- Trigger: crear perfil automáticamente al registrarse
-- ------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, phone_number, first_name)
  values (new.id, new.phone, 'Usuario Nuevo');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

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
