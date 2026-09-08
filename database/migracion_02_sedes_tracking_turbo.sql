-- ============================================================
-- Domix — Migración 02
-- Sedes (multi-ciudad), tracking en vivo, Turbo y motor de despacho.
-- Ejecutar en el SQL Editor de Supabase después de schema.sql.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Sedes: abrir una ciudad nueva es insertar una fila aquí
-- ------------------------------------------------------------
create table if not exists public.branches (
    id uuid default uuid_generate_v4() primary key,
    name text not null,
    city text not null,
    department text,
    center_lat double precision not null,
    center_lon double precision not null,
    coverage_radius_km numeric(5,1) default 8,
    whatsapp text,
    zones text[] default array['Centro'],
    is_active boolean default true,
    opened_at date default current_date,
    -- Reglas del motor de despacho por sede (tarifa base, km, surge, turbo…)
    pricing_rules jsonb default '{}'::jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.branches enable row level security;

drop policy if exists "Acceso abierto a sedes (sin login, temporal)" on public.branches;
create policy "Acceso abierto a sedes (sin login, temporal)"
    on public.branches for all using ( true ) with check ( true );

insert into public.branches (name, city, department, center_lat, center_lon, coverage_radius_km, whatsapp, zones)
select 'Buenaventura', 'Buenaventura', 'Valle del Cauca', 3.8801, -77.0312, 8, '573157924906',
       array['Centro','El Jorge','Pueblo Nuevo','Juan XXIII','Cristo Rey','Bellavista','La Independencia']
where not exists (select 1 from public.branches where city = 'Buenaventura');

-- ------------------------------------------------------------
-- 2. Relación de repartidores y pedidos con su sede
-- ------------------------------------------------------------
alter table public.courier_profiles add column if not exists branch_id uuid references public.branches(id);
alter table public.service_requests add column if not exists branch_id uuid references public.branches(id);

update public.courier_profiles set branch_id = (select id from public.branches where city = 'Buenaventura' limit 1) where branch_id is null;
update public.service_requests set branch_id = (select id from public.branches where city = 'Buenaventura' limit 1) where branch_id is null;

-- ------------------------------------------------------------
-- 3. Tracking en vivo y servicio Turbo
-- ------------------------------------------------------------
alter table public.service_requests add column if not exists turbo boolean default false;
alter table public.service_requests add column if not exists distance_km numeric(6,2);
alter table public.service_requests add column if not exists eta_minutes integer;
alter table public.service_requests add column if not exists pickup_lat double precision;
alter table public.service_requests add column if not exists pickup_lon double precision;
alter table public.service_requests add column if not exists dropoff_lat double precision;
alter table public.service_requests add column if not exists dropoff_lon double precision;
alter table public.service_requests add column if not exists price_breakdown jsonb;
alter table public.service_requests add column if not exists is_demo boolean default false;

-- Posición del repartidor en vivo (la escribe la app del repartidor,
-- la leen el cliente y el panel de la empresa).
alter table public.courier_profiles add column if not exists last_lat double precision;
alter table public.courier_profiles add column if not exists last_lon double precision;
alter table public.courier_profiles add column if not exists last_seen_at timestamp with time zone;
alter table public.courier_profiles add column if not exists heading numeric(6,2);

create index if not exists service_requests_branch_idx on public.service_requests(branch_id);
create index if not exists courier_profiles_branch_idx on public.courier_profiles(branch_id);

-- Rastro histórico del recorrido, para reconstruir la ruta después.
create table if not exists public.tracking_points (
    id bigserial primary key,
    request_id uuid references public.service_requests(id) on delete cascade,
    courier_id uuid references public.courier_profiles(id),
    lat double precision not null,
    lon double precision not null,
    recorded_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists tracking_points_request_idx on public.tracking_points(request_id, recorded_at);

alter table public.tracking_points enable row level security;
drop policy if exists "Acceso abierto a tracking (sin login, temporal)" on public.tracking_points;
create policy "Acceso abierto a tracking (sin login, temporal)"
    on public.tracking_points for all using ( true ) with check ( true );

-- ------------------------------------------------------------
-- 4. Seguimiento público: ahora incluye posición del repartidor
-- ------------------------------------------------------------
drop function if exists public.track_service_request(text);
create or replace function public.track_service_request(p_tracking_code text)
returns table (
    id uuid,
    service_type text,
    status text,
    pickup_address text,
    dropoff_address text,
    pickup_lat double precision,
    pickup_lon double precision,
    dropoff_lat double precision,
    dropoff_lon double precision,
    courier_lat double precision,
    courier_lon double precision,
    courier_name text,
    turbo boolean,
    eta_minutes integer,
    price decimal,
    tracking_code text,
    created_at timestamp with time zone
) as $$
    select sr.id, sr.service_type, sr.status, sr.pickup_address, sr.dropoff_address,
           sr.pickup_lat, sr.pickup_lon, sr.dropoff_lat, sr.dropoff_lon,
           cp.last_lat, cp.last_lon, p.first_name,
           sr.turbo, sr.eta_minutes, sr.price, sr.tracking_code, sr.created_at
    from public.service_requests sr
    left join public.courier_profiles cp on cp.id = sr.courier_id
    left join public.profiles p on p.id = cp.id
    where sr.tracking_code = p_tracking_code;
$$ language sql security definer stable;

-- ------------------------------------------------------------
-- 5. Realtime: el panel y el cliente reciben los cambios al instante
-- ------------------------------------------------------------
-- Se agregan solo si no están ya publicadas, para poder re-ejecutar la migración.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'service_requests'
  ) then
    alter publication supabase_realtime add table public.service_requests;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'courier_profiles'
  ) then
    alter publication supabase_realtime add table public.courier_profiles;
  end if;
end $$;
