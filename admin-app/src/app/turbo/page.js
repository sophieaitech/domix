'use client';

import { useEffect, useState } from 'react';
import TopBar from '../../components/TopBar';
import GuiaSeccion from '../../components/GuiaSeccion';
import { Icon, Card, Overline, Button, Chip, Switch } from '../../components/ui';
import { useOps } from '../../context/OpsProvider';
import { money, etaMinutes } from '../../lib/pricing';

const PROMESA_MIN = 20;

const PASOS = [
  { icon: 'flash_on', title: 'Entra el pedido Turbo', body: 'Se marca en rojo en el tablero y suena distinto: va de primero en la fila.' },
  { icon: 'near_me', title: 'Asignación VIP', body: 'Se ofrece al repartidor libre más cercano al punto de recogida, sin esperar turno.' },
  { icon: 'route', title: 'Ruta directa', body: 'Sin paradas intermedias: el repartidor va del origen al destino y nada más.' },
  { icon: 'verified', title: 'Entrega cumplida', body: `Meta: menos de ${PROMESA_MIN} minutos dentro del radio Turbo.` },
];

export default function TurboPage() {
  const { rules, saveRules, requests } = useOps();
  const [draft, setDraft] = useState(rules);
  const [saved, setSaved] = useState(false);
  const [seconds, setSeconds] = useState(PROMESA_MIN * 60 - 365);

  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => (s <= 0 ? PROMESA_MIN * 60 : s - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  const set = (k) => (v) => { setDraft((d) => ({ ...d, [k]: v })); setSaved(false); };
  const guardar = () => { saveRules(draft); setSaved(true); setTimeout(() => setSaved(false), 2500); };

  const turboReqs = requests.filter((r) => r.turbo);
  const entregados = turboReqs.filter((r) => r.status === 'delivered');
  const ingreso = entregados.reduce((s, r) => s + Number(r.price || 0), 0);
  const activo = draft.turboFee > 0;

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');
  const pct = (seconds / (PROMESA_MIN * 60)) * 100;

  return (
    <>
      <TopBar
        title="Domix Turbo"
        subtitle="El servicio prioritario para lo que no puede esperar"
        actions={<Button icon={saved ? 'check' : 'save'} color={saved ? 'var(--secondary)' : undefined} onClick={guardar} style={{ height: 44 }}>{saved ? 'Guardado' : 'Guardar Turbo'}</Button>}
      />

      <div className="dx-content sb" style={{ animation: 'trFade .3s ease' }}>
        <GuiaSeccion
          id="turbo"
          tono="orange"
          titulo="El servicio que te deja más"
          frase="Turbo es para lo que no puede esperar: una autorización que se vence, un documento que cierra un negocio. Cobra más porque vale más."
          puntos={[{ i: 'bolt', t: 'Primero en la fila', s: 'Se ofrece antes que los demás' }, { i: 'timer', t: 'Menos de 20 min', s: 'Una promesa que se puede cumplir' }, { i: 'attach_money', t: 'Su recargo', s: 'Tú decides cuánto suma' }]}
        />


      {/* Portada de marca */}
      <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 'var(--sh-xl)', padding: 30, color: '#fff', background: 'linear-gradient(135deg,#2E7BC4 0%,#1B4F8F 45%,#0F2E52 100%)', boxShadow: 'var(--elev-4)' }}>
        <div style={{ position: 'absolute', right: -70, top: -90, width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle,rgba(255,255,255,.28),transparent 70%)' }} />
        <div style={{ position: 'relative', maxWidth: 640 }}>
          <Chip icon="bolt" bg="rgba(255,255,255,.2)" color="#fff" style={{ height: 30 }}>ENTREGA PRIORITARIA</Chip>
          <div className="dsp" style={{ fontWeight: 800, fontSize: 38, marginTop: 14, lineHeight: 1.08 }}>
            Cuando no puede esperar,<br />va en Turbo.
          </div>
          <div style={{ fontSize: 14.5, marginTop: 12, lineHeight: 1.6, opacity: .92 }}>
            La autorización médica que se vence hoy, el documento que cierra un negocio, el repuesto que tiene
            parada una moto. Domix Turbo los pone de primeros en la fila y los entrega en menos de {PROMESA_MIN} minutos
            dentro de {draft.turboRadiusKm} km. Mismo equipo, misma confianza — solo que sin esperar turno.
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
            <Chip icon="schedule" bg="rgba(255,255,255,.18)" color="#fff" style={{ height: 32 }}>Menos de {PROMESA_MIN} min</Chip>
            <Chip icon="near_me" bg="rgba(255,255,255,.18)" color="#fff" style={{ height: 32 }}>Repartidor más cercano</Chip>
            <Chip icon="payments" bg="rgba(255,255,255,.18)" color="#fff" style={{ height: 32 }}>+{money(draft.turboFee)} sobre la tarifa</Chip>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 14, marginTop: 16 }}>
        {[
          { l: 'Pedidos Turbo', v: turboReqs.length, i: 'bolt', t: 'tertiary' },
          { l: 'Entregados', v: entregados.length, i: 'task_alt', t: 'secondary' },
          { l: 'Ingreso Turbo', v: money(ingreso), i: 'payments', t: 'secondary' },
          { l: 'Recargo actual', v: money(draft.turboFee), i: 'add_circle', t: 'tertiary' },
        ].map((k) => {
          const tones = {
            secondary: ['var(--secondary-container)', 'var(--on-secondary-container)'],
            tertiary: ['var(--tertiary-container)', 'var(--on-tertiary-container)'],
          }[k.t];
          return (
            <Card key={k.l} style={{ padding: 17 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--on-surface-variant)' }}>{k.l}</span>
                <span style={{ width: 30, height: 30, borderRadius: 'var(--sh-xs)', background: tones[0], display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name={k.i} size={17} fill color={tones[1]} />
                </span>
              </div>
              <div className="dsp" style={{ fontWeight: 800, fontSize: 25, marginTop: 10 }}>{k.v}</div>
            </Card>
          );
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 16, marginTop: 16, alignItems: 'start' }}>
        <Card style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 15, fontWeight: 800 }}>Promesa de tiempo</span>
            <Chip icon="timer" bg="var(--tertiary-container)" color="var(--on-tertiary-container)">En vivo</Chip>
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--on-surface-variant)', marginTop: 5, lineHeight: 1.5 }}>
            Esto es lo que ven el cliente y el repartidor durante una entrega Turbo.
          </div>

          <div style={{ marginTop: 18, padding: 20, borderRadius: 'var(--sh-lg)', background: 'var(--surface-container)', textAlign: 'center' }}>
            <Overline style={{ color: 'var(--tertiary)' }}>Tiempo restante garantizado</Overline>
            <div className="dsp" style={{ fontWeight: 800, fontSize: 46, letterSpacing: '.02em', marginTop: 6 }}>{mm}:{ss}</div>
            <div style={{ fontSize: 12, color: 'var(--on-surface-variant)', marginTop: 4 }}>
              Objetivo: entrega antes de {PROMESA_MIN}:00 min
            </div>
            <div style={{ height: 7, borderRadius: 99, background: 'var(--surface-high)', marginTop: 16, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, borderRadius: 99, background: 'linear-gradient(90deg,#3E9330,#2F7A24)', transition: 'width 1s linear' }} />
            </div>
          </div>

          <div style={{ marginTop: 18 }}>
            {PASOS.map((p, i) => (
              <div key={p.title} style={{ display: 'flex', gap: 13, padding: '11px 0', borderTop: i ? '1px solid var(--outline-variant)' : 'none' }}>
                <span style={{ width: 36, height: 36, borderRadius: 'var(--sh-sm)', background: 'var(--tertiary-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
                  <Icon name={p.icon} size={18} fill color="var(--on-tertiary-container)" />
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: 13, fontWeight: 800 }}>{i + 1}. {p.title}</span>
                  <span style={{ display: 'block', fontSize: 11.5, color: 'var(--on-surface-variant)', marginTop: 2, lineHeight: 1.45 }}>{p.body}</span>
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card style={{ padding: 20 }}>
          <span style={{ fontSize: 15, fontWeight: 800 }}>Reglas de operación Turbo</span>
          <div style={{ fontSize: 12.5, color: 'var(--on-surface-variant)', marginTop: 5, lineHeight: 1.5 }}>
            Ajusta hasta dónde y por cuánto puedes cumplir la promesa sin quedar mal.
          </div>

          <div style={{ marginTop: 18 }}>
            <label style={{ display: 'block' }}>
              <span style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, fontWeight: 800 }}>
                <span>Radio de cobertura Turbo</span>
                <span style={{ color: 'var(--tertiary)' }}>{draft.turboRadiusKm} km</span>
              </span>
              <span style={{ display: 'block', fontSize: 11.5, color: 'var(--on-surface-variant)', marginTop: 3, lineHeight: 1.4 }}>
                Solo los clientes dentro de este radio verán la opción Turbo al pedir.
              </span>
              <input
                type="range" min="1" max="8" step="0.5" value={draft.turboRadiusKm}
                onChange={(e) => set('turboRadiusKm')(Number(e.target.value))}
                style={{ width: '100%', marginTop: 10, accentColor: 'var(--tertiary)' }}
              />
            </label>

            <label style={{ display: 'block', marginTop: 20 }}>
              <span style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, fontWeight: 800 }}>
                <span>Recargo Turbo</span>
                <span style={{ color: 'var(--tertiary)' }}>{money(draft.turboFee)}</span>
              </span>
              <span style={{ display: 'block', fontSize: 11.5, color: 'var(--on-surface-variant)', marginTop: 3, lineHeight: 1.4 }}>
                Lo que se suma a la tarifa normal por la entrega prioritaria.
              </span>
              <input
                type="range" min="1000" max="10000" step="500" value={draft.turboFee}
                onChange={(e) => set('turboFee')(Number(e.target.value))}
                style={{ width: '100%', marginTop: 10, accentColor: 'var(--tertiary)' }}
              />
            </label>

            <div style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '16px 0 0', marginTop: 16, borderTop: '1px solid var(--outline-variant)' }}>
              <span style={{ width: 40, height: 40, borderRadius: 'var(--sh-sm)', background: draft.autoAssign ? 'var(--secondary-container)' : 'var(--surface-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
                <Icon name="near_me" size={20} fill color={draft.autoAssign ? 'var(--on-secondary-container)' : 'var(--on-surface-variant)'} />
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 13.5, fontWeight: 800 }}>Asignar al más cercano</span>
                <span style={{ display: 'block', fontSize: 11.5, color: 'var(--on-surface-variant)', marginTop: 2, lineHeight: 1.45 }}>
                  Sin esperar turno: el pedido Turbo va directo al repartidor libre más próximo.
                </span>
              </span>
              <span style={{ background: 'var(--surface-high)', borderRadius: 999, padding: 2, display: 'flex' }}>
                <Switch checked={draft.autoAssign} onChange={() => set('autoAssign')(!draft.autoAssign)} />
              </span>
            </div>

            <div style={{ marginTop: 20, padding: 15, borderRadius: 'var(--sh-md)', background: 'var(--tertiary-container)', color: 'var(--on-tertiary-container)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, fontWeight: 800 }}>
                <Icon name="tips_and_updates" size={17} fill /> Cómo lo contamos al cliente
              </div>
              <div style={{ fontSize: 12, marginTop: 7, lineHeight: 1.55 }}>
                «Tu envío primero en la fila. Domix Turbo: menos de {PROMESA_MIN} minutos en {draft.turboRadiusKm} km,
                por solo {money(draft.turboFee)} más. Llegamos rápido, llegamos por ti.»
              </div>
            </div>
          </div>
        </Card>
      </div>
      </div>
    </>
  );
}
