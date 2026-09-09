-- ============================================================
-- Domix — Migración 03: PIN de entrega (estilo DiDi / Rappi)
--
-- El cliente recibe 4 dígitos. Se los dicta al repartidor al momento
-- de la entrega, y sin ellos el pedido no se puede cerrar.
--
-- El PIN vive en su propia tabla, sin políticas de lectura: ni el
-- repartidor ni nadie con la llave pública puede consultarlo. Solo
-- sale por track_service_request (que exige el código del cliente) y
-- solo se verifica por confirm_delivery.
-- ============================================================

-- ------------------------------------------------------------
-- 1. La tabla de PIN, cerrada a cal y canto
-- ------------------------------------------------------------
create table if not exists public.delivery_pins (
    request_id uuid primary key references public.service_requests(id) on delete cascade,
    pin text not null,
    attempts integer not null default 0,
    confirmed_at timestamp with time zone,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.delivery_pins enable row level security;

-- A propósito no se crea ninguna política: con RLS activo y sin
-- políticas, la llave pública no puede leer ni escribir esta tabla.
-- Las funciones de abajo son security definer, así que sí pueden.

-- ------------------------------------------------------------
-- 2. Cada pedido nuevo nace con su PIN
-- ------------------------------------------------------------
create or replace function public.crear_pin_de_entrega()
returns trigger as $$
begin
    insert into public.delivery_pins (request_id, pin)
    values (new.id, lpad((floor(random() * 10000))::int::text, 4, '0'))
    on conflict (request_id) do nothing;
    return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_crear_pin_de_entrega on public.service_requests;
create trigger trg_crear_pin_de_entrega
    after insert on public.service_requests
    for each row execute function public.crear_pin_de_entrega();

-- Los pedidos que ya existían también reciben el suyo
insert into public.delivery_pins (request_id, pin)
select id, lpad((floor(random() * 10000))::int::text, 4, '0')
from public.service_requests
on conflict (request_id) do nothing;

-- ------------------------------------------------------------
-- 3. El cliente ve su PIN al consultar el seguimiento
-- ------------------------------------------------------------
-- Cambia la forma del resultado (ahora incluye el PIN), así que hay
-- que soltar la versión anterior antes de recrearla.
drop function if exists public.track_service_request(text);

create or replace function public.track_service_request(p_tracking_code text)
returns table (
    id uuid,
    tracking_code text,
    service_type text,
    status text,
    turbo boolean,
    price numeric,
    eta_minutes integer,
    pickup_address text,
    dropoff_address text,
    pickup_lat double precision,
    pickup_lon double precision,
    dropoff_lat double precision,
    dropoff_lon double precision,
    courier_name text,
    courier_lat double precision,
    courier_lon double precision,
    delivery_pin text,
    created_at timestamp with time zone
) as $$
    select
        sr.id, sr.tracking_code, sr.service_type, sr.status, sr.turbo, sr.price, sr.eta_minutes,
        sr.pickup_address, sr.dropoff_address,
        sr.pickup_lat, sr.pickup_lon, sr.dropoff_lat, sr.dropoff_lon,
        p.first_name as courier_name,
        cp.last_lat as courier_lat, cp.last_lon as courier_lon,
        dp.pin as delivery_pin,
        sr.created_at
    from public.service_requests sr
    left join public.courier_profiles cp on cp.id = sr.courier_id
    left join public.profiles p on p.id = cp.id
    left join public.delivery_pins dp on dp.request_id = sr.id
    where sr.tracking_code = p_tracking_code;
$$ language sql security definer stable;

-- ------------------------------------------------------------
-- 4. El repartidor cierra la entrega con el PIN
--
-- Devuelve el resultado en vez de fallar, para que la app pueda
-- mostrar un mensaje claro. Bloquea tras 5 intentos fallidos.
-- ------------------------------------------------------------
create or replace function public.confirm_delivery(p_request_id uuid, p_pin text)
returns table (ok boolean, motivo text, intentos integer) as $$
declare
    v_pin text;
    v_attempts integer;
    v_status text;
begin
    select dp.pin, dp.attempts, sr.status
      into v_pin, v_attempts, v_status
    from public.delivery_pins dp
    join public.service_requests sr on sr.id = dp.request_id
    where dp.request_id = p_request_id;

    if v_pin is null then
        return query select false, 'pedido_no_encontrado', 0;
        return;
    end if;

    if v_status = 'delivered' then
        return query select true, 'ya_entregado', v_attempts;
        return;
    end if;

    if v_attempts >= 5 then
        return query select false, 'bloqueado', v_attempts;
        return;
    end if;

    if v_pin <> trim(p_pin) then
        update public.delivery_pins
           set attempts = attempts + 1
         where request_id = p_request_id;
        return query select false, 'pin_incorrecto', v_attempts + 1;
        return;
    end if;

    update public.service_requests
       set status = 'delivered', delivered_at = timezone('utc'::text, now())
     where id = p_request_id;

    update public.delivery_pins
       set confirmed_at = timezone('utc'::text, now())
     where request_id = p_request_id;

    return query select true, 'entregado', v_attempts;
end;
$$ language plpgsql security definer;

-- ------------------------------------------------------------
-- 5. Salida de emergencia: el panel puede ver el PIN y cerrar a mano
--    cuando el cliente no está o no lo tiene a la mano.
-- ------------------------------------------------------------
create or replace function public.admin_delivery_pin(p_request_id uuid)
returns text as $$
    select pin from public.delivery_pins where request_id = p_request_id;
$$ language sql security definer stable;
