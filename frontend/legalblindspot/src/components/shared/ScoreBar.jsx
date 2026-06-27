import { useEffect, useState } from 'react';
import { getTierColor } from '../../utils/trustColors';

export default function ScoreBar({ score, max = 100, label, showValue = true, color }) {
  const [animated, setAnimated] = useState(false);
  const percent = Math.min((score / max) * 100, 100);
  const barColor = color || getTierColor(score);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 50);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="score-bar">
      {label && <span className="score-bar-label">{label}</span>}
      <div className="score-bar-track">
        <div
          className="score-bar-fill"
          style={{
            width: animated ? `${percent}%` : '0%',
            background: barColor
          }}
        />
      </div>
      {showValue && (
        <span className="score-bar-value" style={{ color: barColor }}>
          {score}/{max}
        </span>
      )}
    </div>
  );
}
