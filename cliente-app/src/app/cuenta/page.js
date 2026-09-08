'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import BottomNav from '../../components/BottomNav';
import ModeSwitch from '../../components/ModeSwitch';
import { Icon, Row, Field, Button, Pill, SectionTitle } from '../../components/ui';
import { useClientSession } from '../../context/ClientSessionProvider';
import { useTheme } from '../../context/ThemeProvider';
import { notificationPermission, requestNotificationPermission } from '../../lib/notify';

const WHATSAPP = 'https://wa.me/573157924906';

const TEMAS = [
  { id: 'light', label: 'Claro', icon: 'light_mode' },
  { id: 'dark', label: 'Oscuro', icon: 'dark_mode' },
  { id: 'auto', label: 'Auto', icon: 'brightness_auto' },
];

export default function CuentaPage() {
  const router = useRouter();
  const { client, saveClient, clearClient } = useClientSession();
  const { theme, changeTheme } = useTheme();
  const [form, setForm] = useState({ name: '', phone: '' });
  const [saved, setSaved] = useState(false);
  const [perm, setPerm] = useState('default');

  useEffect(() => {
    setForm({ name: client?.name || '', phone: client?.phone || '' });
    setPerm(notificationPermission());
  }, [client]);

  const guardar = (e) => {
    e.preventDefault();
    saveClient({ name: form.name, phone: form.phone });
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  };

  return (
    <>
      <div className="sb" style={{ position: 'absolute', inset: 0, overflowY: 'auto', padding: '10px 0 100px', animation: 'trFade .3s ease' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px 18px' }}>
          <div style={{ font: '800 26px Manrope,sans-serif', letterSpacing: '-.035em' }}>Cuenta</div>
          <ModeSwitch compact />
        </div>

        <div style={{ padding: '0 16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 16, borderRadius: 16, background: 'var(--sf)' }}>
            <span style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '800 18px Manrope,sans-serif', flex: 'none' }}>
              {(client?.name?.[0] || 'D').toUpperCase()}
            </span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: 'block', font: '800 17px Manrope,sans-serif', letterSpacing: '-.02em' }}>
                {client?.name || 'Invitado'}
              </span>
              <span style={{ display: 'block', font: '500 12.5px Manrope,sans-serif', color: 'var(--mu)', marginTop: 2 }}>
                {client?.phone || 'Sin registro · pides como invitado'}
              </span>
            </span>
          </div>
        </div>

        <SectionTitle>Tus datos</SectionTitle>
        <form onSubmit={guardar} style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
          <Field label="Nombre" icon="person" placeholder="¿Cómo te llamas?" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          <Field label="Celular (WhatsApp)" icon="call" type="tel" placeholder="315 792 4906" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
          <Button type="submit" variant={saved ? 'green' : 'solid'} icon={saved ? 'check' : 'save'}>
            {saved ? 'Guardado' : 'Guardar datos'}
          </Button>
          <div style={{ font: '500 11.5px/1.5 Manrope,sans-serif', color: 'var(--mu)', textAlign: 'center' }}>
            Se guardan solo en este teléfono, para no volver a escribirlos.
          </div>
        </form>

        <SectionTitle>Apariencia</SectionTitle>
        <div style={{ padding: '0 16px', display: 'flex', gap: 9, marginBottom: 24 }}>
          {TEMAS.map((t) => {
            const on = theme === t.id;
            return (
              <button
                key={t.id}
                onClick={() => changeTheme(t.id)}
                style={{
                  flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '15px 8px',
                  borderRadius: 14, font: '700 12.5px Manrope,sans-serif',
                  background: on ? 'var(--inv)' : 'var(--sf)', color: on ? 'var(--invtx)' : 'var(--tx)',
                }}
              >
                <Icon name={t.icon} size={21} fill={on} />
                {t.label}
              </button>
            );
          })}
        </div>

        <SectionTitle>Preferencias</SectionTitle>
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 24 }}>
          <Row
            icon={perm === 'granted' ? 'notifications_active' : 'notifications_off'}
            iconBg={perm === 'granted' ? 'var(--greenS)' : undefined}
            title="Avisos de tu pedido"
            subtitle="Te avisamos cuando el repartidor sale y cuando llega"
            onClick={async () => setPerm(await requestNotificationPermission())}
            right={perm === 'granted' ? <Pill tone="green" icon="check">Activos</Pill> : <Pill>Activar</Pill>}
          />
          <a href={WHATSAPP} target="_blank" rel="noreferrer" style={{ color: 'var(--tx)' }}>
            <Row
              icon="support_agent"
              title="Ayuda y soporte"
              subtitle="WhatsApp 315 792 4906"
              right={<Icon name="open_in_new" size={18} color="var(--mu)" />}
            />
          </a>
        </div>

        {client?.phone && (
          <div style={{ padding: '0 16px' }}>
            <Button variant="outline" icon="logout" onClick={() => { clearClient(); router.push('/'); }} style={{ color: 'var(--red)' }}>
              Olvidar mis datos
            </Button>
          </div>
        )}

        <div style={{ textAlign: 'center', font: '500 11px Manrope,sans-serif', color: 'var(--mu)', marginTop: 26 }}>
          Domix · Mensajería &amp; Logística · Buenaventura
        </div>
      </div>

      <BottomNav />
    </>
  );
}
