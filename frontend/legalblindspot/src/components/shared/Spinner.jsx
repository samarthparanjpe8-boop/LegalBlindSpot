
export default function Spinner({ size = 24, color }) {
  return (
    <div
      className="spinner"
      style={{
        width: size,
        height: size,
        borderColor: `${color || 'var(--accent)'} transparent transparent transparent`
      }}
    />
  );
}
