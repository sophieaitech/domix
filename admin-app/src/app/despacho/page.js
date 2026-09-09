'use client';

import { useState } from 'react';
import TopBar from '../../components/TopBar';
import GuiaSeccion from '../../components/GuiaSeccion';
import { Icon, Card, HeroCard, Overline, Button, Chip, Switch } from '../../components/ui';
import { useOps } from '../../context/OpsProvider';
import { SERVICE_LABELS } from '../../lib/ops';
import { quote, etaMinutes, money, SURGE_STEPS } from '../../lib/pricing';

function NumberField({ label, hint, value, onChange, prefix = '$', suffix }) {
  return (
    <label style={{ display: 'block' }}>
      <span style={{ display: 'block', fontSize: 12.5, fontWeight: 800 }}>{label}</span>
      {hint && <span style={{ display: 'block', fontSize: 11.5, color: 'var(--on-surface-variant)', marginTop: 2, lineHeight: 1.4 }}>{hint}</span>}
      <span style={{ display: 'flex', alignItems: 'center', gap: 8, height: 48, marginTop: 8, padding: '0 14px', borderRadius: 'var(--sh-sm)', background: 'var(--surface-lowest)', border: '1px solid var(--outline-variant)' }}>
        {prefix && <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--on-surface-variant)' }}>{prefix}</span>}
        <input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} style={{ flex: 1, fontSize: 15, fontWeight: 700 }} />
        {suffix && <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--on-surface-variant)' }}>{suffix}</span>}
      </span>
    </label>
  );
}

function ToggleRow({ icon, title, body, checked, onChange, right }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '14px 0', borderTop: '1px solid var(--outline-variant)' }}>
      <span style={{ width: 40, height: 40, borderRadius: 'var(--sh-sm)', background: checked ? 'var(--secondary-container)' : 'var(--surface-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
        <Icon name={icon} size={20} fill color={checked ? 'var(--on-secondary-container)' : 'var(--on-surface-variant)'} />
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: 13.5, fontWeight: 800 }}>{title}</span>
        <span style={{ display: 'block', fontSize: 11.5, color: 'var(--on-surface-variant)', marginTop: 2, lineHeight: 1.45 }}>{body}</span>
      </span>
      {right}
      <span style={{ background: 'var(--surface-high)', borderRadius: 999, padding: 2, display: 'flex' }}>
        <Switch checked={checked} onChange={() => onChange(!checked)} />
      </span>
    </div>
  );
}

