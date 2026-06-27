import { useRef, useEffect } from 'react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import TypingIndicator from './TypingIndicator';
import EmptyState from '../shared/EmptyState';

export default function ChatWindow({ messages, isLoading, onSend }) {
  const listRef = useRef(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  return (
    <div className="chat-window">
      <div className="chat-header">
        <div className="chat-header-left">
          <span className="chat-header-icon">L</span>
          <div>
            <h3 className="chat-header-title">LegalLink Chat</h3>
            <span className="chat-header-status">Online</span>
          </div>
        </div>
      </div>

      <div className="chat-messages" ref={listRef}>
        {messages.length === 0 && !isLoading && (
          <EmptyState
            icon="L"
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
