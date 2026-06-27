import { useRef, useEffect } from 'react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import TypingIndicator from './TypingIndicator';
import EmptyState from '../shared/EmptyState';
import { Scale, MessageSquare } from 'lucide-react';

export default function ChatWindow({ messages, isLoading, onSend }) {
  const listRef = useRef(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  return (
    <div className="chat-window" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
      <div className="chat-header" style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-primary)' }}>
        <div className="chat-header-left" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span className="chat-header-icon" style={{ background: 'var(--accent-dim)', color: 'var(--accent)', padding: '6px', borderRadius: '50%', display: 'inline-flex' }}>
            <Scale size={18} />
          </span>
          <div>
            <h3 className="chat-header-title" style={{ fontFamily: 'var(--font-serif)', fontSize: '1rem', margin: 0 }}>LegalLink Chat</h3>
            <span className="chat-header-status" style={{ color: 'var(--success)', fontSize: '0.8rem' }}>Online</span>
          </div>
        </div>
      </div>

      <div className="chat-messages" ref={listRef} style={{ background: 'var(--bg-secondary)' }}>
        {messages.length === 0 && !isLoading && (
          <EmptyState
            icon={<MessageSquare size={32} style={{ color: 'var(--text-secondary)' }} />}
            heading="Start a conversation"
            message="Describe your legal situation and LegalLink will help you understand your rights, find advocates, and assess your case."
          />
        )}

        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}

        {isLoading && <TypingIndicator />}
      </div>

      <ChatInput onSend={onSend} disabled={isLoading} />
    </div>
  );
}
