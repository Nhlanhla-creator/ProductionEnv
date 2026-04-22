"use client";
import React, { useState } from 'react';
import { Search, Send, Paperclip, MoreVertical, MessageSquare } from 'lucide-react';

const AssociatorMessages = () => {
  const [selectedChat, setSelectedChat] = useState(null);
  const [messageInput, setMessageInput] = useState('');

  const conversations = [
    { id: 1, name: 'TechStars Africa', lastMessage: 'Looking forward to our meeting!', time: '10:30 AM', unread: 2, avatar: '🚀' },
    { id: 2, name: 'Innovation Hub', lastMessage: 'Thanks for connecting', time: 'Yesterday', unread: 0, avatar: '🏢' },
    { id: 3, name: 'Green Energy Fund', lastMessage: 'Please review the proposal', time: 'Yesterday', unread: 1, avatar: '🌱' },
    { id: 4, name: 'Growth Partners', lastMessage: 'Let\'s schedule a call', time: 'Monday', unread: 0, avatar: '📈' },
  ];

  const messages = [
    { id: 1, sender: 'them', message: 'Hi! Thanks for connecting.', time: '10:30 AM' },
    { id: 2, sender: 'me', message: 'Great to connect with you!', time: '10:31 AM' },
    { id: 3, sender: 'them', message: 'I think we could collaborate on several initiatives.', time: '10:32 AM' },
    { id: 4, sender: 'me', message: 'Absolutely! I\'d love to explore opportunities.', time: '10:33 AM' },
  ];

  const handleSendMessage = () => {
    if (messageInput.trim()) {
      // Handle send message logic
      setMessageInput('');
    }
  };

  return (
    <div className="associator-messages">
      <div className="messages-container">
        <div className="conversations-sidebar">
          <div className="sidebar-header">
            <h2>Messages</h2>
            <div className="search-conversations">
              <Search size={16} />
              <input type="text" placeholder="Search messages..." />
            </div>
          </div>
          <div className="conversations-list">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                className={`conversation-item ${selectedChat?.id === conv.id ? 'active' : ''}`}
                onClick={() => setSelectedChat(conv)}
              >
                <div className="conv-avatar">{conv.avatar}</div>
                <div className="conv-info">
                  <h4>{conv.name}</h4>
                  <p>{conv.lastMessage}</p>
                </div>
                <div className="conv-meta">
                  <span className="conv-time">{conv.time}</span>
                  {conv.unread > 0 && <span className="unread-badge">{conv.unread}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="chat-area">
          {selectedChat ? (
            <>
              <div className="chat-header">
                <div className="chat-user">
                  <div className="chat-avatar">{selectedChat.avatar}</div>
                  <div>
                    <h3>{selectedChat.name}</h3>
                    <p>Online</p>
                  </div>
                </div>
                <button className="more-options">
                  <MoreVertical size={18} />
                </button>
              </div>

              <div className="chat-messages">
                {messages.map((msg) => (
                  <div key={msg.id} className={`message ${msg.sender === 'me' ? 'sent' : 'received'}`}>
                    <div className="message-bubble">
                      <p>{msg.message}</p>
                      <span className="message-time">{msg.time}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="chat-input">
                <button className="attach-btn">
                  <Paperclip size={18} />
                </button>
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <button className="send-btn" onClick={handleSendMessage}>
                  <Send size={18} />
                </button>
              </div>
            </>
          ) : (
            <div className="no-chat-selected">
              <MessageSquare size={48} />
              <h3>Select a conversation</h3>
              <p>Choose a contact to start messaging</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssociatorMessages;