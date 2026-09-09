import { supabase } from './supabaseClient';

/* Retiros y documentos vistos desde el panel.

   Lo que se aprueba aquí mueve plata de verdad y habilita a alguien a
   salir a rodar, así que las dos operaciones pasan por funciones de la
   base: no se editan filas a mano desde el navegador. */

export const ESTADO_RETIRO = {
  pending: { label: 'Por pagar', tono: 'amber', icon: 'schedule' },
  paid: { label: 'Consignado', tono: 'green', icon: 'check_circle' },
  rejected: { label: 'Negado', tono: 'red', icon: 'cancel' },
  failed: { label: 'Falló', tono: 'red', icon: 'error' },
};

export const METODOS = {
  nequi: 'Nequi',
  daviplata: 'Daviplata',
  bancolombia: 'Bancolombia',
  efectivo: 'Efectivo en sede',
};

export const DOC_LABEL = {
  cedula: 'Cédula',
  licencia: 'Licencia de conducción',
  soat: 'SOAT',
  tarjeta_propiedad: 'Tarjeta de propiedad',
};

export const DOC_ESTADO = {
  pending: { label: 'Por revisar', tono: 'amber', icon: 'schedule' },
  approved: { label: 'Aprobada', tono: 'green', icon: 'verified' },
  expiring_soon: { label: 'Vence pronto', tono: 'amber', icon: 'error' },
  rejected: { label: 'Rechazada', tono: 'red', icon: 'cancel' },
};

export async function fetchRetiros() {
  const { data } = await supabase
    .from('retiros_pendientes')
    .select('*')
    .limit(200);
  return data || [];
}

export async function resolverRetiro(id, estado, referencia, nota) {
  const { error } = await supabase.rpc('resolver_retiro', {
    p_retiro_id: id,
    p_estado: estado,
    p_referencia: referencia || null,
    p_nota: nota || null,
  });
  return { error };
}

export async function fetchDocumentos() {
  const { data } = await supabase
    .from('courier_documents')
    .select('*')
    .order('uploaded_at', { ascending: false, nullsFirst: false })
    .limit(400);
  return data || [];
}

export async function revisarDocumento(id, estado, nota) {
  const { error } = await supabase.rpc('revisar_documento', {
    p_doc_id: id,
    p_estado: estado,
    p_nota: nota || null,
  });
  return { error };
}

/* Los documentos viven en un balde privado. Para verlos se pide un
   enlace que caduca a los dos minutos. */
export async function enlaceDocumento(path, segundos = 120) {
  if (!path) return null;
  const { data } = await supabase.storage.from('documentos').createSignedUrl(path, segundos);
  return data?.signedUrl || null;
}

export async function fetchVehiculos() {
  const { data } = await supabase.from('vehicles').select('*').eq('is_active', true);
  return data || [];
}

export const money = (n) => `$${Math.round(Number(n) || 0).toLocaleString('es-CO')}`;

export function haceCuanto(iso) {
  if (!iso) return '';
  const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 1) return 'ahora';
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  return `hace ${d} ${d === 1 ? 'día' : 'días'}`;
}

/* Cuánto trabajo de oficina hay represado: retiros por consignar más
   documentos por revisar. Es el número del menú lateral. */
export async function contarPendientes() {
  const [{ count: retiros }, { count: documentos }] = await Promise.all([
    supabase.from('payouts').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('courier_documents').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
  ]);
  return (retiros || 0) + (documentos || 0);
}
