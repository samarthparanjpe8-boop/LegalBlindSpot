import { useState } from 'react';

export default function ErrorBanner({ message, onDismiss }) {
  const [visible, setVisible] = useState(true);

  if (!visible || !message) return null;

  function handleDismiss() {
    setVisible(false);
    if (onDismiss) onDismiss();
  }

  return (
    <div className="error-banner">
      <span className="error-banner-icon">!</span>
      <span className="error-banner-text">{message}</span>
      <button className="error-banner-close" onClick={handleDismiss}>
        x
      </button>
    </div>
  );
}
