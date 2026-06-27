import { useRef, useEffect } from 'react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import TypingIndicator from './TypingIndicator';
import EmptyState from '../shared/EmptyState';
import { Scale, MessageSquare } from 'lucide-react';

export default function ChatWindow({ messages, isLoading, onSend, intakeComplete = false }) {
  const listRef = useRef(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  return (
    <div className="chat-window glass-card">
      <div className="chat-header glass-panel-sm">
        <div className="chat-header-left">
          <span className="chat-header-icon">
            <Scale size={18} />
          </span>
          <div>
            <h3 className="chat-header-title">LegalLink Chat</h3>
            <span className="chat-header-status">Online</span>
          </div>
        </div>
      </div>

      <div className="chat-messages" ref={listRef}>
        {messages.length === 0 && !isLoading && (
          <EmptyState
            icon={<MessageSquare size={32} />}
            heading="Start a conversation"
            message="Describe your legal situation and LegalLink will help you understand your rights, find advocates, and assess your case."
          />
        )}

        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} intakeComplete={intakeComplete} />
        ))}

        {isLoading && <TypingIndicator />}
      </div>

      <ChatInput onSend={onSend} disabled={isLoading} />
    </div>
  );
}
