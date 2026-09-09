-- ============================================================
-- Domix — Migración 07: documentos, vehículo y retiros
--
-- Estas tres pantallas del app de repartidor existían pero no
-- guardaban nada: las tablas estaban vacías y "Solicitar retiro"
-- no hacía nada. Aquí se les pone el respaldo real.
--
-- Lo importante: el dinero no se valida en el teléfono. El monto
-- disponible se calcula en la base de datos y solicitar_retiro()
-- rechaza cualquier cifra que no cuadre. Un repartidor no puede
-- pedir más de lo que se ganó ni pedir dos veces lo mismo.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Documentos: dónde queda el archivo y quién lo revisó
-- ------------------------------------------------------------
alter table public.courier_documents add column if not exists storage_path text;
alter table public.courier_documents add column if not exists review_notes text;
alter table public.courier_documents add column if not exists reviewed_at timestamp with time zone;
alter table public.courier_documents add column if not exists uploaded_at timestamp with time zone;

-- Balde privado. Una cédula o una licencia no puede quedar en una URL
-- pública: se leen con enlaces firmados que caducan.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('documentos', 'documentos', false, 8388608,
        array['image/jpeg','image/png','image/webp','image/heic','application/pdf'])
on conflict (id) do update
  set public = false,
      file_size_limit = 8388608,
      allowed_mime_types = array['image/jpeg','image/png','image/webp','image/heic','application/pdf'];

do $pol$
begin
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'Domix sube documentos') then
    create policy "Domix sube documentos" on storage.objects
      for insert with check (bucket_id = 'documentos');
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'Domix lee documentos') then
    create policy "Domix lee documentos" on storage.objects
      for select using (bucket_id = 'documentos');
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'Domix reemplaza documentos') then
    create policy "Domix reemplaza documentos" on storage.objects
      for update using (bucket_id = 'documentos');
  end if;
end
$pol$;

-- Guardar (o reemplazar) un documento. Vuelve a quedar "pendiente":
-- si lo cambiaste, alguien lo tiene que mirar otra vez.
create or replace function registrar_documento(
    p_courier_id uuid,
    p_doc_type   text,
    p_path       text,
    p_expires_at date default null
) returns public.courier_documents as $fn$
declare
    v_doc public.courier_documents;
begin
    insert into public.courier_documents (courier_id, doc_type, storage_path, file_url, expires_at, status, uploaded_at)
    values (p_courier_id, p_doc_type, p_path, p_path, p_expires_at, 'pending', now())
    on conflict (courier_id, doc_type) do update
      set storage_path = excluded.storage_path,
          file_url     = excluded.file_url,
          expires_at   = coalesce(excluded.expires_at, public.courier_documents.expires_at),
          status       = 'pending',
          review_notes = null,
          reviewed_at  = null,
          uploaded_at  = now()
    returning * into v_doc;

    return v_doc;
end;
$fn$ language plpgsql security definer;

-- Aprobar o rechazar desde el panel.
create or replace function revisar_documento(
    p_doc_id uuid,
    p_estado text,
    p_nota   text default null
) returns public.courier_documents as $fn$
declare
    v_doc public.courier_documents;
begin
    if p_estado not in ('approved', 'rejected', 'pending', 'expiring_soon') then
        raise exception 'Estado de documento no válido: %', p_estado;
    end if;

    update public.courier_documents
       set status = p_estado,
           review_notes = p_nota,
           reviewed_at = now()
     where id = p_doc_id
    returning * into v_doc;

    return v_doc;
end;
$fn$ language plpgsql security definer;

-- Un documento vencido no sirve aunque esté aprobado. Esto marca los
-- que caducan dentro de 30 días para que el repartidor los renueve.
create or replace function marcar_documentos_por_vencer() returns integer as $fn$
declare
    v_n integer;
begin
    update public.courier_documents
       set status = 'expiring_soon'
     where status = 'approved'
       and expires_at is not null
       and expires_at <= current_date + interval '30 days';
    get diagnostics v_n = row_count;
    return v_n;
end;
$fn$ language plpgsql security definer;

