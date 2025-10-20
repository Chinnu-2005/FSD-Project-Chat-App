import { useState } from 'react';
import api from '../../utils/api';

const UserProfileModal = ({ user, isOpen, onClose, currentUser }) => {
  const [loading, setLoading] = useState(false);
  const [requestSent, setRequestSent] = useState(false);

  const sendConnectionRequest = async () => {
    setLoading(true);
    try {
      await api.post(`/users/connect/${user._id}`);
      setRequestSent(true);
    } catch (error) {
      console.error('Failed to send connection request:', error);
    } finally {
      setLoading(false);
    }
  };

  const startChat = async () => {
    try {
      const response = await api.get(`/chats/${user._id}`);
      onClose();
      // You can add callback here to select the chat
    } catch (error) {
      console.error('Failed to start chat:', error);
    }
  };

  if (!isOpen || !user) return null;

  const isConnected = currentUser?.connections?.some(conn => conn._id === user._id);
  const hasPendingRequest = currentUser?.pendingRequests?.includes(user._id);

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