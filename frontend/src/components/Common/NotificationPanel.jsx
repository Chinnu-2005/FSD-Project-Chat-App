import { useState, useEffect } from 'react';
import api from '../../utils/api';

const NotificationPanel = ({ isOpen, onClose, onConnectionUpdate }) => {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchPendingRequests();
    }
  }, [isOpen]);

  const fetchPendingRequests = async () => {
    try {
      const response = await api.get('/users/pending-requests');
      setPendingRequests(response.data.data);
    } catch (error) {
      console.error('Failed to fetch pending requests:', error);
    }
  };

  const handleRequest = async (userId, action) => {
    setLoading(true);
    try {
      await api.post(`/users/${action}/${userId}`);
      setPendingRequests(prev => prev.filter(req => req._id !== userId));
      if (onConnectionUpdate) {
        onConnectionUpdate();
      }
    } catch (error) {
      console.error(`Failed to ${action} request:`, error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

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
        padding: '20px',
        width: '400px',
        maxHeight: '500px',
        border: '1px solid #3a3d4a'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h2 style={{ color: '#ffffff', margin: 0 }}>Connection Requests</h2>
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

        <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
          {pendingRequests.length === 0 ? (
            <p style={{ color: '#6b7280', textAlign: 'center', margin: '20px 0' }}>
              No pending requests
            </p>
          ) : (
            pendingRequests.map(user => (
              <div key={user._id} style={{
                display: 'flex',
                alignItems: 'center',
                padding: '15px',
                border: '1px solid #3a3d4a',
                borderRadius: '8px',
                marginBottom: '10px'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: '500',
                  marginRight: '12px',
                  ...(user?.avatar ? {
                    backgroundImage: `url(${user.avatar})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  } : {
                    backgroundColor: '#4f46e5'
                  })
                }}>
                  {!user?.avatar && user.username[0].toUpperCase()}
                </div>
                
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#ffffff', fontWeight: '500', marginBottom: '2px' }}>
                    {user.username}
                  </div>
                  {user.bio && (
                    <div style={{ color: '#6b7280', fontSize: '12px' }}>
                      {user.bio}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleRequest(user._id, 'accept')}
                    disabled={loading}
                    style={{
                      padding: '6px 12px',
                      background: '#10b981',
                      border: 'none',
                      borderRadius: '4px',
                      color: 'white',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleRequest(user._id, 'decline')}
                    disabled={loading}
                    style={{
                      padding: '6px 12px',
                      background: '#ef4444',
                      border: 'none',
                      borderRadius: '4px',
                      color: 'white',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationPanel;