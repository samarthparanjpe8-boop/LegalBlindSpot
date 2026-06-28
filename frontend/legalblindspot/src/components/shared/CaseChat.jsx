import { useState, useEffect, useRef } from 'react';
import { Send, Paperclip } from 'lucide-react';
import { io } from 'socket.io-client';
import { useTheme } from '../../context/ThemeContext';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function CaseChat({ requestId, token, currentUserId, currentRole }) {
  const { theme } = useTheme();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!requestId || !token) return;

    // Initialize socket connection
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    // Authenticate
    socket.emit('authenticate', token);

    socket.on('authenticated', ({ userId, role }) => {
      console.log('Socket authenticated:', userId, role);
      setIsConnected(true);
      
      // Join case room
      socket.emit('join_case', requestId);
    });

    socket.on('auth_error', ({ error }) => {
      console.error('Socket auth error:', error);
      setIsConnected(false);
    });

    // Listen for message history (all previous messages when joining a room)
    socket.on('message_history', (history) => {
      setMessages(history);
      scrollToBottom();
    });

    // Listen for new messages
    socket.on('new_message', (message) => {
      setMessages((prev) => [...prev, message]);
      scrollToBottom();
    });

    // Listen for unread count
    socket.on('unread_count', ({ count }) => {
      setUnreadCount(count);
    });

    // Listen for read receipts
    socket.on('messages_read', ({ caseRequestId }) => {
      if (caseRequestId === requestId) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.sender !== currentUserId ? { ...msg, read: true, readAt: new Date() } : msg
          )
        );
      }
    });

    // Listen for errors
    socket.on('error', ({ message }) => {
      console.error('Socket error:', message);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [requestId, token, currentUserId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !socketRef.current) return;

    socketRef.current.emit('send_message', {
      caseRequestId: requestId,
      content: newMessage.trim(),
    });

    setNewMessage('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const markAsRead = () => {
    if (socketRef.current && unreadCount > 0) {
      socketRef.current.emit('mark_read', requestId);
      setUnreadCount(0);
    }
  };

  useEffect(() => {
    if (unreadCount > 0) {
      markAsRead();
    }
  }, [unreadCount]);

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isMyMessage = (message) => message.sender === currentUserId;

  return (
    <div className="case-chat">
      <div className="chat-header">
        <h3>Case Chat</h3>
        <div className="connection-status">
          <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`} />
          {isConnected ? 'Connected' : 'Connecting...'}
        </div>
      </div>

      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="empty-state">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message._id}
              className={`message ${isMyMessage(message) ? 'my-message' : 'other-message'}`}
            >
              <div className="message-content">
                <p>{message.content}</p>
                <div className="message-meta">
                  <span className="message-time">{formatTime(message.createdAt)}</span>
                  {isMyMessage(message) && message.read && (
                    <span className="read-receipt">Read</span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="message-input-container">
        <button className="attach-button" title="Attach file">
          <Paperclip size={20} />
        </button>
        <textarea
          className="message-input"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message..."
          rows={1}
          disabled={!isConnected}
        />
        <button
          className="send-button"
          onClick={handleSendMessage}
          disabled={!newMessage.trim() || !isConnected}
        >
          <Send size={20} />
        </button>
      </div>

      <style jsx>{`
        .case-chat {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: ${theme === 'dark' ? '#161614' : '#ffffff'};
          border-radius: 12px;
          overflow: hidden;
        }

        .chat-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .chat-header h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
        }

        .connection-status {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
        }

        .status-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #ccc;
        }

        .status-indicator.connected {
          background: #4ade80;
        }

        .status-indicator.disconnected {
          background: #f87171;
        }

        .messages-container {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .empty-state {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: ${theme === 'dark' ? '#5C5A56' : '#9ca3af'};
          font-size: 14px;
        }

        .message {
          max-width: 70%;
          display: flex;
          flex-direction: column;
        }

        .my-message {
          align-self: flex-end;
        }

        .other-message {
          align-self: flex-start;
        }

        .message-content {
          padding: 12px 16px;
          border-radius: 12px;
          background: ${theme === 'dark' ? '#2E2E2B' : '#f3f4f6'};
        }

        .my-message .message-content {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .message-content p {
          margin: 0;
          font-size: 14px;
          line-height: 1.4;
          color: ${theme === 'dark' ? '#F2F0ED' : '#111827'};
        }

        .my-message .message-content p {
          color: white;
        }

        .message-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 4px;
          font-size: 11px;
          opacity: 0.7;
          color: ${theme === 'dark' ? '#9E9B95' : '#6b7280'};
        }

        .read-receipt {
          font-size: 10px;
        }

        .message-input-container {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 20px;
          background: ${theme === 'dark' ? '#1C1C1A' : '#f9fafb'};
          border-top: 1px solid ${theme === 'dark' ? '#222220' : '#e5e7eb'};
        }

        .attach-button {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border: none;
          background: ${theme === 'dark' ? '#2E2E2B' : '#e5e7eb'};
          border-radius: 50%;
          cursor: pointer;
          color: ${theme === 'dark' ? '#9E9B95' : '#6b7280'};
          transition: all 0.2s;
        }

        .attach-button:hover {
          background: ${theme === 'dark' ? '#3E3E3B' : '#d1d5db'};
        }

        .message-input {
          flex: 1;
          padding: 12px 16px;
          border: 1px solid ${theme === 'dark' ? '#222220' : '#e5e7eb'};
          border-radius: 24px;
          font-size: 14px;
          resize: none;
          outline: none;
          font-family: inherit;
          background: ${theme === 'dark' ? '#161614' : '#ffffff'};
          color: ${theme === 'dark' ? '#F2F0ED' : '#111827'};
        }

        .message-input:focus {
          border-color: #667eea;
        }

        .message-input:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .message-input::placeholder {
          color: ${theme === 'dark' ? '#5C5A56' : '#9ca3af'};
        }

        .send-button {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border: none;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 50%;
          cursor: pointer;
          color: white;
          transition: all 0.2s;
        }

        .send-button:hover:not(:disabled) {
          transform: scale(1.05);
        }

        .send-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
