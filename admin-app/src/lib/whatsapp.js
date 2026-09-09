import { supabase } from './supabaseClient';

export const ESTADOS_CONV = {
  abierta: { label: 'Sin atender', tone: 'amber' },
  atendida: { label: 'Atendida', tone: 'navy' },
  cerrada: { label: 'Cerrada', tone: 'default' },
};

export async function fetchConversaciones() {
  const { data, error } = await supabase
    .from('whatsapp_conversations')
    .select('*')
    .order('last_message_at', { ascending: false, nullsFirst: false })
    .limit(60);
  if (error) throw error;
  return data || [];
}

export async function fetchMensajes(conversationId) {
  const { data, error } = await supabase
    .from('whatsapp_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function marcarLeida(conversationId) {
  return supabase
    .from('whatsapp_conversations')
    .update({ unread_count: 0 })
    .eq('id', conversationId);
}

export async function cambiarEstado(conversationId, status) {
  return supabase
    .from('whatsapp_conversations')
    .update({ status })
    .eq('id', conversationId);
}

/* Guarda el borrador que armó la IA, para que no haya que releer el chat
   cada vez que alguien abre la conversación. */
export async function guardarBorrador(conversationId, draft) {
  return supabase
    .from('whatsapp_conversations')
    .update({ ai_draft: draft, ai_draft_at: new Date().toISOString() })
    .eq('id', conversationId);
}

/* El mensaje sale por la API de Meta a través de una función del servidor.
   Aquí solo queda registrado para que la conversación se vea completa. */
export async function registrarSalida(conversationId, body, author = 'domix') {
  return supabase
    .from('whatsapp_messages')
    .insert({ conversation_id: conversationId, direction: 'saliente', body, author, status: 'enviando' });
}

/* Escucha en vivo: la bandeja se mueve sola cuando entra un mensaje. */
export function suscribirBandeja(onCambio) {
  const canal = supabase
    .channel('bandeja-whatsapp')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'whatsapp_messages' }, onCambio)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'whatsapp_conversations' }, onCambio)
    .subscribe();
  return () => supabase.removeChannel(canal);
}
