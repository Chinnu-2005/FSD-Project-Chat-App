import { useState } from 'react';
import api from '../../utils/api';
import socketService from '../../utils/socket';

const ProfileModal = ({ user, isOpen, onClose, onUserUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    bio: user?.bio || ''
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('bio', formData.bio);
      if (avatarFile) {
        formDataToSend.append('avatar', avatarFile);
      }
      
      const response = await api.patch('/users/profile', formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setIsEditing(false);
      setAvatarFile(null);
      
      // Update parent component with new user data
      if (onUserUpdate) {
        onUserUpdate(response.data.data);
      }
      
    } catch (error) {
      console.error('Failed to update profile:', error);
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
        width: '400px',
        border: '1px solid #3a3d4a'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h2 style={{ color: '#ffffff', margin: 0 }}>Profile</h2>
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
          <p style={{ color: '#6b7280', margin: 0, fontSize: '14px' }}>
            {user?.email}
          </p>
        </div>

        {isEditing ? (
          <div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{
                display: 'block',
                marginBottom: '5px',
                fontSize: '14px',
                color: '#ffffff'
              }}>
                Profile Picture
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setAvatarFile(e.target.files[0])}
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
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{
                display: 'block',
                marginBottom: '5px',
                fontSize: '14px',
                color: '#ffffff'
              }}>
                Bio
              </label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                placeholder="Tell us about yourself..."
                style={{
                  width: '100%',
                  padding: '10px',
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
                onClick={() => setIsEditing(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="btn btn-primary"
              >
                {loading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '5px',
                fontSize: '14px',
                color: '#6b7280'
              }}>
                Bio
              </label>
              <p style={{
                color: '#ffffff',
                margin: 0,
                fontSize: '14px',
                minHeight: '20px'
              }}>
                {user?.bio || 'No bio added yet'}
              </p>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '5px',
                fontSize: '14px',
                color: '#6b7280'
              }}>
                Status
              </label>
              <span style={{
                color: user?.status === 'online' ? '#10b981' : '#6b7280',
                fontSize: '14px',
                textTransform: 'capitalize'
              }}>
                {user?.status || 'offline'}
              </span>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'center'
            }}>
              <button
                onClick={() => setIsEditing(true)}
                className="btn btn-secondary"
              >
                Edit Profile
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileModal;