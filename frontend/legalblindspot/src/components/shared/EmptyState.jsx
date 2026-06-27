
export default function EmptyState({ icon = '?', heading, message }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">{icon}</div>
      <h3 className="empty-state-heading">{heading}</h3>
      <p className="empty-state-message">{message}</p>
    </div>
  );
}
