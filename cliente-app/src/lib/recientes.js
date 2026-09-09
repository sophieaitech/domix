/* Direcciones que el cliente ya usó. Lo que hace fluida una app de
   pedidos no es el buscador: es no tener que volver a escribir la misma
   dirección de siempre. Se guardan solo en el teléfono. */

const KEY = 'domix_direcciones';
const MAX = 6;

export function leerRecientes() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function guardarReciente({ address, point }) {
  if (!address || !point) return;
  try {
    const previas = leerRecientes().filter((d) => d.address !== address);
    const lista = [{ address, point, usos: 1, ultimo: Date.now() }, ...previas].slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(lista));
  } catch { /* ignorar */ }
}