-- ------------------------------------------------------------
-- 2. Vehículo: uno activo por repartidor
-- ------------------------------------------------------------
alter table public.vehicles add column if not exists color text;
alter table public.vehicles add column if not exists year integer;
alter table public.vehicles add column if not exists updated_at timestamp with time zone default timezone('utc'::text, now());

create unique index if not exists vehiculo_activo_unico
    on public.vehicles (courier_id) where is_active;

create or replace function guardar_vehiculo(
    p_courier_id uuid,
    p_tipo       text,
    p_placa      text default null,
    p_modelo     text default null,
    p_color      text default null,
    p_year       integer default null
) returns public.vehicles as $fn$
declare
    v_veh public.vehicles;
begin
    if p_tipo not in ('moto', 'bicicleta', 'a_pie', 'carro') then
        raise exception 'Tipo de vehículo no válido: %', p_tipo;
    end if;

    -- Moto y carro sin placa no se registran: es lo que se le muestra
    -- al cliente y lo que se reporta si algo pasa en la vía.
    if p_tipo in ('moto', 'carro') and coalesce(trim(p_placa), '') = '' then
        raise exception 'La placa es obligatoria para moto y carro';
    end if;

    update public.vehicles set is_active = false
     where courier_id = p_courier_id and is_active;

    insert into public.vehicles (courier_id, vehicle_type, plate, model, color, year, is_active, updated_at)
    values (p_courier_id, p_tipo,
            nullif(trim(upper(coalesce(p_placa, ''))), ''),
            nullif(trim(coalesce(p_modelo, '')), ''),
            nullif(trim(coalesce(p_color, '')), ''),
            p_year, true, now())
    returning * into v_veh;

    return v_veh;
end;
$fn$ language plpgsql security definer;

-- ------------------------------------------------------------
-- 3. Retiros
-- ------------------------------------------------------------
alter table public.payouts add column if not exists method text;
alter table public.payouts add column if not exists account text;
alter table public.payouts add column if not exists requested_at timestamp with time zone default timezone('utc'::text, now());
alter table public.payouts add column if not exists resolved_at timestamp with time zone;
alter table public.payouts add column if not exists reference text;
alter table public.payouts add column if not exists notes text;

-- 'rejected' faltaba: un retiro se puede negar, y eso no es lo mismo
-- que un pago fallido.
alter table public.payouts drop constraint if exists payouts_status_check;
alter table public.payouts add constraint payouts_status_check
    check (status in ('pending', 'paid', 'failed', 'rejected'));

create index if not exists payouts_courier_idx on public.payouts (courier_id, requested_at desc);
create index if not exists payouts_status_idx  on public.payouts (status, requested_at);

alter table public.courier_profiles add column if not exists payout_method text;

-- Cuánto se ganó, cuánto se retiró, cuánto queda.
create or replace function saldo_repartidor(p_courier_id uuid)
returns table (
    ganado      numeric,
    retirado    numeric,
    pendiente   numeric,
    disponible  numeric,
    entregas    integer
) as $fn$
    with ganancias as (
        select coalesce(sum(coalesce(price, 0) + coalesce(tip, 0)), 0) as total,
               count(*)::int as n
          from public.service_requests
         where courier_id = p_courier_id and status = 'delivered'
    ),
    pagos as (
        select coalesce(sum(amount) filter (where status = 'paid'), 0)    as pagado,
               coalesce(sum(amount) filter (where status = 'pending'), 0) as en_curso
          from public.payouts
         where courier_id = p_courier_id
    )
    select g.total,
           p.pagado,
           p.en_curso,
           greatest(g.total - p.pagado - p.en_curso, 0),
           g.n
      from ganancias g, pagos p;
$fn$ language sql security definer stable;

-- El monto lo decide la base, no el teléfono.
create or replace function solicitar_retiro(
    p_courier_id uuid,
    p_monto      numeric,
    p_metodo     text default null,
    p_cuenta     text default null
) returns table (ok boolean, motivo text, retiro_id uuid, disponible numeric) as $fn$
declare
    v_saldo   numeric;
    v_minimo  constant numeric := 10000;
    v_cuenta  text;
    v_metodo  text;
    v_id      uuid;
