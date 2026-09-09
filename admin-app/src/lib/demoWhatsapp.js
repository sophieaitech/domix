/* Conversaciones de ejemplo para el modo Demo: así se ve la bandeja
   antes de conectar el número real de WhatsApp Business. */

const hace = (min) => new Date(Date.now() - min * 60000).toISOString();

export const CONVERSACIONES_DEMO = [
  {
    id: 'demo-wa-1',
    wa_id: '573124567890',
    display_name: 'Marisol Angulo',
    status: 'abierta',
    unread_count: 2,
    last_message_at: hace(3),
    last_message_preview: 'Sí, en el Centro. Es para el hospital, que llegue rapidito por favor',
    mensajes: [
      { direction: 'entrante', body: 'Buenas tardes, necesito enviar unos papeles', created_at: hace(9) },
      { direction: 'saliente', body: 'Con gusto. ¿Desde dónde los recogemos y a dónde van?', created_at: hace(7), author: 'domix' },
      { direction: 'entrante', body: 'Sí, en el Centro. Es para el hospital, que llegue rapidito por favor', created_at: hace(3) },
    ],
  },
  {
    id: 'demo-wa-2',
    wa_id: '573001112233',
    display_name: 'Tienda La Bahía',
    status: 'abierta',
    unread_count: 1,
    last_message_at: hace(12),
    last_message_preview: 'Tengo 3 pedidos para despachar hoy en Pueblo Nuevo y Bellavista',
    mensajes: [
      { direction: 'entrante', body: 'Hola, buenas. Somos Tienda La Bahía en el Jorge', created_at: hace(16) },
      { direction: 'entrante', body: 'Tengo 3 pedidos para despachar hoy en Pueblo Nuevo y Bellavista', created_at: hace(12) },
    ],
  },
  {
    id: 'demo-wa-3',
    wa_id: '573155558899',
    display_name: 'Don Jairo',
    status: 'atendida',
    unread_count: 0,
    last_message_at: hace(48),
    last_message_preview: 'Listo, muchas gracias',
    mensajes: [
      { direction: 'entrante', body: 'Necesito que me hagan una vuelta en la EPS, recoger una autorización', created_at: hace(62) },
      { direction: 'saliente', body: 'Claro que sí, don Jairo. ¿En cuál EPS y a nombre de quién?', created_at: hace(58), author: 'domix' },
      { direction: 'entrante', body: 'En la del Centro, a nombre mío, Jairo Riascos', created_at: hace(54) },
      { direction: 'saliente', body: 'Perfecto, ya le asignamos un mensajero. Son $8.000.', created_at: hace(50), author: 'domix' },
      { direction: 'entrante', body: 'Listo, muchas gracias', created_at: hace(48) },
    ],
  },
];

/* Borradores que la IA propondría, para poder mostrar el flujo completo
   en Demo sin gastar llamadas reales. */
export const BORRADORES_DEMO = {
  'demo-wa-1': {
    es_pedido: true,
    service_type: 'mensajeria',
    contact_name: 'Marisol Angulo',
    contact_phone: '3124567890',
    pickup_address: 'Centro',
    dropoff_address: 'Hospital Departamental',
    description: 'Envío de documentos. La clienta pide que llegue rápido.',
    turbo: true,
    confianza: 'media',
    falta: ['Dirección exacta de recogida en el Centro'],
    respuesta_sugerida:
      '¡Con gusto, Marisol! Para recogerlos, ¿me confirma la dirección exacta en el Centro? Al ser urgente se lo mandamos en Domix Turbo, llega en menos de 20 minutos.',
  },
  'demo-wa-2': {
    es_pedido: true,
    service_type: 'domicilio',
    contact_name: 'Tienda La Bahía',
    contact_phone: '3001112233',
    pickup_address: 'El Jorge',
    dropoff_address: 'Pueblo Nuevo y Bellavista',
    description: 'Tres despachos del día para una tienda. Hay que separarlos en pedidos distintos.',
    turbo: false,
    confianza: 'baja',
    falta: ['Direcciones de cada uno de los 3 destinos', 'Nombre y teléfono de cada destinatario'],
    respuesta_sugerida:
      '¡Hola! Claro que sí. Para organizarlos, ¿nos pasa la dirección y el nombre de quien recibe en cada uno de los tres? Así le asignamos el repartidor de una vez.',
  },
  'demo-wa-3': {
    es_pedido: true,
    service_type: 'autorizacion_medica',
    contact_name: 'Jairo Riascos',
    contact_phone: '3155558899',
    pickup_address: 'EPS del Centro',
    dropoff_address: 'Domicilio de Jairo Riascos',
    description: 'Recoger autorización médica en la EPS del Centro.',
    turbo: false,
    confianza: 'media',
    falta: ['Dirección de entrega del cliente'],
    respuesta_sugerida:
      'Don Jairo, ¿a qué dirección le llevamos la autorización cuando la recojamos?',
  },
};
