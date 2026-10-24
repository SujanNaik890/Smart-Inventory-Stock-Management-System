import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export const NotificationToast = ({ toast, onClose }) => {
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        onClose();
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [toast, onClose]);

  if (!toast) return null;

  const isSuccess = toast.type === 'success';

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 200,
        background: '#FFFFFF',
        borderRadius: '16px',
        border: `1px solid ${isSuccess ? '#A7F3D0' : '#FECACA'}`,
        boxShadow: '0 12px 36px rgba(16, 26, 70, 0.16)',
        padding: '14px 18px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        maxWidth: '420px',
        animation: 'toastSlideIn 0.25s ease'
      }}
    >
      {isSuccess ? (
        <CheckCircle2 size={22} color="#16B979" style={{ flexShrink: 0 }} />
      ) : (
        <AlertCircle size={22} color="#FF525C" style={{ flexShrink: 0 }} />
      )}

      <div style={{ flex: 1, fontSize: '13.5px' }}>
        <p style={{ fontWeight: '700', color: isSuccess ? '#065F46' : '#991B1B' }}>
          {isSuccess ? 'Success' : 'Notice'}
        </p>
        <p style={{ color: '#4B5563', marginTop: '2px' }}>
          {toast.message}
        </p>
      </div>

      <button
        onClick={onClose}
        style={{ color: '#9CA3AF', padding: '4px' }}
      >
        <X size={16} />
      </button>

      <style>{`
        @keyframes toastSlideIn {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default NotificationToast;
