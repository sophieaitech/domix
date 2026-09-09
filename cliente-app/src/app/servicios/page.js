'use client';

import { useRouter } from 'next/navigation';
import BottomNav from '../../components/BottomNav';
import { Icon, SectionTitle, Row, Pill } from '../../components/ui';
import { useIdioma } from '../../context/IdiomaProvider';
import { SERVICES, NEGOCIO_PASOS } from '../../lib/services';
import { money, DEFAULT_RULES } from '../../lib/pricing';

const WHATSAPP = 'https://wa.me/573157924906';

export default function ServiciosPage() {
  const router = useRouter();
  const { t } = useIdioma();
  const go = (tipo, turbo) => router.push(`/pedir?tipo=${tipo}${turbo ? '&turbo=1' : ''}`);

  const entra = (n) => ({ animation: `dxSube .34s cubic-bezier(.2,.8,.2,1) ${n * 45}ms both` });

  return (
    <>
      <div className="sb" style={{ position: 'absolute', inset: 0, overflowY: 'auto', padding: '10px 0 104px' }}>
        <div style={{ padding: '0 16px 6px', font: '800 26px Manrope,sans-serif', letterSpacing: '-.035em', ...entra(0) }}>
          {t('servicios.titulo')}
        </div>
        <div style={{ padding: '0 16px 22px', font: '500 13.5px/1.5 Manrope,sans-serif', color: 'var(--mu)', ...entra(0) }}>
          {t('servicios.subtitulo')}
        </div>

        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 26, ...entra(1) }}>
          {SERVICES.map((s) => (
            <Row
              key={s.value}
              image={s.img}
              title={t(`servicios.${s.value}`)}
              subtitle={t(`servicios.${s.value}Desc`)}
              onClick={() => go(s.value)}
              right={
                <span style={{ flex: 'none', textAlign: 'right' }}>
                  <span style={{ display: 'block', font: '700 9.5px Manrope,sans-serif', letterSpacing: '.08em', color: 'var(--mu)' }}>{t('comun.desde')}</span>
                  <span className="num" style={{ display: 'block', font: '800 15px Manrope,sans-serif', letterSpacing: '-.02em' }}>{money(s.from)}</span>
                </span>
              }
            />
          ))}
        </div>

        <div style={entra(2)}>
          <SectionTitle>{t('servicios.prioritaria')}</SectionTitle>
          <div style={{ padding: '0 16px 26px' }}>
            <button
              className="dx-toque"
              onClick={() => go('domicilio', true)}
              style={{ width: '100%', borderRadius: 20, overflow: 'hidden', color: '#fff', textAlign: 'left' }}
            >
              <div style={{ padding: '22px 19px', position: 'relative', overflow: 'hidden', background: 'linear-gradient(140deg,#245FA8,#15406F)' }}>
                <div style={{ position: 'absolute', right: -40, top: -50, width: 170, height: 170, borderRadius: '50%', border: '14px solid rgba(255,255,255,.13)' }} />
                <Pill icon="bolt" style={{ background: 'rgba(255,255,255,.18)', color: '#fff' }}>DOMIX TURBO</Pill>
                <div style={{ font: '800 22px/1.2 Manrope,sans-serif', letterSpacing: '-.03em', marginTop: 13 }}>
                  {t('servicios.turboLema1')}<br />{t('servicios.turboLema2')}
                </div>
                <div style={{ font: '500 12.5px/1.5 Manrope,sans-serif', opacity: 0.82, marginTop: 9, maxWidth: 270 }}>
                  {t('servicios.turboDetalle', { km: DEFAULT_RULES.turboRadiusKm, precio: money(DEFAULT_RULES.turboFee) })}
                </div>
              </div>
            </button>
          </div>
        </div>

        <div style={entra(3)}>
          <SectionTitle>{t('servicios.negocioPregunta')}</SectionTitle>
          <div style={{ padding: '0 16px 26px' }}>
            <div style={{ borderRadius: 20, border: '1px solid var(--bd)', overflow: 'hidden' }}>
              <div style={{ padding: '19px 19px 15px', background: 'var(--sf)' }}>
                <div style={{ font: '800 19px/1.25 Manrope,sans-serif', letterSpacing: '-.03em' }}>
                  {t('servicios.negocioTitulo1')}<br />{t('servicios.negocioTitulo2')}
                </div>
                <div style={{ font: '500 12.5px/1.5 Manrope,sans-serif', color: 'var(--mu)', marginTop: 8 }}>
                  {t('servicios.negocioTexto')}
                </div>
              </div>

              <div style={{ padding: '14px 16px 16px' }}>
                {NEGOCIO_PASOS.map((p, i) => (
                  <div key={p.label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 0', borderTop: i ? '1px solid var(--bd2)' : 'none' }}>
                    <span style={{ width: 34, height: 34, borderRadius: 10, background: `var(--${p.tone}S)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
                      <Icon name={p.icon} size={18} fill color={`var(--${p.tone})`} />
                    </span>
                    <span style={{ flex: 1, font: '700 13.5px Manrope,sans-serif' }}>{p.label}</span>
                    <span className="num" style={{ font: '700 11px Manrope,sans-serif', color: 'var(--mu)' }}>{i + 1}</span>
                  </div>
                ))}

                <a
                  className="dx-toque"
                  href={WHATSAPP}
                  target="_blank"
                  rel="noreferrer"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, height: 52, borderRadius: 14, background: 'var(--inv)', color: 'var(--invtx)', font: '700 14.5px Manrope,sans-serif', marginTop: 14 }}
                >
                  <Icon name="storefront" size={19} fill />
                  {t('servicios.negocioCta')}
                </a>
              </div>
            </div>
          </div>
        </div>

        <div style={entra(4)}>
          <SectionTitle>{t('servicios.hablar')}</SectionTitle>
          <div style={{ padding: '0 16px' }}>
            <a href={WHATSAPP} target="_blank" rel="noreferrer" style={{ display: 'block', color: 'var(--tx)' }}>
              <Row
                icon="chat"
                iconBg="var(--greenS)"
                title={t('servicios.whatsappTitulo')}
                subtitle={t('servicios.whatsappSub')}
                right={<Icon name="open_in_new" size={18} color="var(--mu)" />}
              />
            </a>
          </div>
        </div>
      </div>

      <BottomNav />
    </>
  );
}
