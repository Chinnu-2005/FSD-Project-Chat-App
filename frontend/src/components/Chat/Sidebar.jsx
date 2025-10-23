import { useState, useEffect } from 'react';
import api from '../../utils/api';
import socketService from '../../utils/socket';
import ProfileModal from '../Common/ProfileModal';
import UserProfileModal from '../Common/UserProfileModal';
import NotificationPanel from '../Common/NotificationPanel';
import CreateGroupModal from '../Common/CreateGroupModal';
import ConfirmDialog from '../Common/ConfirmDialog';

const Sidebar = ({ onChatSelect, activeChat, currentUser, onUserUpdate }) => {
  const [chats, setChats] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showProfile, setShowProfile] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [groups, setGroups] = useState([]);
  const [showGroups, setShowGroups] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    fetchChats();
    fetchPendingCount();
    fetchGroups();
    
    // Socket listeners
    socketService.on('new_private_message', handleNewMessage);
    socketService.on('new_group_message', handleNewMessage);
    
    return () => {
      socketService.off('new_private_message', handleNewMessage);
      socketService.off('new_group_message', handleNewMessage);
    };
  }, []);

  const fetchChats = async () => {
    try {
      const [privateChats, groups] = await Promise.all([
        api.get('/chats'),
        api.get('/groups')
      ]);
      
      const allChats = [
        ...privateChats.data.data.map(chat => ({ ...chat, type: 'private' })),
        ...groups.data.data.map(group => ({ ...group, type: 'group' }))
      ];
      
      setChats(allChats.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)));
    } catch (error) {
      console.error('Failed to fetch chats:', error);
    }
  };

  const handleNewMessage = (message) => {
    setChats(prevChats => {
      const updatedChats = prevChats.map(chat => {
        if (
          (chat.type === 'private' && chat._id === message.privateChat) ||
          (chat.type === 'group' && chat._id === message.groupChat)
        ) {
          return { ...chat, latestMessage: message, updatedAt: new Date() };
        }
        return chat;
      });
      
      return updatedChats.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    });
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    
    if (query.trim()) {
      try {
        const response = await api.get(`/users/search?query=${query}`);
        setSearchResults(response.data.data);
      } catch (error) {
        console.error('Search failed:', error);
      }
    } else {
      setSearchResults([]);
    }
  };

  const startChat = async (userId) => {
    try {
      const response = await api.get(`/chats/${userId}`);
      const chat = { ...response.data.data, type: 'private' };
      onChatSelect(chat);
      setSearchQuery('');
      setSearchResults([]);
      fetchChats();
    } catch (error) {
      console.error('Failed to start chat:', error);
    }
  };

  const handleUserClick = (user) => {
    setSelectedUser(user);
    setShowUserProfile(true);
  };

  const fetchPendingCount = async () => {
    try {
      const response = await api.get('/users/pending-requests');
      setPendingCount(response.data.data.length);
    } catch (error) {
      console.error('Failed to fetch pending requests:', error);
    }
  };

  const fetchGroups = async () => {
    try {
      const response = await api.get('/groups');
      setGroups(response.data.data);
    } catch (error) {
      console.error('Failed to fetch groups:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
      localStorage.removeItem('authToken');
      socketService.disconnect();
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout failed:', error);
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(true);
  };

  const getChatName = (chat) => {
    if (chat.type === 'group') {
      return chat.groupName;
    }
    
    const otherUser = chat.participants?.find(p => p._id !== currentUser?._id);
    return otherUser?.username || 'Unknown User';
  };

  const getChatAvatar = (chat) => {
    if (chat.type === 'group') {
      return chat.groupName?.[0]?.toUpperCase() || 'G';
    }
    
    const otherUser = chat.participants?.find(p => p._id !== currentUser?._id);
    return otherUser?.username?.[0]?.toUpperCase() || 'U';
  };

  const getLastMessage = (chat) => {
    if (!chat.latestMessage) return 'No messages yet';
    
    const message = chat.latestMessage;
    if (message.messageType === 'image') return '📷 Image';
    if (message.messageType === 'file') return '📎 File';
    return message.content || 'Message';
  };

  const formatTime = (date) => {
    if (!date) return '';
    const now = new Date();
    const messageDate = new Date(date);
    const diffInHours = (now - messageDate) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return messageDate.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
    }
    
    return messageDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="logo">ChatApp</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div 
            onClick={() => setShowNotifications(true)}
            style={{
              position: 'relative',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '50%',
              backgroundColor: '#374151'
            }}
          >
            🔔
            {pendingCount > 0 && (
              <div style={{
                position: 'absolute',
                top: '0',
                right: '0',
                width: '18px',
                height: '18px',
                backgroundColor: '#ef4444',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px',
                color: 'white',
                fontWeight: 'bold'
              }}>
                {pendingCount}
              </div>
            )}
          </div>
          <div 
            className="user-avatar"
            onClick={() => setShowProfile(true)}
            style={{ 
              cursor: 'pointer',
              ...(currentUser?.avatar ? {
                backgroundImage: `url(${currentUser.avatar})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              } : {
                backgroundColor: '#4f46e5'
              })
            }}
          >
            {!currentUser?.avatar && (currentUser?.username?.[0]?.toUpperCase() || 'U')}
          </div>
          <div 
            onClick={confirmLogout}
            style={{
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '50%',
              backgroundColor: '#ef4444',
              fontSize: '14px'
            }}
            title="Logout"
          >
            🚪
          </div>
        </div>
      </div>

      <div className="search-bar">
        <input
          type="text"
          className="search-input"
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>

      <div style={{ padding: '10px 20px', borderBottom: '1px solid #3a3d4a' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setShowGroups(false)}
            style={{
              padding: '6px 12px',
              background: !showGroups ? '#4f46e5' : 'transparent',
              border: '1px solid #4f46e5',
              borderRadius: '4px',
              color: 'white',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            Chats
          </button>
          <button
            onClick={() => setShowGroups(true)}
            style={{
              padding: '6px 12px',
              background: showGroups ? '#4f46e5' : 'transparent',
              border: '1px solid #4f46e5',
              borderRadius: '4px',
              color: 'white',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            Groups ({groups.length})
          </button>
        </div>
        {showGroups && (
          <button
            onClick={() => setShowCreateGroup(true)}
            style={{
              width: '100%',
              padding: '8px 12px',
              background: '#10b981',
              border: 'none',
              borderRadius: '6px',
              color: 'white',
              fontSize: '12px',
              cursor: 'pointer',
              fontWeight: '500',
              marginTop: '10px'
            }}
          >
            + Create Group
          </button>
        )}
      </div>

      <div className="chat-list">
        {searchResults.length > 0 ? (
          searchResults.map(user => (
            <div
              key={user._id}
              className="chat-item"
              onClick={() => handleUserClick(user)}
            >
              <div className="chat-avatar"
                style={{
                  ...(user?.avatar ? {
                    backgroundImage: `url(${user.avatar})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  } : {
                    backgroundColor: '#4f46e5'
                  })
                }}
              >
                {!user?.avatar && user.username[0].toUpperCase()}
              </div>
              <div className="chat-info">
                <div className="chat-name">{user.username}</div>
                <div className="chat-last-message">Click to view profile</div>
              </div>
            </div>
          ))
        ) : showGroups ? (
          groups.map(group => (
            <div
              key={group._id}
              className="chat-item"
              onClick={() => onChatSelect({ ...group, type: 'group' })}
            >
              <div className="chat-avatar"
                style={{
                  ...(group?.groupImage ? {
                    backgroundImage: `url(${group.groupImage})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  } : {
                    backgroundColor: '#10b981'
                  })
                }}
              >
                {!group?.groupImage && group.groupName[0].toUpperCase()}
              </div>
              <div className="chat-info">
                <div className="chat-name">{group.groupName}</div>
                <div className="chat-last-message">{group.members?.length || 0} members</div>
              </div>
            </div>
          ))
        ) : (
          chats.map(chat => (
            <div
              key={chat._id}
              className={`chat-item ${activeChat?._id === chat._id ? 'active' : ''}`}
              onClick={() => onChatSelect(chat)}
            >
              <div className="chat-avatar">
                {getChatAvatar(chat)}
                {chat.type === 'private' && (
                  <div className="online-indicator"></div>
                )}
              </div>
              <div className="chat-info">
                <div className="chat-name">{getChatName(chat)}</div>
                <div className="chat-last-message">{getLastMessage(chat)}</div>
              </div>
              <div className="chat-time">
                {formatTime(chat.updatedAt)}
              </div>
            </div>
          ))
        )}
      </div>
      
      <ProfileModal
        user={currentUser}
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
        onUserUpdate={(updatedUser) => {
          if (onUserUpdate) {
            onUserUpdate(updatedUser);
          }
        }}
      />
      
      <UserProfileModal
        user={selectedUser}
        isOpen={showUserProfile}
        onClose={() => setShowUserProfile(false)}
        currentUser={currentUser}
        onChatStart={(chat) => {
          onChatSelect(chat);
          setShowUserProfile(false);
          fetchChats(); // Refresh chat list
        }}
        onConnectionUpdate={() => {
          fetchChats(); // Refresh chats when connection status changes
        }}
      />
      
      <NotificationPanel
        isOpen={showNotifications}
        onClose={() => {
          setShowNotifications(false);
          fetchPendingCount();
          fetchGroups();
          if (onUserUpdate) onUserUpdate();
        }}
        onConnectionUpdate={() => {
          fetchPendingCount();
          if (onUserUpdate) onUserUpdate();
        }}
      />
      
      <CreateGroupModal
        isOpen={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
        onGroupCreated={(group) => {
          fetchChats();
          fetchGroups();
          onChatSelect({ ...group, type: 'group' });
        }}
      />
      
      <ConfirmDialog
        isOpen={showLogoutConfirm}
        title="Confirm Logout"
        message="Are you sure you want to logout?"
        onConfirm={() => {
          setShowLogoutConfirm(false);
          handleLogout();
        }}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </div>
  );
};

export default Sidebar;