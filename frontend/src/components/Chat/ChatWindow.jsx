import { useState, useEffect, useRef } from 'react';
import api from '../../utils/api';
import socketService from '../../utils/socket';
import GroupInfoModal from '../Common/GroupInfoModal';

const ChatWindow = ({ chat, currentUser }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [typing, setTyping] = useState('');
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (chat) {
      fetchMessages();
      socketService.joinRoom(chat._id);
    }
  }, [chat]);

  useEffect(() => {
    // Socket listeners
    socketService.on('new_private_message', handleNewMessage);
    socketService.on('new_group_message', handleNewMessage);
    socketService.on('user_typing_private', handleTyping);
    socketService.on('user_typing_group', handleTyping);
    socketService.on('user_stopped_typing_private', handleStopTyping);
    socketService.on('user_stopped_typing_group', handleStopTyping);
    
    return () => {
      socketService.off('new_private_message', handleNewMessage);
      socketService.off('new_group_message', handleNewMessage);
      socketService.off('user_typing_private', handleTyping);
      socketService.off('user_typing_group', handleTyping);
      socketService.off('user_stopped_typing_private', handleStopTyping);
      socketService.off('user_stopped_typing_group', handleStopTyping);
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    if (!chat) return;
    
    try {
      const endpoint = chat.type === 'group' 
        ? `/groups/${chat._id}/messages`
        : `/chats/${chat._id}/messages`;
      
      const response = await api.get(endpoint);
      setMessages(response.data.data);
      
      // Mark messages as read
      socketService.markMessagesRead(chat._id, chat.type === 'group');
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const handleNewMessage = (message) => {
    if (!chat || !message) return;
    
    const isForCurrentChat = 
      (chat.type === 'private' && message.privateChat === chat._id) ||
      (chat.type === 'group' && message.groupChat === chat._id);
    
    if (isForCurrentChat) {
      setMessages(prev => {
        // Check for duplicates by message ID or content+timestamp
        const isDuplicate = prev.some(msg => 
          msg._id === message._id || 
          (msg.content === message.content && 
           msg.sender._id === message.sender._id &&
           Math.abs(new Date(msg.createdAt) - new Date(message.createdAt)) < 1000)
        );
        
        if (isDuplicate) return prev;
        return [...prev, message];
      });
      
      // Mark as read if not from current user
      if (message.sender._id !== currentUser?._id) {
        socketService.markMessagesRead(chat._id, chat.type === 'group');
      }
    }
  };

  const handleTyping = (data) => {
    if (data.chatId === chat._id && data.userId !== currentUser._id) {
      setTyping(`${data.username} is typing...`);
    }
  };

  const handleStopTyping = (data) => {
    if (data.chatId === chat._id) {
      setTyping('');
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if ((!newMessage.trim() && !selectedFile) || loading) return;

    setLoading(true);
    
    try {
      const formData = new FormData();
      if (newMessage.trim()) formData.append('content', newMessage.trim());
      if (selectedFile) {
        formData.append('file', selectedFile);
        formData.append('messageType', selectedFile.type.startsWith('image/') ? 'image' : 'file');
      }

      const endpoint = chat.type === 'group' 
        ? `/groups/${chat._id}/messages`
        : `/chats/${chat._id}/messages`;
      
      const response = await api.post(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const sentMessage = response.data.data;
      
      // Add message to local state immediately
      setMessages(prev => [...prev, sentMessage]);
      
      setNewMessage('');
      setSelectedFile(null);
      socketService.stopTyping(chat._id, chat.type === 'group');
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    
    // Handle typing indicators
    if (e.target.value.trim()) {
      socketService.startTyping(chat._id, chat.type === 'group');
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set new timeout to stop typing
      typingTimeoutRef.current = setTimeout(() => {
        socketService.stopTyping(chat._id, chat.type === 'group');
      }, 1000);
    } else {
      socketService.stopTyping(chat._id, chat.type === 'group');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getChatName = () => {
    if (!chat) return '';
    
    if (chat.type === 'group') {
      return chat.groupName;
    }
    
    const otherUser = chat.participants?.find(p => p._id !== currentUser?._id);
    return otherUser?.username || 'Unknown User';
  };

  const getChatStatus = () => {
    if (!chat) return '';
    
    if (chat.type === 'group') {
      const memberCount = chat.members?.length || 0;
      const description = chat.description ? ` • ${chat.description}` : '';
      return `${memberCount} member${memberCount !== 1 ? 's' : ''}${description}`;
    }
    
    const otherUser = chat.participants?.find(p => p._id !== currentUser?._id);
    return otherUser?.status === 'online' ? 'Online' : 'Offline';
  };

  const formatMessageTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  if (!chat) {
    return (
      <div className="main-chat">
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '100%',
          color: '#6b7280',
          fontSize: '18px'
        }}>
          Select a chat to start messaging
        </div>
      </div>
    );
  }

  return (
    <div className="main-chat">
      <div className="chat-header">
        <div className="chat-header-info">
          <div 
            className="chat-avatar"
            style={{
              ...(chat.type === 'group' && chat.groupImage ? {
                backgroundImage: `url(${chat.groupImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              } : chat.type === 'group' ? {
                backgroundColor: '#10b981'
              } : {})
            }}
          >
            {getChatName()[0]?.toUpperCase()}
          </div>
          <div>
            <div className="chat-header-name">{getChatName()}</div>
            <div className="chat-header-status">{getChatStatus()}</div>
          </div>
        </div>
        {chat.type === 'group' && (
          <button
            onClick={() => setShowGroupInfo(true)}
            style={{
              padding: '8px 12px',
              background: 'transparent',
              border: '1px solid #4f46e5',
              borderRadius: '6px',
              color: '#4f46e5',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            Group Info
          </button>
        )}
      </div>

      <div className="messages-container">
        {messages.map((message) => (
          <div
            key={message._id}
            className={`message ${message.sender._id === currentUser._id ? 'own' : ''}`}
          >
            <div 
              className="message-avatar"
              style={{
                ...(message.sender.avatar ? {
                  backgroundImage: `url(${message.sender.avatar})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                } : {})
              }}
            >
              {!message.sender.avatar && message.sender.username[0].toUpperCase()}
            </div>
            <div className="message-content">
              {message.messageType === 'image' && message.fileUrl ? (
                <div>
                  <img 
                    src={message.fileUrl} 
                    alt="Shared image" 
                    style={{
                      maxWidth: '200px',
                      maxHeight: '200px',
                      borderRadius: '8px',
                      marginBottom: message.content ? '8px' : '4px'
                    }}
                  />
                  {message.content && <div className="message-text">{message.content}</div>}
                </div>
              ) : message.messageType === 'file' && message.fileUrl ? (
                <div>
                  <a 
                    href={message.fileUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ color: '#4f46e5', textDecoration: 'none' }}
                  >
                    📎 {message.content || 'File'}
                  </a>
                </div>
              ) : (
                <div className="message-text">{message.content}</div>
              )}
              <div className="message-time">
                {formatMessageTime(message.createdAt)}
              </div>
            </div>
          </div>
        ))}
        
        {typing && (
          <div className="typing-indicator">{typing}</div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <form className="message-input-container" onSubmit={sendMessage}>
        <input
          type="file"
          accept="image/*,*/*"
          onChange={(e) => setSelectedFile(e.target.files[0])}
          style={{ display: 'none' }}
          id="file-input"
        />
        <label 
          htmlFor="file-input"
          style={{
            padding: '8px',
            cursor: 'pointer',
            color: '#6b7280',
            fontSize: '18px'
          }}
        >
          📎
        </label>
        {selectedFile && (
          <div style={{
            fontSize: '12px',
            color: '#4f46e5',
            marginRight: '8px'
          }}>
            {selectedFile.name}
          </div>
        )}
        <input
          type="text"
          className="message-input"
          placeholder="Type a message..."
          value={newMessage}
          onChange={handleInputChange}
          disabled={loading}
        />
        <button
          type="submit"
          className="send-button"
          disabled={(!newMessage.trim() && !selectedFile) || loading}
        >
          ➤
        </button>
      </form>
      
      <GroupInfoModal
        group={chat}
        isOpen={showGroupInfo}
        onClose={() => setShowGroupInfo(false)}
        currentUser={currentUser}
      />
    </div>
  );
};

export default ChatWindow;