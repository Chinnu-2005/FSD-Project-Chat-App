import { useState, useEffect } from 'react';
import api from '../../utils/api';
import EditGroupModal from './EditGroupModal';

const GroupInfoModal = ({ group, isOpen, onClose, currentUser }) => {
  const [groupDetails, setGroupDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showEditGroup, setShowEditGroup] = useState(false);

  useEffect(() => {
    if (isOpen && group) {
      fetchGroupDetails();
    }
  }, [isOpen, group]);

  const fetchGroupDetails = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/groups/${group._id}`);
      setGroupDetails(response.data.data);
    } catch (error) {
      console.error('Failed to fetch group details:', error);
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = groupDetails?.admins?.some(admin => admin._id === currentUser?._id);

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
        width: '500px',
        maxHeight: '600px',
        border: '1px solid #3a3d4a',
        overflow: 'auto'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h2 style={{ color: '#ffffff', margin: 0 }}>Group Info</h2>
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

        {loading ? (
          <div style={{ textAlign: 'center', color: '#6b7280', padding: '20px' }}>
            Loading...
          </div>
        ) : groupDetails ? (
          <div>
            {/* Group Header */}
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
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
                ...(groupDetails.groupImage ? {
                  backgroundImage: `url(${groupDetails.groupImage})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                } : {
                  backgroundColor: '#10b981'
                })
              }}>
                {!groupDetails.groupImage && groupDetails.groupName[0].toUpperCase()}
              </div>
              <h3 style={{ color: '#ffffff', margin: '0 0 5px' }}>
                {groupDetails.groupName}
              </h3>
              <p style={{ color: '#6b7280', margin: 0, fontSize: '14px' }}>
                {groupDetails.members?.length || 0} members
              </p>
            </div>

            {/* Description */}
            {groupDetails.description && (
              <div style={{ marginBottom: '25px' }}>
                <h4 style={{ color: '#ffffff', margin: '0 0 10px', fontSize: '16px' }}>
                  Description
                </h4>
                <p style={{ color: '#6b7280', margin: 0, fontSize: '14px' }}>
                  {groupDetails.description}
                </p>
              </div>
            )}

            {/* Members */}
            <div style={{ marginBottom: '25px' }}>
              <h4 style={{ color: '#ffffff', margin: '0 0 15px', fontSize: '16px' }}>
                Members ({groupDetails.members?.length || 0})
              </h4>
              <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {groupDetails.members?.map(member => (
                  <div key={member._id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '10px',
                    borderRadius: '6px',
                    marginBottom: '5px',
                    backgroundColor: '#1a1d29'
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
                      ...(member.avatar ? {
                        backgroundImage: `url(${member.avatar})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      } : {
                        backgroundColor: '#4f46e5'
                      })
                    }}>
                      {!member.avatar && member.username[0].toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: '#ffffff', fontWeight: '500' }}>
                        {member.username}
                        {groupDetails.admins?.some(admin => admin._id === member._id) && (
                          <span style={{
                            marginLeft: '8px',
                            padding: '2px 6px',
                            backgroundColor: '#10b981',
                            borderRadius: '4px',
                            fontSize: '10px',
                            fontWeight: 'bold'
                          }}>
                            ADMIN
                          </span>
                        )}
                      </div>
                      <div style={{ color: '#6b7280', fontSize: '12px' }}>
                        {member.status === 'online' ? 'Online' : 'Offline'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Admin Actions */}
            {isAdmin && (
              <div style={{
                borderTop: '1px solid #3a3d4a',
                paddingTop: '20px'
              }}>
                <h4 style={{ color: '#ffffff', margin: '0 0 15px', fontSize: '16px' }}>
                  Admin Actions
                </h4>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => alert('Add member feature coming soon!')}
                    style={{
                      padding: '8px 12px',
                      background: '#4f46e5',
                      border: 'none',
                      borderRadius: '4px',
                      color: 'white',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    Add Member
                  </button>
                  <button
                    onClick={() => setShowEditGroup(true)}
                    style={{
                      padding: '8px 12px',
                      background: '#6b7280',
                      border: 'none',
                      borderRadius: '4px',
                      color: 'white',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    Edit Group
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ textAlign: 'center', color: '#6b7280', padding: '20px' }}>
            Failed to load group details
          </div>
        )}
        
        <EditGroupModal
          group={groupDetails}
          isOpen={showEditGroup}
          onClose={() => setShowEditGroup(false)}
          onGroupUpdated={(updatedGroup) => {
            setGroupDetails(updatedGroup);
            setShowEditGroup(false);
          }}
        />
      </div>
    </div>
  );
};

export default GroupInfoModal;