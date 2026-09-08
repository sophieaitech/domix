'use client';

/* Kit de UI del panel, con el lenguaje del admin de Turapp:
   tarjetas blancas de borde fino, cifras en mono, acentos Domix. */

export function Icon({ name, size = 20, fill = false, color, style }) {
  return <span className={`mi${fill ? ' mi-fill' : ''}`} style={{ fontSize: size, color, ...style }}>{name}</span>;
}

export function Card({ children, style, padding = 18, elevation, ...rest }) {
  // elevation viene de la versión anterior del kit; aquí la elevación
  // la da el borde fino, así que se ignora a propósito.
  return (
    <div className="dx-card" style={{ padding, ...style }} {...rest}>{children}</div>
  );
}

export function CardTitle({ children, sub, right }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: sub ? 16 : 16 }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ font: '800 15px Manrope,sans-serif', letterSpacing: '-.025em' }}>{children}</div>
        {sub && <div style={{ font: '500 11.5px Manrope,sans-serif', color: 'var(--mu)', marginTop: 3 }}>{sub}</div>}
      </div>
      {right}
    </div>
  );
}

/* Tarjeta de indicador: etiqueta, icono tonal, cifra en mono y delta. */
export function Kpi({ label, value, icon, tone = 'green', delta, deltaTone, hint }) {
  const tones = {
    green: ['var(--greenS)', 'var(--green)'],
    navy: ['var(--navyS)', 'var(--navy)'],
    amber: ['var(--amberS)', 'var(--amber)'],
    red: ['var(--redS)', 'var(--red)'],
    purple: ['var(--purpleS)', 'var(--purple)'],
  };
  const [bg, fg] = tones[tone] || tones.green;
  return (
    <div className="dx-card" style={{ padding: '16px 17px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 11 }}>
        <div style={{ font: '600 11px Manrope,sans-serif', color: 'var(--mu)', letterSpacing: '.04em' }}>{label}</div>
        <div style={{ width: 26, height: 26, borderRadius: 8, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
          <Icon name={icon} size={15} fill color={fg} />
        </div>
      </div>
      <div className="num" style={{ font: "800 25px/1 'IBM Plex Mono',monospace", marginBottom: 8 }}>{value}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        {delta && <div style={{ font: '700 11px Manrope,sans-serif', color: deltaTone || 'var(--green)' }}>{delta}</div>}
        {hint && <div style={{ font: '500 11px Manrope,sans-serif', color: 'var(--mu)' }}>{hint}</div>}
      </div>
    </div>
  );
}

const VARIANT_ALIAS = { filled: 'solid', outlined: 'outline', tonal: 'soft', text: 'ghost' };

export function Button({ children, variant = 'solid', icon, full, color, style, ...rest }) {
  variant = VARIANT_ALIAS[variant] || variant;
  const base = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    height: 40, padding: '0 16px', borderRadius: 11, font: '700 13px Manrope,sans-serif', whiteSpace: 'nowrap',
  };
  const variants = {
    solid: { background: 'var(--inv)', color: 'var(--invtx)' },
    green: { background: 'var(--green)', color: '#fff' },
    soft: { background: 'var(--sf)', color: 'var(--tx)' },
    outline: { background: 'transparent', color: 'var(--tx)', border: '1px solid var(--bd)' },
    ghost: { background: 'transparent', color: 'var(--mu)' },
  };
  const override = color
    ? (variant === 'outline' || variant === 'ghost' ? { color } : { background: color, color: '#fff' })
    : null;
  return (
    <button style={{ ...base, ...(variants[variant] || variants.solid), ...(full ? { width: '100%' } : null), ...override, ...style }} {...rest}>
      {icon && <Icon name={icon} size={17} fill />}
      {children}
    </button>
  );
}

export function Pill({ children, icon, tone = 'default', bg, color, style }) {
  const tones = {
    default: { background: 'var(--sf)', color: 'var(--mu)' },
    green: { background: 'var(--greenS)', color: 'var(--green)' },
    navy: { background: 'var(--navyS)', color: 'var(--navy)' },
    amber: { background: 'var(--amberS)', color: 'var(--amber)' },
    red: { background: 'var(--redS)', color: 'var(--red)' },
    purple: { background: 'var(--purpleS)', color: 'var(--purple)' },
    solid: { background: 'var(--inv)', color: 'var(--invtx)' },
  };
  const custom = bg || color ? { background: bg, color } : null;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, height: 26, padding: '0 10px', borderRadius: 99, font: '700 11px Manrope,sans-serif', whiteSpace: 'nowrap', ...(tones[tone] || tones.default), ...custom, ...style }}>
      {icon && <Icon name={icon} size={13} fill />}
      {children}
    </span>
  );
}

