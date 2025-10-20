import { useState } from 'react';
import api from '../../utils/api';

const EditGroupModal = ({ group, isOpen, onClose, onGroupUpdated }) => {
  const [formData, setFormData] = useState({
    groupName: group?.groupName || '',
    description: group?.description || ''
  });
  const [groupImageFile, setGroupImageFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.groupName.trim()) return;

    setLoading(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('groupName', formData.groupName);
      formDataToSend.append('description', formData.description);
      if (groupImageFile) {
        formDataToSend.append('groupImage', groupImageFile);
      }

      const response = await api.patch(`/groups/${group._id}`, formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      onGroupUpdated(response.data.data);
      onClose();
    } catch (error) {
      console.error('Failed to update group:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !group) return null;

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
          <h2 style={{ color: '#ffffff', margin: 0 }}>Edit Group</h2>
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
              Group Image
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setGroupImageFile(e.target.files[0])}
              style={{
                width: '100%',
                padding: '10px',
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
              Group Name *
            </label>
            <input
              type="text"
              name="groupName"
              value={formData.groupName}
              onChange={handleChange}
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
              {loading ? 'Updating...' : 'Update Group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditGroupModal;