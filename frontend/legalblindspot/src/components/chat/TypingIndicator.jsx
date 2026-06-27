
export default function TypingIndicator() {
  return (
    <div className="typing-indicator">
      <div className="typing-avatar">L</div>
      <div className="typing-bubble">
        <div className="typing-dots">
          <span className="typing-dot" />
          <span className="typing-dot" />
          <span className="typing-dot" />
        </div>
        <span className="typing-text">LegalLink is thinking...</span>
      </div>
    </div>
  );
}
