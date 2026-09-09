-- ============================================================
-- Domix — Migración 04: bandeja de WhatsApp
--
-- Los pedidos que llegan por WhatsApp caen aquí, la IA propone un
-- borrador y el despachador lo confirma. Al confirmar se crea un
-- service_requests normal, así que el repartidor no distingue si el
-- pedido vino de la app o de un chat.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Una conversación por número
-- ------------------------------------------------------------
create table if not exists public.whatsapp_conversations (
    id uuid default uuid_generate_v4() primary key,
    wa_id text not null unique,                 -- número en formato internacional
    display_name text,
    last_message_at timestamp with time zone,
    last_message_preview text,
    unread_count integer not null default 0,
    status text not null default 'abierta'
        check (status in ('abierta', 'atendida', 'cerrada')),

    -- Lo que la IA entendió del chat, para que el despachador solo confirme
    ai_draft jsonb,
    ai_draft_at timestamp with time zone,

    -- Si ya se convirtió en pedido, aquí queda el vínculo
    request_id uuid references public.service_requests(id) on delete set null,

    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists wa_conv_last_msg_idx
    on public.whatsapp_conversations(last_message_at desc);

-- ------------------------------------------------------------
-- 2. Los mensajes de cada conversación
-- ------------------------------------------------------------
create table if not exists public.whatsapp_messages (
    id uuid default uuid_generate_v4() primary key,
    conversation_id uuid not null references public.whatsapp_conversations(id) on delete cascade,
    wa_message_id text unique,                  -- el id que asigna Meta, evita duplicados
    direction text not null check (direction in ('entrante', 'saliente')),
    body text,
    media_url text,
    media_type text,
    -- quién lo escribió: el cliente, alguien de Domix, o la IA
    author text not null default 'cliente' check (author in ('cliente', 'domix', 'ia')),
    status text default 'recibido',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists wa_msg_conv_idx
    on public.whatsapp_messages(conversation_id, created_at);

-- ------------------------------------------------------------
-- 3. Acceso
--
-- El panel usa la llave pública, igual que el resto del sistema.
-- Cuando se activen las claves por rol (pendiente), estas políticas
-- deben restringirse a los roles de admin y despachador.
-- ------------------------------------------------------------
alter table public.whatsapp_conversations enable row level security;
alter table public.whatsapp_messages enable row level security;

drop policy if exists "Panel gestiona las conversaciones" on public.whatsapp_conversations;
create policy "Panel gestiona las conversaciones"
    on public.whatsapp_conversations for all using (true) with check (true);

drop policy if exists "Panel gestiona los mensajes" on public.whatsapp_messages;
create policy "Panel gestiona los mensajes"
    on public.whatsapp_messages for all using (true) with check (true);

-- ------------------------------------------------------------
-- 4. Cada mensaje actualiza el resumen de su conversación,
--    para que la bandeja se ordene sola sin consultas pesadas.
-- ------------------------------------------------------------
create or replace function public.actualizar_resumen_conversacion()
returns trigger as $$
begin
    update public.whatsapp_conversations
       set last_message_at = new.created_at,
           last_message_preview = left(coalesce(new.body, '[archivo]'), 120),
           unread_count = case
               when new.direction = 'entrante' then unread_count + 1
               else unread_count
           end,
           status = case
               when new.direction = 'entrante' and status = 'cerrada' then 'abierta'
               else status
           end
     where id = new.conversation_id;
    return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_resumen_conversacion on public.whatsapp_messages;
create trigger trg_resumen_conversacion
    after insert on public.whatsapp_messages
    for each row execute function public.actualizar_resumen_conversacion();

-- ------------------------------------------------------------
-- 5. De dónde vino el pedido: la app, WhatsApp o el panel
-- ------------------------------------------------------------
alter table public.service_requests
    drop constraint if exists service_requests_source_check;

alter table public.service_requests
    add constraint service_requests_source_check
    check (source in ('whatsapp', 'app', 'admin'));

-- La conversación que originó el pedido, para volver al chat desde el pedido
alter table public.service_requests
    add column if not exists conversation_id uuid references public.whatsapp_conversations(id) on delete set null;

-- ------------------------------------------------------------
-- 6. Realtime, para que la bandeja aparezca sin recargar
-- ------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'whatsapp_messages'
  ) then
    alter publication supabase_realtime add table public.whatsapp_messages;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'whatsapp_conversations'
  ) then
    alter publication supabase_realtime add table public.whatsapp_conversations;
  end if;
end $$;
