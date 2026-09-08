'use client';

/* Kit de UI Material 3 con la identidad Domix. Compartido por las pantallas. */

export function Icon({ name, size = 20, fill = false, color, style }) {
  return <span className={`mi${fill ? ' mi-fill' : ''}`} style={{ fontSize: size, color, ...style }}>{name}</span>;
}

export function Card({ children, style, tone = 'lowest', elevation = 1, ...rest }) {
  const bg = { lowest: 'var(--surface-lowest)', low: 'var(--surface-low)', container: 'var(--surface-container)' }[tone];
  return (
    <div
      style={{
        background: bg, borderRadius: 'var(--sh-lg)', border: '1px solid var(--outline-variant)',
        boxShadow: `var(--elev-${elevation})`, ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}

/* Tarjeta hero en azul de marca, con halo de color (naranja o verde). */
export function HeroCard({ children, glow = 'green', style }) {
  const glowColor = glow === 'navy' ? 'rgba(46,123,196,.34)' : 'rgba(87,168,47,.32)';
  return (
    <div
      style={{
        position: 'relative', overflow: 'hidden', borderRadius: 'var(--sh-xl)', padding: 20,
        background: 'linear-gradient(150deg,#2A241E 0%,#17140F 58%,#12100D 100%)',
        color: 'var(--on-inverse-surface)', boxShadow: 'var(--elev-4)', ...style,
      }}
    >
      <div style={{ position: 'absolute', right: -50, top: -66, width: 208, height: 208, borderRadius: '50%', background: `radial-gradient(circle,${glowColor},transparent 70%)` }} />
      <div style={{ position: 'absolute', left: -60, bottom: -80, width: 180, height: 180, borderRadius: '50%', background: 'radial-gradient(circle,rgba(46,123,196,.18),transparent 70%)' }} />
      <div style={{ position: 'relative' }}>{children}</div>
    </div>
  );
}

export function Overline({ children, style }) {
  return <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', ...style }}>{children}</div>;
}

/* Botón MD3: filled | tonal | outlined | text */
export function Button({ children, variant = 'filled', icon, full, color, style, ...rest }) {
  const base = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    height: 50, padding: '0 22px', borderRadius: 'var(--sh-full)',
    fontSize: 14.5, fontWeight: 700, width: full ? '100%' : undefined,
  };
  const variants = {
    filled: { background: color || 'var(--primary)', color: 'var(--on-primary)', boxShadow: 'var(--elev-1)' },
    tonal: { background: 'var(--primary-container)', color: 'var(--on-primary-container)' },
    outlined: { background: 'transparent', color: color || 'var(--primary)', border: '1px solid var(--outline)' },
    text: { background: 'transparent', color: color || 'var(--primary)', padding: '0 12px' },
  };
  return (
    <button style={{ ...base, ...variants[variant], ...style }} {...rest}>
      {icon && <Icon name={icon} size={19} fill />}
      {children}
    </button>
  );
}

/* Chip de estado / asistente */
export function Chip({ children, icon, bg = 'var(--surface-container)', color = 'var(--on-surface-variant)', style }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, height: 26, padding: '0 11px', borderRadius: 'var(--sh-full)', background: bg, color, fontSize: 11.5, fontWeight: 800, ...style }}>
      {icon && <Icon name={icon} size={14} fill />}
      {children}
    </span>
  );
}

/* Tile de estadística con icono en contenedor tonal */
export function StatTile({ icon, value, label, tone = 'primary' }) {
  const tones = {
    primary: ['var(--primary-container)', 'var(--on-primary-container)'],
    secondary: ['var(--secondary-container)', 'var(--on-secondary-container)'],
    tertiary: ['var(--tertiary-container)', 'var(--on-tertiary-container)'],
  };
  const [bg, fg] = tones[tone];
  return (
    <Card style={{ padding: 14 }}>
      <span style={{ width: 34, height: 34, borderRadius: 'var(--sh-sm)', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={18} fill color={fg} />
      </span>
      <div className="dsp" style={{ fontWeight: 800, fontSize: 19, marginTop: 10 }}>{value}</div>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--on-surface-variant)', marginTop: 2 }}>{label}</div>
    </Card>
  );
}

export function EmptyState({ icon, title, body, action }) {
  return (
    <Card style={{ padding: '32px 22px', textAlign: 'center' }}>
      <span style={{ width: 58, height: 58, borderRadius: '50%', background: 'var(--surface-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
        <Icon name={icon} size={27} color="var(--on-surface-variant)" />
      </span>
      <div className="dsp" style={{ fontWeight: 700, fontSize: 16.5, marginTop: 14 }}>{title}</div>
      <div style={{ fontSize: 13, color: 'var(--on-surface-variant)', lineHeight: 1.5, marginTop: 5 }}>{body}</div>
      {action && <div style={{ marginTop: 16 }}>{action}</div>}
    </Card>
  );
}

export function Spinner({ size = 44, color = 'var(--tertiary)' }) {
  return <div style={{ width: size, height: size, borderRadius: '50%', border: '3px solid var(--surface-high)', borderTopColor: color, animation: 'dxSpin 1s linear infinite' }} />;
}

/* Switch MD3 con marca de verificación al activarse */
export function Switch({ checked, onChange, disabled }) {
  return (
    <button
      onClick={onChange}
      disabled={disabled}
      role="switch"
      aria-checked={checked}
      style={{
        width: 52, height: 32, borderRadius: 'var(--sh-full)', padding: 3, display: 'flex', flex: 'none',
        background: checked ? 'var(--secondary)' : 'rgba(255,255,255,.22)',
        border: checked ? '2px solid var(--secondary)' : '2px solid rgba(255,255,255,.34)',
      }}
    >
      <span
        style={{
          width: checked ? 24 : 18, height: checked ? 24 : 18, borderRadius: '50%', background: '#fff',
          margin: checked ? 0 : 3, display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'transform .22s var(--ease-out), width .18s var(--ease), height .18s var(--ease), margin .18s var(--ease)',
          transform: checked ? 'translateX(20px)' : 'translateX(0)',
        }}
      >
        {checked && <Icon name="check" size={14} color="var(--secondary)" style={{ fontWeight: 700 }} />}
      </span>
    </button>
  );
}

/* Campo de texto MD3 (outlined) */
export function Field({ label, icon, value, onChange, placeholder, type = 'text', rows, required }) {
  const Tag = rows ? 'textarea' : 'input';
  return (
    <label style={{ display: 'block' }}>
      <span style={{ display: 'block', fontSize: 11.5, fontWeight: 800, color: 'var(--on-surface-variant)', marginBottom: 6, letterSpacing: '.02em' }}>{label}</span>
      <span style={{ display: 'flex', alignItems: rows ? 'flex-start' : 'center', gap: 10, padding: rows ? '12px 14px' : '0 14px', height: rows ? 'auto' : 52, borderRadius: 'var(--sh-sm)', background: 'var(--surface-lowest)', border: '1px solid var(--outline-variant)' }}>
        {icon && <Icon name={icon} size={19} color="var(--on-surface-variant)" style={{ marginTop: rows ? 2 : 0 }} />}
        <Tag
          required={required}
          type={rows ? undefined : type}
          rows={rows}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          style={{ flex: 1, width: '100%', fontSize: 14.5, fontWeight: 600, resize: 'none', lineHeight: 1.45 }}
        />
      </span>
    </label>
  );
}
