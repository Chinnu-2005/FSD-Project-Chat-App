import { useState, useEffect } from 'react';
import Sidebar from '../components/Chat/Sidebar';
import ChatWindow from '../components/Chat/ChatWindow';
import Toast from '../components/Common/Toast';
import api from '../utils/api';
import socketService from '../utils/socket';

const ChatPage = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeChat, setActiveChat] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchCurrentUser();
    
    const token = localStorage.getItem('authToken');
    if (token && !socketService.socket) {
      const socket = socketService.connect(token);
      
      // Handle queued notifications for offline messages
      socket.on('queued_notifications', (data) => {
        if (data.count > 0) {
          setToast({
            message: `You have ${data.count} new message${data.count > 1 ? 's' : ''} while you were offline`,
            type: 'info'
          });
        }
      });
    }
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const response = await api.get('/users/profile');
      setCurrentUser(response.data.data);
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
    }
  };

  const handleChatSelect = (chat) => {
    setActiveChat(chat);
  };

  return (
    <div className="app">
      <Sidebar
        onChatSelect={handleChatSelect}
        activeChat={activeChat}
        currentUser={currentUser}
        onUserUpdate={(updatedUser) => {
          setCurrentUser(updatedUser);
        }}
      />
      <ChatWindow
        chat={activeChat}
        currentUser={currentUser}
      />
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default ChatPage;