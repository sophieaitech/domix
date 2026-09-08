'use client';

import { useRouter } from 'next/navigation';
import BottomNav from '../../components/BottomNav';
import { Icon, SectionTitle, Row, Pill } from '../../components/ui';
import { SERVICES } from '../../lib/services';
import { money, DEFAULT_RULES } from '../../lib/pricing';

const WHATSAPP = 'https://wa.me/573157924906';

export default function ServiciosPage() {
  const router = useRouter();
  const go = (tipo, turbo) => router.push(`/pedir?tipo=${tipo}${turbo ? '&turbo=1' : ''}`);

  return (
    <>
      <div className="sb" style={{ position: 'absolute', inset: 0, overflowY: 'auto', padding: '10px 0 100px', animation: 'trFade .3s ease' }}>
        <div style={{ padding: '0 16px 6px', font: '800 26px Manrope,sans-serif', letterSpacing: '-.035em' }}>Servicios</div>
        <div style={{ padding: '0 16px 20px', font: '500 13.5px/1.5 Manrope,sans-serif', color: 'var(--mu)' }}>
          Todo lo que Domix mueve por ti en Buenaventura.
        </div>

        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 24 }}>
          {SERVICES.map((s) => (
            <Row
              key={s.value}
              image={s.img}
              title={s.label}
              subtitle={s.desc}
              onClick={() => go(s.value)}
              right={
                <span style={{ flex: 'none', textAlign: 'right' }}>
                  <span style={{ display: 'block', font: '700 9.5px Manrope,sans-serif', letterSpacing: '.08em', color: 'var(--mu)' }}>DESDE</span>
                  <span style={{ display: 'block', font: '800 15px Manrope,sans-serif', letterSpacing: '-.02em' }}>{money(s.from)}</span>
                </span>
              }
            />
          ))}
        </div>

        <SectionTitle>Entrega prioritaria</SectionTitle>
        <div style={{ padding: '0 16px 24px' }}>
          <button
            onClick={() => go('domicilio', true)}
            style={{ width: '100%', borderRadius: 18, overflow: 'hidden', background: 'var(--navy)', color: '#fff', textAlign: 'left' }}
          >
            <div style={{ padding: '20px 18px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', right: -40, top: -50, width: 170, height: 170, borderRadius: '50%', border: '14px solid rgba(255,255,255,.13)' }} />
              <Pill icon="bolt" style={{ background: 'rgba(255,255,255,.18)', color: '#fff' }}>DOMIX TURBO</Pill>
              <div style={{ font: '800 22px/1.2 Manrope,sans-serif', letterSpacing: '-.03em', marginTop: 12 }}>
                Cuando no puede esperar,<br />va en Turbo.
              </div>
              <div style={{ font: '500 12.5px/1.5 Manrope,sans-serif', opacity: 0.8, marginTop: 8, maxWidth: 260 }}>
                Primero en la fila y en menos de 20 minutos dentro de {DEFAULT_RULES.turboRadiusKm} km,
                por {money(DEFAULT_RULES.turboFee)} más.
              </div>
            </div>
          </button>
        </div>

        <SectionTitle>¿Prefieres hablar?</SectionTitle>
        <div style={{ padding: '0 16px' }}>
          <a href={WHATSAPP} target="_blank" rel="noreferrer" style={{ display: 'block', color: 'var(--tx)' }}>
            <Row
              icon="chat"
              iconBg="var(--greenS)"
              title="Pide por WhatsApp"
              subtitle="315 792 4906 · atención inmediata"
              right={<Icon name="open_in_new" size={18} color="var(--mu)" />}
            />
          </a>
        </div>
      </div>

      <BottomNav />
    </>
  );
}
