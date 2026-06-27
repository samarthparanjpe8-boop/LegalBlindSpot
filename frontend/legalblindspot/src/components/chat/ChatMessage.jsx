import { formatTime, formatCurrency } from '../../utils/formatters';
import TrustBadge from '../shared/TrustBadge';

export default function ChatMessage({ message, intakeComplete = false }) {
  const isUser = message.role === 'user';
  const showAdvocates = intakeComplete && message.advocates && message.advocates.length > 0;

  return (
    <div className={`chat-message ${isUser ? 'chat-message-user' : 'chat-message-bot'} ${message.isError ? 'chat-message-error' : ''}`}>
      {!isUser && (
        <div className="chat-avatar chat-avatar-bot">L</div>
      )}

      <div className="chat-bubble-wrapper">
        {message.caseDetected && (
          <div className="chat-case-banner">
            <span className="chat-case-icon">⚖</span>
            Case detected: <strong>{message.caseDetected}</strong>
            <span className="chat-case-dot">-</span>
            Running viability assessment...
          </div>
        )}

        <div className={`chat-bubble ${isUser ? 'chat-bubble-user' : 'chat-bubble-bot'}`}>
          <div className="chat-content">{message.content}</div>
        </div>

        {message.viability && (
          <div className="chat-viability-card">
            <div className="chat-viability-header">
              <div className="chat-viability-title">
                <span className="chat-viability-icon">⚖</span>
                Case Viability Assessment
              </div>
              <div className="chat-viability-badge-wrap">
                <span className={`badge badge-sm badge-${
                  message.viability.score > 70 ? 'success' : message.viability.score >= 50 ? 'warning' : 'danger'
                }`}>
                  {message.viability.verdict || (message.viability.score > 70 ? 'Strong' : message.viability.score >= 50 ? 'Moderate' : 'Weak')}
                </span>
              </div>
            </div>

            <div className="chat-viability-score-row">
              <div className="chat-viability-donut-mini">
                <svg viewBox="0 0 100 100" className="viability-svg-mini">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="var(--dash-border)" strokeWidth="10" />
                  <circle
                    cx="50" cy="50" r="42"
                    fill="none"
                    stroke={message.viability.score > 70 ? 'var(--success)' : message.viability.score >= 50 ? 'var(--warning)' : 'var(--danger)'}
                    strokeWidth="10"
                    strokeLinecap="square"
                    strokeDasharray={2 * Math.PI * 42}
                    strokeDashoffset={2 * Math.PI * 42 - (message.viability.score / 100) * 2 * Math.PI * 42}
                    transform="rotate(-90 50 50)"
                  />
                </svg>
                <div className="chat-viability-donut-score">
                  <span className="viability-score-num">{message.viability.score}</span>
                  <span className="viability-score-denom">/100</span>
                </div>
              </div>

              <div className="chat-viability-metrics">
                {message.viability.estimatedCost && (
                  <div className="chat-viability-metric-item">
                    <span className="chat-viability-metric-label">Est. Cost:</span>
                    <span className="chat-viability-metric-value">
                      {message.viability.estimatedCost.min != null
                        ? `${formatCurrency(message.viability.estimatedCost.min)} - ${formatCurrency(message.viability.estimatedCost.max)}`
                        : message.viability.estimatedCost}
                    </span>
                  </div>
                )}
                {message.viability.timeline && (
                  <div className="chat-viability-metric-item">
                    <span className="chat-viability-metric-label">Timeline:</span>
                    <span className="chat-viability-metric-value">{message.viability.timeline}</span>
                  </div>
                )}
                {message.viability.worthPursuing != null && (
                  <div className="chat-viability-metric-item">
                    <span className="chat-viability-metric-label">Worth Fighting:</span>
                    <span className={`chat-viability-metric-value ${message.viability.worthPursuing ? 'viability-yes' : 'viability-no'}`}>
                      {message.viability.worthPursuing ? 'Yes' : 'No'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {(message.viability.strengths?.length > 0 || message.viability.weaknesses?.length > 0) && (
              <details className="chat-viability-details">
                <summary className="chat-viability-details-summary">
                  Key Strengths & Weaknesses
                </summary>
                <div className="chat-viability-details-content">
                  <div className="chat-viability-columns-mini">
                    {message.viability.strengths && message.viability.strengths.length > 0 && (
                      <div className="chat-viability-col-mini">
                        <div className="chat-viability-col-title strengths">Strengths</div>
                        <ul className="chat-viability-list-mini">
                          {message.viability.strengths.map((s, i) => (
                            <li key={i} className="chat-viability-item-mini ok">{s}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {message.viability.weaknesses && message.viability.weaknesses.length > 0 && (
                      <div className="chat-viability-col-mini">
                        <div className="chat-viability-col-title weaknesses">Weaknesses</div>
                        <ul className="chat-viability-list-mini">
                          {message.viability.weaknesses.map((w, i) => (
                            <li key={i} className="chat-viability-item-mini bad">{w}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </details>
            )}
          </div>
        )}

        {showAdvocates && (
          <div className="chat-inline-advocates">
            {message.advocates.slice(0, 3).map((adv, i) => (
              <div key={i} className="chat-advocate-mini glass-card-sm">
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
