import { useState, useRef, useEffect } from 'react';

const COMMAND_CHIPS = [
  { label: 'assess', command: 'assess' },
  { label: 'checkadvice', command: 'checkadvice' },
  { label: 'intake', command: 'intake' },
  { label: 'mydocs', command: 'mydocs' },
  { label: 'advocates', command: 'advocates' }
];

export default function ChatInput({ onSend, disabled }) {
  const [text, setText] = useState('');
  const [hasAnimated, setHasAnimated] = useState(false);
  const textareaRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => setHasAnimated(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  function handleSubmit(e) {
    e.preventDefault();
    if (!text.trim() || disabled) return;
    onSend(text.trim());
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }

  function handleInput(e) {
    setText(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  }

  function handleChipClick(command) {
    onSend(command);
  }

  return (
    <div className="chat-input-container">
      <div className="chat-chips">
        {COMMAND_CHIPS.map((chip) => (
          <button
            key={chip.command}
            className={`chat-chip ${!hasAnimated ? 'chat-chip-pulse' : ''}`}
            onClick={() => handleChipClick(chip.command)}
            disabled={disabled}
          >
            {chip.label}
          </button>
        ))}
      </div>
      <form className="chat-input-form" onSubmit={handleSubmit}>
        <textarea
          ref={textareaRef}
          className="chat-input-textarea"
          value={text}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Describe your legal situation..."
          rows={1}
          disabled={disabled}
        />
        <button
          type="submit"
          className="chat-input-send"
          disabled={!text.trim() || disabled}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </form>
    </div>
  );
}
