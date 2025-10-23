import { useState, useEffect } from 'react';
import api from '../../utils/api';

const UserProfileModal = ({ user, isOpen, onClose, currentUser, onChatStart, onConnectionUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  // Update connection status when user or currentUser changes
  useEffect(() => {
    if (currentUser?.connections && user) {
      const connected = currentUser.connections.some(conn => 
        (typeof conn === 'string' ? conn : conn._id) === user._id
      );
      console.log('Connection check:', { 
        userId: user._id, 
        connections: currentUser.connections, 
        connected 
      });
      setIsConnected(connected);
    }
  }, [currentUser, user]);

  const sendConnectionRequest = async () => {
    setLoading(true);
    try {
      await api.post(`/users/connect/${user._id}`);
      setRequestSent(true);
      if (onConnectionUpdate) {
        onConnectionUpdate();
      }
    } catch (error) {
      console.error('Failed to send connection request:', error.response?.data?.message || error.message);
      alert(error.response?.data?.message || 'Failed to send connection request');
    } finally {
      setLoading(false);
    }
  };

  const startChat = async () => {
    try {
      const response = await api.get(`/chats/${user._id}`);
      const chat = { ...response.data.data, type: 'private' };
      if (onChatStart) {
        onChatStart(chat);
      } else {
        onClose();
      }
    } catch (error) {
      console.error('Failed to start chat:', error);
    }
  };

  if (!isOpen || !user) return null;


  const hasPendingRequest = currentUser?.pendingRequests?.some(req => 
    (typeof req === 'string' ? req : req._id) === user._id
  );
  
  console.log('User profile modal state:', { 
    isConnected, 
    requestSent, 
    hasPendingRequest,
    userId: user._id 
  });

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: '#252836',
        borderRadius: '12px',
        padding: '30px',
        width: '400px',
        border: '1px solid #3a3d4a'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h2 style={{ color: '#ffffff', margin: 0 }}>User Profile</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#6b7280',
              fontSize: '20px',
              cursor: 'pointer'
            }}
          >
            ×
          </button>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '32px',
            fontWeight: '500',
            margin: '0 auto 15px',
            ...(user?.avatar ? {
              backgroundImage: `url(${user.avatar})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            } : {
              backgroundColor: '#4f46e5'
            })
          }}>
            {!user?.avatar && (user?.username?.[0]?.toUpperCase() || 'U')}
          </div>
          <h3 style={{ color: '#ffffff', margin: '0 0 5px' }}>
            @{user?.username}
          </h3>
          {user?.bio && (
            <p style={{ color: '#6b7280', margin: 0, fontSize: '14px' }}>
              {user.bio}
            </p>
          )}
        </div>

        <div style={{
          display: 'flex',
          gap: '10px',
          justifyContent: 'center'
        }}>
          {isConnected ? (
            <button
              onClick={startChat}
              className="btn btn-primary"
            >
              Start Chat
            </button>
          ) : requestSent || hasPendingRequest ? (
            <button
              disabled
              className="btn btn-secondary"
            >
              Request Sent
            </button>
          ) : (
            <button
              onClick={sendConnectionRequest}
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? 'Sending...' : 'Send Connection Request'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfileModal;