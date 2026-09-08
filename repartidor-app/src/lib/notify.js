/* ============================================================
   Notificaciones push del navegador (Web Notifications API) +
   vibración y sonido corto. Sin servidor: se disparan localmente
   cuando la app detecta un pedido nuevo o un cambio de estado.
   ============================================================ */

export function notificationsSupported() {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function notificationPermission() {
  return notificationsSupported() ? Notification.permission : 'unsupported';
}

export async function requestNotificationPermission() {
  if (!notificationsSupported()) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  try {
    return await Notification.requestPermission();
  } catch {
    return 'denied';
  }
}

export function pushNotify(title, { body, tag, icon = '/icons/icon-192.png', vibrate = true, sound = true, onClick } = {}) {
  if (vibrate && typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate([180, 90, 180]);
  }
  if (sound) chime();

  if (!notificationsSupported() || Notification.permission !== 'granted') return null;
  try {
    const n = new Notification(title, { body, tag, icon, badge: icon, renotify: true });
    if (onClick) n.onclick = () => { window.focus(); onClick(); n.close(); };
    return n;
  } catch {
    return null;
  }
}

/* Campanita corta generada con WebAudio: no requiere archivo de sonido. */
let audioCtx = null;
export function chime() {
  try {
    if (typeof window === 'undefined') return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    audioCtx = audioCtx || new Ctx();
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const now = audioCtx.currentTime;
    [880, 1320].forEach((freq, i) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, now + i * 0.14);
      gain.gain.linearRampToValueAtTime(0.16, now + i * 0.14 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.14 + 0.3);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start(now + i * 0.14);
      osc.stop(now + i * 0.14 + 0.32);
    });
  } catch { /* audio bloqueado por el navegador */ }
}
