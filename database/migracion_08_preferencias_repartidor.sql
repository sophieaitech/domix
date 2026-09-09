-- ============================================================
-- Domix — Migración 08: preferencias del repartidor
--
-- En la pantalla de Cuenta había tres filas con flechita que no
-- hacían nada al tocarlas: zona de trabajo, horario preferido y
-- ayuda. Las dos primeras necesitan dónde guardarse.
--
-- La zona importa de verdad: es la que decide a quién se le ofrece
-- cada pedido. Que el repartidor pueda cambiarla desde el teléfono
-- evita tener que llamar a la oficina cuando se mueve de sector.
-- ============================================================

create or replace function guardar_preferencias(
    p_courier_id uuid,
    p_zona       text,
    p_horario    text
) returns public.courier_profiles as $fn$
declare
    v_perfil public.courier_profiles;
begin
    if coalesce(trim(coalesce(p_zona, '')), '') = '' then
        raise exception 'La zona de trabajo no puede quedar vacía';
    end if;

    update public.courier_profiles
       set work_zone = trim(p_zona),
           preferred_schedule = nullif(trim(coalesce(p_horario, '')), '')
     where id = p_courier_id
    returning * into v_perfil;

    if v_perfil.id is null then
        raise exception 'No encontramos ese repartidor';
    end if;

    return v_perfil;
end;
$fn$ language plpgsql security definer;
