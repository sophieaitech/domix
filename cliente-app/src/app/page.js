'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import BottomNav from '../components/BottomNav';
import { Icon, Card, HeroCard, Overline, Chip, Button } from '../components/ui';
import { useClientSession } from '../context/ClientSessionProvider';
import { useAppMode } from '../context/AppModeProvider';
import ModeSwitch from '../components/ModeSwitch';
import ThemeToggle from '../components/ThemeToggle';
import { SERVICES, fetchMyRequests, listDemoRequests, serviceInfo, STATUS_STEPS } from '../lib/services';
import { DEFAULT_RULES } from '../lib/pricing';

const money = (n) => `$${Math.round(n || 0).toLocaleString('es-CO')}`;
const WHATSAPP = 'https://wa.me/573157924906';

export default function InicioPage() {
  const router = useRouter();
  const { client, ready } = useClientSession();
  const { isDemo } = useAppMode();
  const [activo, setActivo] = useState(null);
  const [pendientes, setPendientes] = useState(0);

  useEffect(() => {
    if (!ready) return;
    const apply = (rows) => {
      const abiertos = rows.filter((r) => r.status !== 'delivered' && r.status !== 'cancelled');
      setActivo(abiertos[0] || null);
      setPendientes(abiertos.length);
    };
    if (isDemo) {
      apply(listDemoRequests(client?.phone));
      const t = setInterval(() => apply(listDemoRequests(client?.phone)), 4000);
      return () => clearInterval(t);
    }
    if (!client?.phone) return;
    fetchMyRequests(client.phone).then(apply).catch(() => {});
  }, [ready, client?.phone, isDemo]);

  return (
    <>
      <header className="dx-topbar" style={{ justifyContent: 'space-between' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 40, height: 40, borderRadius: 'var(--sh-sm)', background: 'linear-gradient(150deg,#2A241E,#17140F)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
            <Icon name="two_wheeler" size={22} fill color="#fff" />
          </span>
          <span>
            <span className="dsp" style={{ display: 'block', fontWeight: 800, fontSize: 19, lineHeight: 1 }}>
              Domi<span style={{ color: 'var(--secondary)' }}>X</span>
            </span>
            <span style={{ display: 'block', fontSize: 9.5, fontWeight: 800, letterSpacing: '.1em', color: 'var(--on-surface-variant)', marginTop: 2 }}>
              MENSAJERÍA &amp; LOGÍSTICA
            </span>
          </span>
        </span>
        <ThemeToggle compact />
        <ModeSwitch compact />
      </header>

      <div className="dx-page sc">
        <HeroCard glow="orange">
          <Overline style={{ color: 'rgba(255,255,255,.55)' }}>Buenaventura y alrededores</Overline>
          <div className="dsp" style={{ fontWeight: 800, fontSize: 26, lineHeight: 1.14, marginTop: 8 }}>
            Tú lo necesitas,<br />nosotros lo llevamos.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14 }}>
            <Chip icon="bolt" bg="rgba(255,255,255,.12)" color="#A9D98F">Desde $6.000</Chip>
            <Chip icon="verified_user" bg="rgba(255,255,255,.12)" color="#A9D98F">Seguro y confiable</Chip>
          </div>
          <Button full icon="add" color="var(--primary)" onClick={() => router.push('/pedir')} style={{ marginTop: 18 }}>
            Pedir un servicio
          </Button>
        </HeroCard>

        {activo && (
          <Card
            elevation={2}
            style={{ marginTop: 14, padding: 15, borderLeft: '4px solid var(--primary)', cursor: 'pointer' }}
            onClick={() => router.push(`/seguimiento/${activo.tracking_code}`)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ width: 42, height: 42, borderRadius: 'var(--sh-sm)', background: 'var(--tertiary-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
                <Icon name={serviceInfo(activo.service_type).icon} size={21} color="var(--on-tertiary-container)" />
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <Overline style={{ color: 'var(--tertiary)', fontSize: 9.5 }}>Pedido en curso</Overline>
                <span style={{ display: 'block', fontWeight: 700, fontSize: 14, marginTop: 2 }}>
                  {STATUS_STEPS.find((s) => s.id === activo.status)?.desc || 'En proceso'}
                </span>
                <span style={{ display: 'block', fontSize: 11.5, color: 'var(--on-surface-variant)', marginTop: 1 }}>#{activo.tracking_code}</span>
              </span>
              <Icon name="chevron_right" size={22} color="var(--outline)" />
            </div>
          </Card>
        )}

        <button
          onClick={() => router.push('/pedir?turbo=1')}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 13, marginTop: 12, padding: 15,
            borderRadius: 'var(--sh-lg)', textAlign: 'left', color: '#fff',
            background: 'linear-gradient(135deg,#57A82F 0%,#43922B 48%,#2F6B1C 100%)',
            boxShadow: '0 10px 26px rgba(27,79,143,.3)',
          }}
        >
          <span style={{ width: 46, height: 46, borderRadius: 'var(--sh-sm)', background: 'rgba(255,255,255,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
            <Icon name="bolt" size={24} fill color="#fff" />
          </span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: 'block', fontSize: 10, fontWeight: 800, letterSpacing: '.1em', opacity: .85 }}>ENTREGA PRIORITARIA</span>
            <span className="dsp" style={{ display: 'block', fontWeight: 800, fontSize: 17, marginTop: 2 }}>Domix Turbo</span>
            <span style={{ display: 'block', fontSize: 11.5, marginTop: 2, opacity: .9 }}>
              Tu envío primero en la fila · +{money(DEFAULT_RULES.turboFee)}
            </span>
          </span>
          <Icon name="chevron_right" size={22} color="rgba(255,255,255,.85)" />
        </button>

        <Overline style={{ color: 'var(--on-surface-variant)', margin: '20px 0 10px' }}>Nuestros servicios</Overline>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {SERVICES.map((s) => (
            <Card key={s.value} style={{ padding: 0, overflow: 'hidden' }}>
              <button
                onClick={() => router.push(`/pedir?tipo=${s.value}`)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 13, padding: '14px 15px', textAlign: 'left', background: 'transparent' }}
              >
                <span style={{ width: 46, height: 46, borderRadius: 'var(--sh-sm)', background: 'var(--primary-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
                  <Icon name={s.icon} size={23} color="var(--on-primary-container)" />
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', fontWeight: 800, fontSize: 14.5 }}>{s.label}</span>
                  <span style={{ display: 'block', fontSize: 12, color: 'var(--on-surface-variant)', marginTop: 2, lineHeight: 1.35 }}>{s.desc}</span>
                </span>
                <span style={{ flex: 'none', textAlign: 'right' }}>
                  <span style={{ display: 'block', fontSize: 9.5, fontWeight: 800, color: 'var(--on-surface-variant)', letterSpacing: '.06em' }}>DESDE</span>
                  <span className="dsp" style={{ display: 'block', fontWeight: 800, fontSize: 15, color: 'var(--secondary)' }}>{money(s.from)}</span>
                </span>
              </button>
            </Card>
          ))}
        </div>

        <Card tone="low" style={{ marginTop: 16, padding: 15, display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ width: 42, height: 42, borderRadius: 'var(--sh-sm)', background: 'var(--secondary-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
            <Icon name="support_agent" size={21} color="var(--on-secondary-container)" />
          </span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: 'block', fontWeight: 700, fontSize: 13.5 }}>¿Prefieres WhatsApp?</span>
            <span style={{ display: 'block', fontSize: 12, color: 'var(--on-surface-variant)', marginTop: 1 }}>315 792 4906 · atención inmediata</span>
          </span>
          <a href={WHATSAPP} target="_blank" rel="noreferrer" style={{ flex: 'none' }}>
            <Icon name="open_in_new" size={19} color="var(--on-surface-variant)" />
          </a>
        </Card>
      </div>

      <BottomNav badges={{ '/pedidos': pendientes }} />
    </>
  );
}