export default function DespachoPage() {
  const { rules, saveRules, effectiveRules, suggestedSurge, stats } = useOps();
  const [draft, setDraft] = useState(rules);
  const [saved, setSaved] = useState(false);
  const [sim, setSim] = useState({ km: 3.8, service: 'domicilio', turbo: false });

  const set = (k) => (v) => { setDraft((d) => ({ ...d, [k]: v })); setSaved(false); };

  const preview = quote({
    distanceKm: sim.km,
    serviceType: sim.service,
    turbo: sim.turbo,
    rules: { ...draft, surge: draft.autoSurge ? suggestedSurge : draft.surge },
  });

  const guardar = () => { saveRules(draft); setSaved(true); setTimeout(() => setSaved(false), 2500); };

  return (
    <>
      <TopBar
        title="Motor de despacho"
        subtitle="Define cómo se calcula cada tarifa y cómo se asignan los pedidos"
        actions={<Button icon={saved ? 'check' : 'save'} color={saved ? 'var(--secondary)' : undefined} onClick={guardar} style={{ height: 44 }}>{saved ? 'Guardado' : 'Guardar reglas'}</Button>}
      />

      <div className="dx-content sb" style={{ animation: 'trFade .3s ease' }}>
        <GuiaSeccion
          id="despacho"
          tono="amber"
          titulo="Aquí se define cuánto cobras"
          frase="La tarifa que ve el cliente sale de estas reglas. Cámbialas y el precio cambia al instante, sin tocar código."
          puntos={[{ i: 'payments', t: 'Base y kilómetro', s: 'El piso y lo que suma la distancia' }, { i: 'trending_up', t: 'Por demanda', s: 'Sube solo cuando hay más pedidos que motos' }, { i: 'calculate', t: 'Simulador', s: 'Pruebas el precio antes de guardarlo' }]}
        />


      <HeroCard glow="orange" style={{ padding: 22, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ width: 46, height: 46, borderRadius: 'var(--sh-sm)', background: 'rgba(255,255,255,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
            <Icon name="bolt" size={24} fill color="#A9D98F" />
          </span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <Overline style={{ color: 'rgba(255,255,255,.55)' }}>Tarifas dinámicas Domix</Overline>
            <span className="dsp" style={{ display: 'block', fontWeight: 800, fontSize: 23, marginTop: 4 }}>
              Precio justo para el cliente, pago justo para el repartidor
            </span>
            <span style={{ display: 'block', fontSize: 13, color: 'rgba(255,255,255,.65)', marginTop: 6, lineHeight: 1.5, maxWidth: 620 }}>
              La tarifa sale de la distancia real por calles, el tipo de servicio y las condiciones del momento:
              lluvia, horario nocturno y cuánta demanda hay frente a la flota disponible.
            </span>
          </span>
        </div>
      </HeroCard>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,340px)', gap: 16, alignItems: 'start' }}>
        <div>
          <Card style={{ padding: 20 }}>
            <span style={{ fontSize: 15, fontWeight: 800 }}>Estructura de costos</span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 14, marginTop: 16 }}>
              <NumberField label="Tarifa base" hint={`Incluye los primeros ${draft.baseKm} km`} value={draft.baseFare} onChange={set('baseFare')} />
              <NumberField label="Km incluidos" prefix="" suffix="km" value={draft.baseKm} onChange={set('baseKm')} />
              <NumberField label="Costo por km adicional" value={draft.perKm} onChange={set('perKm')} suffix="/km" />
              <NumberField label="Tarifa mínima" hint="Piso garantizado por servicio" value={draft.minFare} onChange={set('minFare')} />
              <NumberField label="Pago al repartidor" prefix="" suffix="%" value={draft.courierSharePct} onChange={set('courierSharePct')} hint="Porcentaje de la tarifa" />
              <NumberField label="Cobertura general" prefix="" suffix="km" value={draft.coverageRadiusKm} onChange={set('coverageRadiusKm')} />
            </div>
          </Card>

          <Card style={{ padding: 20, marginTop: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 15, fontWeight: 800 }}>Tarifa por demanda</span>
              <Chip icon="trending_up" bg="var(--tertiary-container)" color="var(--on-tertiary-container)">
                Sugerido {suggestedSurge.toFixed(1)}×
              </Chip>
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--on-surface-variant)', marginTop: 6, lineHeight: 1.5 }}>
              Con {stats.online} repartidores en línea, {stats.busy} en entrega y {stats.pending} pedidos esperando.
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 15, flexWrap: 'wrap' }}>
              {SURGE_STEPS.map((s) => {
                const on = !draft.autoSurge && draft.surge === s.value;
                return (
                  <button
                    key={s.value}
                    onClick={() => setDraft((d) => ({ ...d, surge: s.value, autoSurge: false }))}
                    style={{
                      height: 44, padding: '0 16px', borderRadius: 'var(--sh-sm)', fontSize: 13, fontWeight: 800,
                      display: 'flex', alignItems: 'center', gap: 7,
                      background: on ? 'linear-gradient(135deg,#3E9330,#2F7A24)' : 'var(--surface-container)',
                      color: on ? '#fff' : 'var(--on-surface-variant)',
                      boxShadow: on ? 'var(--elev-2)' : 'none',
                    }}
                  >
                    <Icon name="bolt" size={16} fill={on} />
                    {s.label}
                    <span style={{ fontWeight: 700, opacity: .8, fontSize: 11.5 }}>{s.hint}</span>
                  </button>
                );
              })}
            </div>

            <ToggleRow
              icon="auto_mode"
              title="Ajuste automático por demanda"
              body="Domix sube el multiplicador solo cuando hay más pedidos que repartidores libres, y lo baja al normalizarse."
              checked={draft.autoSurge}
              onChange={(v) => set('autoSurge')(v)}
            />
          </Card>

          <Card style={{ padding: 20, marginTop: 16 }}>
            <span style={{ fontSize: 15, fontWeight: 800 }}>Recargos y asignación</span>
            <div style={{ marginTop: 6 }}>
              <ToggleRow
                icon="rainy"
                title="Recargo por lluvia"
                body="Compensa al repartidor cuando el clima complica la ruta. Actívalo el día que llueva."
                checked={draft.rainActive}
                onChange={(v) => set('rainActive')(v)}
                right={<Chip>{money(draft.rainSurcharge)}</Chip>}
              />
              <ToggleRow
                icon="dark_mode"
                title="Recargo nocturno"
                body="Se aplica automáticamente entre 10 p.m. y 6 a.m. sobre la tarifa calculada."
                checked={draft.nightActive}
                onChange={(v) => set('nightActive')(v)}
                right={<Chip>+{draft.nightSurchargePct}%</Chip>}
              />
              <ToggleRow
                icon="near_me"
                title="Asignación automática por cercanía"
                body="El pedido se ofrece primero al repartidor libre más cercano al punto de recogida."
                checked={draft.autoAssign}
                onChange={(v) => set('autoAssign')(v)}
              />
            </div>
          </Card>
        </div>

        {/* Simulador */}
        <Card style={{ padding: 20, position: 'sticky', top: 20 }} elevation={3}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <Icon name="calculate" size={20} fill color="var(--primary)" />
            <span style={{ fontSize: 14.5, fontWeight: 800 }}>Simulador en vivo</span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--on-surface-variant)', marginTop: 5, lineHeight: 1.45 }}>
            Prueba cómo queda la tarifa antes de guardar.
          </div>

          <label style={{ display: 'block', marginTop: 16 }}>
            <span style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 800 }}>
              <span>Distancia</span>
              <span style={{ color: 'var(--tertiary)' }}>{sim.km.toFixed(1)} km</span>
            </span>
            <input
              type="range" min="0.5" max="15" step="0.1" value={sim.km}
              onChange={(e) => setSim((s) => ({ ...s, km: Number(e.target.value) }))}
              style={{ width: '100%', marginTop: 8, accentColor: 'var(--tertiary)' }}
            />
          </label>

          <label style={{ display: 'block', marginTop: 14 }}>
            <span style={{ display: 'block', fontSize: 12, fontWeight: 800, marginBottom: 7 }}>Servicio</span>
            <select
              value={sim.service}
              onChange={(e) => setSim((s) => ({ ...s, service: e.target.value }))}
              style={{ width: '100%', height: 46, padding: '0 13px', borderRadius: 'var(--sh-sm)', background: 'var(--surface-lowest)', border: '1px solid var(--outline-variant)', fontSize: 13.5, fontWeight: 700 }}
            >
              {Object.entries(SERVICE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </label>

          <button
            onClick={() => setSim((s) => ({ ...s, turbo: !s.turbo }))}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 9, marginTop: 12, padding: '11px 13px',
              borderRadius: 'var(--sh-sm)', fontSize: 12.5, fontWeight: 800,
              background: sim.turbo ? 'linear-gradient(135deg,#3E9330,#2F7A24)' : 'var(--surface-container)',
              color: sim.turbo ? '#fff' : 'var(--on-surface-variant)',
            }}
          >
            <Icon name="bolt" size={17} fill={sim.turbo} /> Domix Turbo
            <span style={{ flex: 1 }} />
            <Icon name={sim.turbo ? 'check_circle' : 'radio_button_unchecked'} size={17} fill={sim.turbo} />
          </button>

          <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid var(--outline-variant)' }}>
            {preview.breakdown.map((b) => (
              <div key={b.label} style={{ display: 'flex', gap: 10, padding: '4px 0' }}>
                <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: b.tone ? 'var(--tertiary)' : 'var(--on-surface-variant)' }}>{b.label}</span>
                <span style={{ fontSize: 12, fontWeight: 800, color: b.tone ? 'var(--tertiary)' : 'var(--on-surface)' }}>{money(b.amount)}</span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 14, padding: 15, borderRadius: 'var(--sh-md)', background: 'var(--primary)', color: '#fff' }}>
            <Overline style={{ color: 'rgba(255,255,255,.6)' }}>Tarifa final al cliente</Overline>
            <div className="dsp" style={{ fontWeight: 800, fontSize: 32, marginTop: 4 }}>{money(preview.total)}</div>
            <div style={{ display: 'flex', gap: 14, marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,.2)' }}>
              <span style={{ flex: 1 }}>
                <span style={{ display: 'block', fontSize: 10.5, fontWeight: 700, opacity: .7 }}>Repartidor ({draft.courierSharePct}%)</span>
                <span className="dsp" style={{ display: 'block', fontWeight: 800, fontSize: 16, marginTop: 2 }}>{money(preview.courierPay)}</span>
              </span>
              <span style={{ flex: 1 }}>
                <span style={{ display: 'block', fontSize: 10.5, fontWeight: 700, opacity: .7 }}>Margen Domix</span>
                <span className="dsp" style={{ display: 'block', fontWeight: 800, fontSize: 16, marginTop: 2 }}>{money(preview.companyMargin)}</span>
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 12, fontSize: 11.5, fontWeight: 700, opacity: .85 }}>
              <Icon name="schedule" size={15} fill /> Entrega estimada en {etaMinutes(sim.km, sim.turbo)} min
            </div>
          </div>
        </Card>
      </div>
      </div>
    </>
  );
}
