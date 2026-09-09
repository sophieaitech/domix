-- ============================================================
-- Domix — Migración 05: claves de acceso por rol
--
-- Hasta ahora cualquiera con el enlace entraba al panel y veía toda la
-- operación, o entraba a la app de repartidor eligiendo un nombre de una
-- lista. Esto pone una clave por persona.
--
-- Las claves se guardan cifradas con bcrypt (pgcrypto), nunca en claro,
-- y la verificación ocurre dentro de la base: la app manda la clave y
-- recibe solo un sí o un no con los datos de la sesión.
-- ============================================================

create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- 1. Cada perfil puede tener clave y estado de acceso
-- ------------------------------------------------------------
alter table public.profiles add column if not exists password_hash text;
alter table public.profiles add column if not exists is_active boolean not null default true;
alter table public.profiles add column if not exists last_login_at timestamp with time zone;
alter table public.profiles add column if not exists failed_attempts integer not null default 0;
alter table public.profiles add column if not exists locked_until timestamp with time zone;

-- El rol 'despachador' se suma a los que ya existían
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
    check (role in ('client', 'courier', 'admin', 'despachador'));

-- ------------------------------------------------------------
-- 2. Sesiones activas
-- ------------------------------------------------------------
create table if not exists public.sessions (
    token text primary key,
    profile_id uuid not null references public.profiles(id) on delete cascade,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    expires_at timestamp with time zone not null,
    user_agent text
);

create index if not exists sessions_profile_idx on public.sessions(profile_id);

-- Ni las claves ni las sesiones se pueden leer con la llave pública:
-- solo las funciones de abajo, que son security definer, las tocan.
alter table public.sessions enable row level security;

-- ------------------------------------------------------------
-- 3. Entrar
--
-- Devuelve la sesión si la clave es correcta. Bloquea 15 minutos tras
-- 5 intentos fallidos, para que nadie adivine la clave a la fuerza.
-- ------------------------------------------------------------
create or replace function public.iniciar_sesion(p_usuario text, p_clave text)
returns table (
    ok boolean,
    motivo text,
    token text,
    profile_id uuid,
    nombre text,
    rol text
) as $$
declare
    v public.profiles%rowtype;
    v_token text;
begin
    -- Se puede entrar con el celular o con el correo
    select * into v from public.profiles
     where (phone_number = trim(p_usuario) or lower(email) = lower(trim(p_usuario)))
     limit 1;

    if v.id is null then
        return query select false, 'usuario_no_existe', null::text, null::uuid, null::text, null::text;
        return;
    end if;

    if not v.is_active then
        return query select false, 'inactivo', null::text, null::uuid, null::text, null::text;
        return;
    end if;

    if v.locked_until is not null and v.locked_until > now() then
        return query select false, 'bloqueado', null::text, null::uuid, null::text, null::text;
        return;
    end if;

    if v.password_hash is null then
        return query select false, 'sin_clave', null::text, null::uuid, null::text, null::text;
        return;
    end if;

    if v.password_hash <> crypt(p_clave, v.password_hash) then
        update public.profiles
           set failed_attempts = failed_attempts + 1,
               locked_until = case when failed_attempts + 1 >= 5
                                   then now() + interval '15 minutes' else null end
         where id = v.id;
        return query select false, 'clave_incorrecta', null::text, null::uuid, null::text, null::text;
        return;
    end if;

    v_token := encode(gen_random_bytes(32), 'hex');

    insert into public.sessions (token, profile_id, expires_at)
    values (v_token, v.id, now() + interval '30 days');

    update public.profiles
       set failed_attempts = 0, locked_until = null, last_login_at = now()
     where id = v.id;

    return query select true, 'ok', v_token, v.id,
                        trim(coalesce(v.first_name,'') || ' ' || coalesce(v.last_name,'')), v.role;
end;
$$ language plpgsql security definer;

-- ------------------------------------------------------------
-- 4. Comprobar que una sesión sigue viva
-- ------------------------------------------------------------
create or replace function public.validar_sesion(p_token text)
returns table (ok boolean, profile_id uuid, nombre text, rol text) as $$
    select true,
           p.id,
           trim(coalesce(p.first_name,'') || ' ' || coalesce(p.last_name,'')),
           p.role
      from public.sessions s
      join public.profiles p on p.id = s.profile_id
     where s.token = p_token
       and s.expires_at > now()
       and p.is_active;
$$ language sql security definer stable;

-- ------------------------------------------------------------
-- 5. Salir
-- ------------------------------------------------------------
create or replace function public.cerrar_sesion(p_token text)
returns void as $$
    delete from public.sessions where token = p_token;
$$ language sql security definer;

-- ------------------------------------------------------------
-- 6. Asignar o cambiar la clave de alguien
-- ------------------------------------------------------------
create or replace function public.asignar_clave(p_profile_id uuid, p_clave text)
returns boolean as $$
begin
    if length(p_clave) < 6 then
        return false;
    end if;
    update public.profiles
       set password_hash = crypt(p_clave, gen_salt('bf', 10)),
           failed_attempts = 0,
           locked_until = null
     where id = p_profile_id;
    return found;
end;
$$ language plpgsql security definer;

-- ------------------------------------------------------------
-- 7. Limpieza de sesiones vencidas
-- ------------------------------------------------------------
create or replace function public.limpiar_sesiones()
returns integer as $$
declare n integer;
begin
    delete from public.sessions where expires_at < now();
    get diagnostics n = row_count;
    return n;
end;
$$ language plpgsql security definer;
