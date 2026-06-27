import { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';

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
          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
