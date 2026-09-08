'use client';

/* Kit de UI estilo Turapp: blanco, texto casi negro, CTA negro,
   verde Domix como acento. Los layouts van inline en cada pantalla. */

export function Icon({ name, size = 20, fill = false, color, style }) {
  return <span className={`mi${fill ? ' mi-fill' : ''}`} style={{ fontSize: size, color, ...style }}>{name}</span>;
}

/* Marca "DomiX" con el punto verde, como el wordmark de Turapp. */
export function Wordmark({ size = 23 }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2.5 }}>
      <div style={{ font: `800 ${size}px/1 Manrope,sans-serif`, letterSpacing: '-.05em' }}>
        Domi<span style={{ color: 'var(--green)' }}>X</span>
      </div>
      <div style={{ width: size * 0.26, height: size * 0.26, borderRadius: '50%', background: 'var(--green)', marginBottom: size * 0.17 }} />
    </div>
  );
}

export function SectionTitle({ children, action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', marginBottom: 12 }}>
      <div style={{ font: '800 19px Manrope,sans-serif', letterSpacing: '-.03em' }}>{children}</div>
      {action}
    </div>
  );
}

/* Botón principal: negro sólido, como el de Turapp. */
export function Button({ children, variant = 'solid', icon, full = true, style, ...rest }) {
  const base = {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
    height: 54, borderRadius: 14, font: '700 16px Manrope,sans-serif',
    width: full ? '100%' : undefined, padding: full ? undefined : '0 22px',
  };
  const variants = {
    solid: { background: 'var(--inv)', color: 'var(--invtx)' },
    green: { background: 'var(--green)', color: '#fff' },
    soft: { background: 'var(--sf)', color: 'var(--tx)' },
    outline: { background: 'transparent', color: 'var(--tx)', border: '1.5px solid var(--bd)' },
  };
  return (
    <button style={{ ...base, ...variants[variant], ...style }} {...rest}>
      {icon && <Icon name={icon} size={20} fill />}
      {children}
    </button>
  );
}

/* Fila de lista con borde fino: el patrón de Atajos y Servicios. */
export function Row({ icon, iconBg, image, title, subtitle, note, right, onClick, style }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 13, width: '100%', padding: '13px 15px',
        borderRadius: 14, background: 'var(--bg)', border: '1px solid var(--bd)', textAlign: 'left', ...style,
      }}
    >
      {image ? (
        <span style={{ width: 46, height: 42, borderRadius: 10, background: 'var(--sf)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt="" style={{ width: 34, height: 34, objectFit: 'contain' }} />
        </span>
      ) : icon ? (
        <span style={{ width: 38, height: 38, borderRadius: 10, background: iconBg || 'var(--sf)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
          <Icon name={icon} size={19} color={iconBg ? 'var(--green)' : 'var(--tx)'} />
        </span>
      ) : null}

      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'block', font: '700 14.5px Manrope,sans-serif', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</span>
        {subtitle && <span style={{ display: 'block', font: '500 12px/1.35 Manrope,sans-serif', color: 'var(--mu)', marginTop: 1 }}>{subtitle}</span>}
        {note && <span style={{ display: 'block', font: '600 12px Manrope,sans-serif', color: 'var(--green)', marginTop: 2 }}>{note}</span>}
      </span>

      {right}
    </button>
  );
}

/* Píldora circular con ilustración 3D, como "Para ti". */
export function ForYouItem({ image, label, onClick }) {
  return (
    <button onClick={onClick} style={{ flex: 'none', width: 78, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 9 }}>
      <span style={{ width: 78, height: 78, borderRadius: '50%', background: 'var(--sf)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image} alt="" style={{ width: 58, height: 58, objectFit: 'contain' }} />
      </span>
      <span style={{ font: '600 12.5px/1.25 Manrope,sans-serif', textAlign: 'center' }}>{label}</span>
    </button>
  );
}

export function Pill({ children, icon, tone = 'default', style }) {
  const tones = {
    default: { background: 'var(--sf)', color: 'var(--mu)' },
    green: { background: 'var(--greenS)', color: 'var(--green)' },
    navy: { background: 'var(--navyS)', color: 'var(--navy)' },
    amber: { background: 'var(--amberS)', color: 'var(--amber)' },
    red: { background: 'var(--redS)', color: 'var(--red)' },
    solid: { background: 'var(--inv)', color: 'var(--invtx)' },
  };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, height: 28, padding: '0 11px', borderRadius: 99, font: '700 11.5px Manrope,sans-serif', ...tones[tone], ...style }}>
      {icon && <Icon name={icon} size={14} fill />}
      {children}
    </span>
  );
}

export function Field({ label, icon, value, onChange, placeholder, type = 'text', rows, required }) {
  const Tag = rows ? 'textarea' : 'input';
  return (
    <label style={{ display: 'block' }}>
      {label && <span style={{ display: 'block', font: '700 12px Manrope,sans-serif', color: 'var(--mu)', marginBottom: 7 }}>{label}</span>}
      <span style={{ display: 'flex', alignItems: rows ? 'flex-start' : 'center', gap: 10, padding: rows ? '13px 15px' : '0 15px', height: rows ? 'auto' : 54, borderRadius: 13, background: 'var(--sf)' }}>
        {icon && <Icon name={icon} size={19} color="var(--mu)" style={{ marginTop: rows ? 2 : 0 }} />}
        <Tag
          required={required} type={rows ? undefined : type} rows={rows}
          value={value} onChange={onChange} placeholder={placeholder}
          style={{ flex: 1, width: '100%', font: '600 15px Manrope,sans-serif', resize: 'none', lineHeight: 1.45 }}
        />
      </span>
    </label>
  );
}

export function Spinner({ size = 40, color = 'var(--green)' }) {
  return <div style={{ width: size, height: size, borderRadius: '50%', border: '3px solid var(--sf2)', borderTopColor: color, animation: 'trSpin 1s linear infinite' }} />;
}

export function EmptyState({ icon, title, body, action }) {
  return (
    <div style={{ padding: '40px 24px', textAlign: 'center' }}>
      <span style={{ width: 62, height: 62, borderRadius: '50%', background: 'var(--sf)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
        <Icon name={icon} size={28} color="var(--mu)" />
      </span>
      <div style={{ font: '800 18px Manrope,sans-serif', letterSpacing: '-.02em', marginTop: 16 }}>{title}</div>
      <div style={{ font: '500 13.5px/1.5 Manrope,sans-serif', color: 'var(--mu)', marginTop: 6 }}>{body}</div>
      {action && <div style={{ marginTop: 20, display: 'flex', justifyContent: 'center' }}>{action}</div>}
    </div>
  );
}

/* Cabecera con flecha de volver, para las pantallas internas. */
export function TopBack({ title, onBack, right }) {
  return (
    <div style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 13, padding: '10px 16px 14px' }}>
      <button onClick={onBack} style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--sf)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
        <Icon name="arrow_back" size={20} />
      </button>
      <div style={{ flex: 1, minWidth: 0, font: '800 21px Manrope,sans-serif', letterSpacing: '-.03em' }}>{title}</div>
      {right}
    </div>
  );
}
