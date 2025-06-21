import React, { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import './ChatModal.css';

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
const SOCKET_SERVER_URL = API_URL;

function ChatModal({ show, onClose, order, currentUser, onMarkAsRead }) {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const markMessagesAsRead = async () => {
    if (!order || !onMarkAsRead) return;
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/api/chat/read/${order.id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      onMarkAsRead(order.id);
    } catch (err) {
      console.error("Failed to mark messages as read", err);
    }
  };

  useEffect(() => {
    if (show && order) {
      const newSocket = io(SOCKET_SERVER_URL, {
        query: { token: localStorage.getItem('token') }
      });
      setSocket(newSocket);
      newSocket.emit('join_room', order.id);
      
      fetchMessageHistory();
      markMessagesAsRead();

      newSocket.on('receive_message', (data) => {
        setMessages(prev => [...prev, data]);
        // Also mark as read if modal is open when message arrives
        markMessagesAsRead();
      });

      return () => {
        newSocket.disconnect();
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, order]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchMessageHistory = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/chat/${order.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setMessages(data.messages);
      }
    } catch (err) {
      console.error("Failed to fetch message history", err);
    }
    setLoading(false);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket) return;

    const messageData = {
      room: order.id,
      sender_id: currentUser.id,
      sender_name: currentUser.name,
      message: newMessage,
      sent_at: new Date().toISOString(),
    };

    socket.emit('send_message', messageData);

    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ orderId: order.id, message: newMessage }),
      });
    } catch (err) {
      console.error("Failed to save message", err);
    }
    
    setMessages(prev => [...prev, messageData]);
    setNewMessage('');
  };
  
  if (!show) return null;

  return (
    <div className="chat-modal-backdrop">
      <div className="chat-modal-container">
        <div className="chat-modal-header">
          <h5>Chat for Order: {order.product_name}</h5>
          <button onClick={onClose} className="btn-close"></button>
        </div>
        <div className="chat-modal-body">
          {loading ? (
            <div className="text-center">Loading messages...</div>
          ) : (
            messages.map((msg, index) => (
              <div key={index} className={`message ${msg.sender_id === currentUser.id ? 'sent' : 'received'}`}>
                <div className="message-sender">{msg.sender_id === currentUser.id ? "You" : msg.sender_name}</div>
                <div className="message-content">{msg.message}</div>
                <div className="message-time">{new Date(msg.sent_at).toLocaleTimeString()}</div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
        <div className="chat-modal-footer">
          <form onSubmit={handleSendMessage} className="d-flex">
            <input
              type="text"
              className="form-control"
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
            />
            <button type="submit" className="btn eco-btn ms-2">Send</button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ChatModal; 