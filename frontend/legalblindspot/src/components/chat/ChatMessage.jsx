import { formatTime } from '../../utils/formatters';
import TrustBadge from '../shared/TrustBadge';

export default function ChatMessage({ message, compact }) {
  const isUser = message.role === 'user';

  return (
    <div className={`chat-message ${isUser ? 'chat-message-user' : 'chat-message-bot'} ${message.isError ? 'chat-message-error' : ''}`}>
      {!isUser && (
        <div className="chat-avatar chat-avatar-bot">L</div>
      )}

      <div className="chat-bubble-wrapper">
        {message.caseDetected && (
          <div className="chat-case-banner">
            <span className="chat-case-icon">||</span>
            Case detected: <strong>{message.caseDetected}</strong>
            <span className="chat-case-dot">-</span>
            Running viability assessment...
          </div>
        )}

        <div className={`chat-bubble ${isUser ? 'chat-bubble-user' : 'chat-bubble-bot'}`}>
          <div className="chat-content">{message.content}</div>
        </div>

        {message.advocates && message.advocates.length > 0 && (
          <div className="chat-inline-advocates">
            {message.advocates.slice(0, 3).map((adv, i) => (
              <div key={i} className="chat-advocate-mini">
                <div className="chat-advocate-mini-header">
                  <strong>{adv.name}</strong>
                  {adv.trustScore != null && (
                    <TrustBadge score={adv.trustScore} size="sm" />
                  )}
                </div>
                <div className="chat-advocate-mini-details">
                  {adv.consultationFee != null && (
                    <span className="chat-advocate-fee">
                      Rs. {adv.consultationFee}
                    </span>
                  )}
                  {adv.practiceAreas && adv.practiceAreas[0] && (
                    <span className="chat-advocate-area">{adv.practiceAreas[0]}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <span className="chat-timestamp">{formatTime(message.timestamp)}</span>
      </div>

      {isUser && (
        <div className="chat-avatar chat-avatar-user">U</div>
      )}
    </div>
  );
}
