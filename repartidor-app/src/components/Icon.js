export default function Icon({ name, size = 20, fill = false, color, style }) {
  return (
    <span
      className={`mi${fill ? ' mi-fill' : ''}`}
      style={{ fontSize: size, color, ...style }}
    >
      {name}
    </span>
  );
}
