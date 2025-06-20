import React from 'react';
import './ChatButton.css';
import { ReactComponent as ChatIcon } from './assets/chat-icon.svg';

function ChatButton({ onClick, unreadCount }) {
  return (
    <button className="chat-btn" onClick={onClick}>
      <ChatIcon className="chat-btn-icon" />
      <span className="chat-btn-text">Chat</span>
      {unreadCount > 0 && (
        <span className="chat-badge">{unreadCount}</span>
      )}
    </button>
  );
}

export default ChatButton; 