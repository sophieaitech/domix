-- ============================================================
-- Domix — Migración 06: sacar las claves de profiles
--
-- La migración anterior dejó password_hash dentro de profiles, y esa
-- tabla se lee con la llave pública: cualquiera podía descargarse todos
-- los hashes y descifrarlos con calma. Aquí se mueven a su propia tabla,
-- cerrada igual que la de los PIN de entrega.
-- ============================================================

create table if not exists public.auth_credentials (
    profile_id uuid primary key references public.profiles(id) on delete cascade,
    password_hash text not null,
    failed_attempts integer not null default 0,
    locked_until timestamp with time zone,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Sin políticas: la llave pública no puede leer ni escribir aquí.
alter table public.auth_credentials enable row level security;

-- Mudar lo que ya existía, solo si la columna vieja todavía está.
-- Así la migración se puede volver a correr sin fallar.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'password_hash'
  ) then
    execute $mig$
      insert into public.auth_credentials (profile_id, password_hash, failed_attempts, locked_until)
      select id, password_hash, coalesce(failed_attempts, 0), locked_until
      from public.profiles
      where password_hash is not null
      on conflict (profile_id) do nothing
    $mig$;
  end if;
end $$;

alter table public.profiles drop column if exists password_hash;
alter table public.profiles drop column if exists failed_attempts;
alter table public.profiles drop column if exists locked_until;

-- ------------------------------------------------------------
-- Las funciones ahora leen de la tabla cerrada
-- ------------------------------------------------------------
drop function if exists public.iniciar_sesion(text, text);

create or replace function public.iniciar_sesion(p_usuario text, p_clave text)
returns table (ok boolean, motivo text, token text, profile_id uuid, nombre text, rol text) as $$
declare
    v public.profiles%rowtype;
    c public.auth_credentials%rowtype;
    v_token text;
begin
    select * into v from public.profiles
     where phone_number = trim(p_usuario) or lower(email) = lower(trim(p_usuario))
     limit 1;

    if v.id is null then
        return query select false, 'usuario_no_existe', null::text, null::uuid, null::text, null::text;
        return;
    end if;

    if not v.is_active then
        return query select false, 'inactivo', null::text, null::uuid, null::text, null::text;
        return;
    end if;

    select * into c from public.auth_credentials ac where ac.profile_id = v.id;

    if c.profile_id is null then
        return query select false, 'sin_clave', null::text, null::uuid, null::text, null::text;
        return;
    end if;

    if c.locked_until is not null and c.locked_until > now() then
        return query select false, 'bloqueado', null::text, null::uuid, null::text, null::text;
        return;
    end if;

    if c.password_hash <> crypt(p_clave, c.password_hash) then
        update public.auth_credentials
           set failed_attempts = failed_attempts + 1,
               locked_until = case when failed_attempts + 1 >= 5
                                   then now() + interval '15 minutes' else null end
         where auth_credentials.profile_id = v.id;
        return query select false, 'clave_incorrecta', null::text, null::uuid, null::text, null::text;
        return;
    end if;

    v_token := encode(gen_random_bytes(32), 'hex');
    insert into public.sessions (token, profile_id, expires_at)
    values (v_token, v.id, now() + interval '30 days');

    update public.auth_credentials set failed_attempts = 0, locked_until = null where auth_credentials.profile_id = v.id;
    update public.profiles set last_login_at = now() where id = v.id;

    return query select true, 'ok', v_token, v.id,
                        trim(coalesce(v.first_name,'') || ' ' || coalesce(v.last_name,'')), v.role;
end;
$$ language plpgsql security definer;

create or replace function public.asignar_clave(p_profile_id uuid, p_clave text)
returns boolean as $$
begin
    if length(p_clave) < 6 then
        return false;
    end if;
    insert into public.auth_credentials (profile_id, password_hash)
    values (p_profile_id, crypt(p_clave, gen_salt('bf', 10)))
    on conflict (profile_id) do update
        set password_hash = excluded.password_hash,
            failed_attempts = 0,
            locked_until = null,
            updated_at = now();
    return true;
end;
$$ language plpgsql security definer;