/* Fila de la cola de aprobación: icono, texto y cifra en mono. */
export function QueueRow({ icon, tone = 'amber', label, sub, count, onClick }) {
  const tones = {
    green: ['var(--greenS)', 'var(--green)'],
    navy: ['var(--navyS)', 'var(--navy)'],
    amber: ['var(--amberS)', 'var(--amber)'],
    red: ['var(--redS)', 'var(--red)'],
    purple: ['var(--purpleS)', 'var(--purple)'],
  };
  const [bg, fg] = tones[tone] || tones.amber;
  return (
    <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '12px 13px', borderRadius: 11, background: 'var(--sf)', textAlign: 'left', width: '100%' }}>
      <span style={{ width: 30, height: 30, borderRadius: 9, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
        <Icon name={icon} size={16} fill color={fg} />
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'block', font: '700 12.5px Manrope,sans-serif' }}>{label}</span>
        <span style={{ display: 'block', font: '500 10.5px Manrope,sans-serif', color: 'var(--mu)', marginTop: 1 }}>{sub}</span>
      </span>
      <span className="num" style={{ font: "800 17px 'IBM Plex Mono',monospace", color: fg, flex: 'none' }}>{count}</span>
    </button>
  );
}

/* Barra de proporción, para la mezcla por servicio. */
export function MixBar({ label, value, total, color = 'var(--green)' }) {
  const pct = total ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span style={{ width: 9, height: 9, borderRadius: 3, background: color, flex: 'none' }} />
        <span style={{ flex: 1, font: '600 12px Manrope,sans-serif' }}>{label}</span>
        <span className="num" style={{ font: "700 12.5px 'IBM Plex Mono',monospace" }}>{value}</span>
      </div>
      <div style={{ height: 6, borderRadius: 99, background: 'var(--sf2)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, borderRadius: 99, background: color, transition: 'width .5s cubic-bezier(.2,.8,.2,1)' }} />
      </div>
    </div>
  );
}

export function Field({ label, icon, value, onChange, placeholder, type = 'text', rows, required }) {
  const Tag = rows ? 'textarea' : 'input';
  return (
    <label style={{ display: 'block' }}>
      {label && <span style={{ display: 'block', font: '700 11.5px Manrope,sans-serif', color: 'var(--mu)', marginBottom: 6 }}>{label}</span>}
      <span style={{ display: 'flex', alignItems: rows ? 'flex-start' : 'center', gap: 9, padding: rows ? '11px 13px' : '0 13px', height: rows ? 'auto' : 46, borderRadius: 11, background: 'var(--sf)' }}>
        {icon && <Icon name={icon} size={18} color="var(--mu)" style={{ marginTop: rows ? 2 : 0 }} />}
        <Tag
          required={required} type={rows ? undefined : type} rows={rows}
          value={value} onChange={onChange} placeholder={placeholder}
          style={{ flex: 1, width: '100%', font: '600 13.5px Manrope,sans-serif', resize: 'none', lineHeight: 1.45 }}
        />
      </span>
    </label>
  );
}

export function Select({ label, value, onChange, children }) {
  return (
    <label style={{ display: 'block' }}>
      {label && <span style={{ display: 'block', font: '700 11.5px Manrope,sans-serif', color: 'var(--mu)', marginBottom: 6 }}>{label}</span>}
      <select value={value} onChange={onChange} style={{ width: '100%', height: 46, padding: '0 13px', borderRadius: 11, background: 'var(--sf)', font: '600 13.5px Manrope,sans-serif', cursor: 'pointer' }}>
        {children}
      </select>
    </label>
  );
}

export function Spinner({ size = 36, color = 'var(--green)' }) {
  return <div style={{ width: size, height: size, borderRadius: '50%', border: '3px solid var(--sf2)', borderTopColor: color, animation: 'trSpin 1s linear infinite' }} />;
}

export function EmptyState({ icon, title, body, action }) {
  return (
    <div className="dx-card" style={{ padding: '44px 24px', textAlign: 'center' }}>
      <span style={{ width: 58, height: 58, borderRadius: '50%', background: 'var(--sf)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
        <Icon name={icon} size={26} color="var(--mu)" />
      </span>
      <div style={{ font: '800 17px Manrope,sans-serif', letterSpacing: '-.02em', marginTop: 15 }}>{title}</div>
      <div style={{ font: '500 13px/1.5 Manrope,sans-serif', color: 'var(--mu)', marginTop: 6 }}>{body}</div>
      {action && <div style={{ marginTop: 18, display: 'flex', justifyContent: 'center' }}>{action}</div>}
    </div>
  );
}

/* Interruptor pequeño, para los ajustes del motor de despacho. */
export function Switch({ checked, onChange, disabled }) {
  return (
    <button
      onClick={onChange}
      disabled={disabled}
      role="switch"
      aria-checked={checked}
      style={{
        width: 46, height: 27, borderRadius: 99, padding: 3, display: 'flex', flex: 'none',
        background: checked ? 'var(--green)' : 'var(--sf2)',
      }}
    >
      <span style={{
        width: 21, height: 21, borderRadius: '50%', background: '#fff',
        transition: 'transform .2s cubic-bezier(.2,.8,.2,1)',
        transform: checked ? 'translateX(19px)' : 'translateX(0)',
        boxShadow: '0 1px 3px rgba(0,0,0,.25)',
      }} />
    </button>
  );
}

/* Compatibilidad con pantallas que aún usan los nombres anteriores */
export const Overline = ({ children, style }) => (
  <div style={{ font: '600 10.5px Manrope,sans-serif', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--mu)', ...style }}>{children}</div>
);
export const Chip = Pill;
export const StatTile = Kpi;
export function HeroCard({ children, style }) {
  return (
    <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 16, padding: 22, background: 'var(--inv)', color: 'var(--invtx)', ...style }}>
      {children}
    </div>
  );
}
