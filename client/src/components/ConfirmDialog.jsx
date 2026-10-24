import React from 'react';
import { AlertTriangle } from 'lucide-react';
import Modal from './Modal';

export const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to perform this action? This operation may be irreversible.',
  confirmText = 'Delete',
  isDestructive = true,
  isLoading = false
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="460px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: '#FFF1F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FF525C',
              flexShrink: 0
            }}
          >
            <AlertTriangle size={24} />
          </div>
          <div>
            <p style={{ fontSize: '14px', color: '#576282', lineHeight: '1.5' }}>
              {message}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={isDestructive ? 'btn-danger' : 'btn-primary'}
            disabled={isLoading}
            style={{ minWidth: '90px' }}
          >
            {isLoading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