begin
    select s.disponible into v_saldo from saldo_repartidor(p_courier_id) s;

    if v_saldo is null then
        return query select false, 'No encontramos tu cuenta de repartidor.'::text, null::uuid, 0::numeric;
        return;
    end if;

    if exists (select 1 from public.payouts where courier_id = p_courier_id and status = 'pending') then
        return query select false, 'Ya tienes un retiro en curso. Espera a que se consigne.'::text, null::uuid, v_saldo;
        return;
    end if;

    select coalesce(nullif(trim(coalesce(p_cuenta, '')), ''), cp.payout_account),
           coalesce(nullif(trim(coalesce(p_metodo, '')), ''), cp.payout_method)
      into v_cuenta, v_metodo
      from public.courier_profiles cp
     where cp.id = p_courier_id;

    if coalesce(trim(coalesce(v_cuenta, '')), '') = '' then
        return query select false, 'Primero registra tu cuenta de retiro en Cuenta.'::text, null::uuid, v_saldo;
        return;
    end if;

    if p_monto is null or p_monto <= 0 then
        return query select false, 'El monto debe ser mayor que cero.'::text, null::uuid, v_saldo;
        return;
    end if;

    if p_monto < v_minimo then
        return query select false, 'El retiro mínimo es de $10.000.'::text, null::uuid, v_saldo;
        return;
    end if;

    if p_monto > v_saldo then
        return query select false, 'No puedes retirar más de lo que tienes disponible.'::text, null::uuid, v_saldo;
        return;
    end if;

    insert into public.payouts (courier_id, amount, status, method, account, requested_at, period_start, period_end)
    values (p_courier_id, p_monto, 'pending', v_metodo, v_cuenta, now(), current_date - 7, current_date)
    returning id into v_id;

    return query select true, 'Retiro solicitado.'::text, v_id, v_saldo - p_monto;
end;
$fn$ language plpgsql security definer;

-- Desde el panel: consignado, negado o fallido.
create or replace function resolver_retiro(
    p_retiro_id  uuid,
    p_estado     text,
    p_referencia text default null,
    p_nota       text default null
) returns public.payouts as $fn$
declare
    v_pago public.payouts;
begin
    if p_estado not in ('paid', 'rejected', 'failed') then
        raise exception 'Estado de retiro no válido: %', p_estado;
    end if;

    update public.payouts
       set status = p_estado,
           reference = coalesce(p_referencia, reference),
           notes = coalesce(p_nota, notes),
           resolved_at = now()
     where id = p_retiro_id and status = 'pending'
    returning * into v_pago;

    if v_pago.id is null then
        raise exception 'Ese retiro ya fue resuelto o no existe';
    end if;

    return v_pago;
end;
$fn$ language plpgsql security definer;

-- Guardar a dónde se le consigna.
create or replace function guardar_cuenta_retiro(
    p_courier_id uuid,
    p_metodo     text,
    p_cuenta     text
) returns public.courier_profiles as $fn$
declare
    v_perfil public.courier_profiles;
begin
    if coalesce(trim(coalesce(p_cuenta, '')), '') = '' then
        raise exception 'La cuenta no puede quedar vacía';
    end if;

    update public.courier_profiles
       set payout_method = nullif(trim(coalesce(p_metodo, '')), ''),
           payout_account = trim(p_cuenta)
     where id = p_courier_id
    returning * into v_perfil;

    return v_perfil;
end;
$fn$ language plpgsql security definer;

-- Lo que ve el panel: quién pidió plata, cuánto y hace cuánto.
create or replace view public.retiros_pendientes as
select p.id,
       p.courier_id,
       p.amount,
       p.status,
       p.method,
       p.account,
       p.requested_at,
       p.resolved_at,
       p.reference,
       pr.first_name,
       pr.last_name,
       pr.phone_number
  from public.payouts p
  join public.profiles pr on pr.id = p.courier_id
 order by (p.status = 'pending') desc, p.requested_at desc;
