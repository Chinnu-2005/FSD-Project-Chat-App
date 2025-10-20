import { useState, useEffect } from 'react';
import api from '../../utils/api';

const CreateGroupModal = ({ isOpen, onClose, onGroupCreated }) => {
  const [formData, setFormData] = useState({
    groupName: '',
    description: ''
  });
  const [connections, setConnections] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchConnections();
    }
  }, [isOpen]);

  const fetchConnections = async () => {
    try {
      const response = await api.get('/users/connections');
      setConnections(response.data.data);
    } catch (error) {
      console.error('Failed to fetch connections:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const toggleMember = (userId) => {
    setSelectedMembers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.groupName.trim()) return;

    setLoading(true);
    try {
      const groupData = {
        ...formData,
        memberIds: selectedMembers
      };

      const response = await api.post('/groups', groupData);
      onGroupCreated(response.data.data);
      onClose();
      
      // Reset form
      setFormData({ groupName: '', description: '' });
      setSelectedMembers([]);
    } catch (error) {
      console.error('Failed to create group:', error);
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
        padding: '30px',
        width: '500px',
        maxHeight: '600px',
        border: '1px solid #3a3d4a',
        overflow: 'hidden'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h2 style={{ color: '#ffffff', margin: 0 }}>Create Group</h2>
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

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              color: '#ffffff'
            }}>
              Group Name *
            </label>
            <input
              type="text"
              name="groupName"
              value={formData.groupName}
              onChange={handleChange}
              placeholder="Enter group name"
              required
              style={{
                width: '100%',
                padding: '12px',
                background: '#1a1d29',
                border: '1px solid #3a3d4a',
                borderRadius: '6px',
                color: '#ffffff',
                fontSize: '14px'
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              color: '#ffffff'
            }}>
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Group description (optional)"
              style={{
                width: '100%',
                padding: '12px',
                background: '#1a1d29',
                border: '1px solid #3a3d4a',
                borderRadius: '6px',
                color: '#ffffff',
                fontSize: '14px',
                resize: 'vertical',
                minHeight: '80px'
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              color: '#ffffff'
            }}>
              Add Members ({selectedMembers.length} selected)
            </label>
            <div style={{
              maxHeight: '200px',
              overflowY: 'auto',
              border: '1px solid #3a3d4a',
              borderRadius: '6px',
              padding: '10px'
            }}>
              {connections.length === 0 ? (
                <p style={{ color: '#6b7280', textAlign: 'center', margin: '10px 0' }}>
                  No connections available
                </p>
              ) : (
                connections.map(user => (
                  <div
                    key={user._id}
                    onClick={() => toggleMember(user._id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '8px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      backgroundColor: selectedMembers.includes(user._id) ? '#4f46e5' : 'transparent',
                      marginBottom: '4px'
                    }}
                  >
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '14px',
                      fontWeight: '500',
                      marginRight: '10px',
                      ...(user?.avatar ? {
                        backgroundImage: `url(${user.avatar})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      } : {
                        backgroundColor: '#6b7280'
                      })
                    }}>
                      {!user?.avatar && user.username[0].toUpperCase()}
                    </div>
                    <span style={{ color: '#ffffff', fontSize: '14px' }}>
                      {user.username}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div style={{
            display: 'flex',
            gap: '10px',
            justifyContent: 'flex-end'
          }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.groupName.trim()}
              className="btn btn-primary"
            >
              {loading ? 'Creating...' : 'Create Group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGroupModal;