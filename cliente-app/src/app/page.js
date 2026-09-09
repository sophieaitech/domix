'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import BottomNav from '../components/BottomNav';
import ModeSwitch from '../components/ModeSwitch';
import ThemeToggle from '../components/ThemeToggle';
import { Icon, Wordmark, SectionTitle, Row, ForYouItem } from '../components/ui';
import { useClientSession } from '../context/ClientSessionProvider';
import { useAppMode } from '../context/AppModeProvider';
import { SERVICES, fetchMyRequests, listDemoRequests, STATUS_STEPS } from '../lib/services';
import { money } from '../lib/pricing';

const WHATSAPP = 'https://wa.me/573157924906';

/* Las dos formas de pedir: enviar algo, o que te traigan algo. */
const TABS = [
  { id: 'enviar', label: 'Enviar', img: '/assets/svc-envio.png' },
  { id: 'traer', label: 'Que me traigan', img: '/assets/svc-moto.png' },
];

/* "Para ti" muestra los cinco servicios de Domix, en el mismo orden y con
   los mismos nombres del flyer. La fila se desliza, así que caben todos. */
const PARA_TI = {
  enviar: [
    { name: 'Mensajería', img: '/assets/svc-moto.png', tipo: 'mensajeria' },
    { name: 'Autorizaciones médicas', img: '/assets/svc-hora.png', tipo: 'autorizacion_medica' },
    { name: 'Encomiendas', img: '/assets/svc-envio.png', tipo: 'encomienda' },
    { name: 'Domicilios', img: '/assets/svc-carro.png', tipo: 'domicilio' },
    { name: 'Mandados', img: '/assets/svc-reserva.png', tipo: 'mandado' },
  ],
  traer: [
    { name: 'Domicilios', img: '/assets/svc-carro.png', tipo: 'domicilio' },
    { name: 'Mandados', img: '/assets/svc-reserva.png', tipo: 'mandado' },
    { name: 'Encomiendas', img: '/assets/svc-envio.png', tipo: 'encomienda' },
    { name: 'Mensajería', img: '/assets/svc-moto.png', tipo: 'mensajeria' },
    { name: 'Turbo', img: '/assets/svc-hora.png', tipo: 'domicilio', turbo: true },
  ],
};

const ATAJOS = [
  { name: 'Terminal Marítimo', addr: 'Cra. 1 #1-50, Comuna 3, Buenaventura', icon: 'home' },
  { name: 'Hospital Departamental', addr: 'Cra. 2 #4-40 · autorizaciones médicas', icon: 'local_hospital', note: 'Trámites en el día' },
];

export default function InicioPage() {
  const router = useRouter();
  const { client, ready } = useClientSession();
  const { isDemo } = useAppMode();
  const [tab, setTab] = useState('enviar');
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

  const go = (tipo, turbo) => router.push(`/pedir?tipo=${tipo}${turbo ? '&turbo=1' : ''}`);

  return (
    <>
      <div className="sb" style={{ position: 'absolute', inset: 0, overflowY: 'auto', padding: '4px 0 100px', animation: 'trFade .3s ease' }}>

        {/* Marca + acciones */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '10px 16px 14px' }}>
          <Wordmark />
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, flex: 'none' }}>
            <ThemeToggle compact />
            <ModeSwitch compact />
          </div>
        </div>

        {/* Pestañas Enviar / Que me traigan */}
        <div style={{ display: 'flex', gap: 26, justifyContent: 'center', padding: '0 16px', borderBottom: '1px solid var(--bd2)', marginBottom: 18 }}>
          {TABS.map((t) => {
            const on = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '4px 2px 12px',
                  borderBottom: `2.5px solid ${on ? 'var(--tx)' : 'transparent'}`,
                  color: on ? 'var(--tx)' : 'var(--mu)', marginBottom: -1,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={t.img} alt="" style={{ width: 30, height: 30, objectFit: 'contain', filter: on ? 'none' : 'grayscale(1)', opacity: on ? 1 : 0.5 }} />
                <span style={{ font: '700 16px Manrope,sans-serif', letterSpacing: '-.02em' }}>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Buscador principal */}
        <div style={{ padding: '0 16px 20px' }}>
          <button
            onClick={() => go(tab === 'enviar' ? 'encomienda' : 'domicilio')}
            style={{ display: 'flex', alignItems: 'center', width: '100%', height: 60, borderRadius: 99, background: 'var(--sf)', padding: '0 6px 0 18px', gap: 12, boxShadow: 'var(--sh2)' }}
          >
            <Icon name="search" size={21} />
            <span style={{ flex: 1, textAlign: 'left', font: '700 17px Manrope,sans-serif', letterSpacing: '-.02em' }}>
              {tab === 'enviar' ? '¿Qué vas a enviar?' : '¿Qué necesitas?'}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, height: 48, padding: '0 15px', borderRadius: 99, background: 'var(--bg)', boxShadow: 'var(--sh2)' }}>
              <Icon name="calendar_month" size={16} />
              <span style={{ font: '700 13.5px Manrope,sans-serif' }}>Después</span>
            </span>
          </button>
        </div>

        {/* Lo que Domix promete en su papelería, donde el cliente decide */}
        <div className="sb" style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '0 16px 20px' }}>
          {[
            { i: 'verified_user', t: 'Confiables', s: 'Tu envío en buenas manos' },
            { i: 'bolt', t: 'Rápidos', s: 'Entregas oportunas' },
            { i: 'location_on', t: 'Locales', s: 'Conocemos cada rincón' },
          ].map((c) => (
            <span key={c.t} style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 8, padding: '9px 13px', borderRadius: 99, background: 'var(--sf)' }}>
              <Icon name={c.i} size={16} fill color="var(--orange)" />
              <span style={{ minWidth: 0 }}>
                <span style={{ display: 'block', font: '700 11.5px Manrope,sans-serif', whiteSpace: 'nowrap' }}>{c.t}</span>
                <span style={{ display: 'block', font: '500 10px Manrope,sans-serif', color: 'var(--mu)', whiteSpace: 'nowrap' }}>{c.s}</span>
              </span>
            </span>
          ))}
        </div>

        {/* Pedido en curso */}
        {activo && (
          <div style={{ padding: '0 16px 20px' }}>
            <button
              onClick={() => router.push(`/seguimiento/${activo.tracking_code}`)}
              style={{ display: 'flex', alignItems: 'center', gap: 13, width: '100%', padding: 15, borderRadius: 16, background: 'var(--inv)', color: 'var(--invtx)', textAlign: 'left' }}
            >
              <span style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(255,255,255,.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
                <Icon name="moped" size={22} fill />
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', font: '600 10.5px Manrope,sans-serif', letterSpacing: '.14em', opacity: 0.55 }}>PEDIDO EN CURSO</span>
                <span style={{ display: 'block', font: '700 14.5px Manrope,sans-serif', marginTop: 3 }}>
                  {STATUS_STEPS.find((s) => s.id === activo.status)?.desc || 'En proceso'}
                </span>
                <span style={{ display: 'block', font: '500 12px Manrope,sans-serif', opacity: 0.55, marginTop: 1 }}>#{activo.tracking_code}</span>
              </span>
              <Icon name="chevron_right" size={22} style={{ opacity: 0.6 }} />
            </button>
          </div>
        )}

        {/* Para ti */}
        <SectionTitle
          action={
            <button onClick={() => router.push('/servicios')} style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--sf)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="arrow_forward" size={17} />
            </button>
          }
        >
          Para ti
        </SectionTitle>

        <div className="sb" style={{ display: 'flex', gap: 14, overflowX: 'auto', padding: '0 16px 22px' }}>
          {PARA_TI[tab].map((it) => (
            <ForYouItem key={it.name} image={it.img} label={it.name} onClick={() => go(it.tipo, it.turbo)} />
          ))}
        </div>

        {/* Atajos */}
        <SectionTitle>Atajos</SectionTitle>
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 24 }}>
          {ATAJOS.map((a) => (
            <Row key={a.name} icon={a.icon} title={a.name} subtitle={a.addr} note={a.note} onClick={() => go(tab === 'enviar' ? 'encomienda' : 'domicilio')} />
          ))}
          <Row icon="add" title="Guardar un lugar" onClick={() => router.push('/cuenta')} />
        </div>

        {/* Servicios */}
        <SectionTitle>Servicios</SectionTitle>
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 24 }}>
          {SERVICES.map((s) => (
            <Row
              key={s.value}
              image={s.img}
              title={s.label}
              subtitle={s.desc}
              right={
                <span style={{ flex: 'none', textAlign: 'right' }}>
                  <span style={{ display: 'block', font: '700 9.5px Manrope,sans-serif', letterSpacing: '.08em', color: 'var(--mu)' }}>DESDE</span>
                  <span style={{ display: 'block', font: '800 15px Manrope,sans-serif', letterSpacing: '-.02em' }}>{money(s.from)}</span>
                </span>
              }
              onClick={() => go(s.value)}
            />
          ))}
        </div>

        {/* Más formas de usar Domix */}
        <SectionTitle>Más formas de usar Domix</SectionTitle>
        <div className="sb" style={{ display: 'flex', gap: 11, overflowX: 'auto', padding: '0 16px' }}>
          <button
            onClick={() => go('domicilio', true)}
            style={{ flex: 'none', width: 214, borderRadius: 16, overflow: 'hidden', background: 'var(--sf)', textAlign: 'left' }}
          >
            <div style={{ height: 98, background: 'var(--orange)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', left: -24, bottom: -34, width: 164, height: 164, borderRadius: '50%', border: '13px solid rgba(255,255,255,.15)' }} />
              <div style={{ position: 'absolute', right: 15, bottom: 14, font: '800 15px Manrope,sans-serif', color: '#fff', letterSpacing: '-.03em' }}>TURBO</div>
            </div>
            <div style={{ padding: '12px 14px 15px' }}>
              <div style={{ font: '700 14px Manrope,sans-serif', marginBottom: 2 }}>Domix Turbo</div>
              <div style={{ font: '500 11.5px/1.4 Manrope,sans-serif', color: 'var(--mu)' }}>Tu envío primero en la fila, en menos de 20 minutos.</div>
            </div>
          </button>

          <a href={WHATSAPP} target="_blank" rel="noreferrer" style={{ flex: 'none', width: 214, borderRadius: 16, overflow: 'hidden', background: 'var(--sf)', color: 'var(--tx)' }}>
            <div style={{ height: 98, background: 'var(--green)', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="chat" size={40} fill color="rgba(255,255,255,.9)" />
            </div>
            <div style={{ padding: '12px 14px 15px' }}>
              <div style={{ font: '700 14px Manrope,sans-serif', marginBottom: 2 }}>Pide por WhatsApp</div>
              <div style={{ font: '500 11.5px/1.4 Manrope,sans-serif', color: 'var(--mu)' }}>315 792 4906 · te respondemos al instante.</div>
            </div>
          </a>
        </div>

        <div style={{ textAlign: 'center', marginTop: 30, padding: '0 24px' }}>
          <div style={{ font: '800 15px/1.35 Manrope,sans-serif', letterSpacing: '-.02em' }}>
            Enviamos confianza,<br />
            <span style={{ color: 'var(--green)' }}>entregamos soluciones.</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, font: '500 11px Manrope,sans-serif', color: 'var(--mu)', marginTop: 10 }}>
            <Icon name="location_on" size={13} fill />
            Cobertura en Buenaventura y zonas aledañas
          </div>
        </div>
      </div>

      <BottomNav badges={{ '/pedidos': pendientes }} />
    </>
  );
}
