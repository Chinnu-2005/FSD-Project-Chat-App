const ConfirmDialog = ({ isOpen, title, message, onConfirm, onCancel }) => {
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
        width: '350px',
        border: '1px solid #3a3d4a'
      }}>
        <h3 style={{ color: '#ffffff', margin: '0 0 15px', fontSize: '18px' }}>
          {title}
        </h3>
        <p style={{ color: '#6b7280', margin: '0 0 25px', fontSize: '14px' }}>
          {message}
        </p>
        <div style={{
          display: 'flex',
          gap: '10px',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={onCancel}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer',
              background: '#ef4444',
              color: 'white'
            }}
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;