'use client';

import React from 'react';
import './trades.scss';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  type?: 'info' | 'confirm' | 'error' | 'success';
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  onClose: () => void;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  type = 'info',
  confirmLabel = 'تایید',
  cancelLabel = 'انصراف',
  onConfirm,
  onCancel,
  onClose,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    onClose();
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
    onClose();
  };

  const getIcon = () => {
    switch (type) {
      case 'confirm':
        return <span className="material-symbols-outlined icon-confirm">help</span>;
      case 'error':
        return <span className="material-symbols-outlined icon-error">error</span>;
      case 'success':
        return <span className="material-symbols-outlined icon-success">check_circle</span>;
      case 'info':
      default:
        return <span className="material-symbols-outlined icon-info">info</span>;
    }
  };

  return (
    <div className="lightbox-overlay confirm-overlay animate-fade-in" style={{ display: 'flex', zIndex: 3000 }} onClick={handleCancel}>
      <div 
        className={`confirm-modal-card ${type}-card animate-scale-up`} 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header-section">
          {getIcon()}
          <h3>{title}</h3>
        </div>
        
        <div className="modal-body-section">
          <p>{message}</p>
        </div>
        
        <div className="modal-footer-section">
          {type === 'confirm' && (
            <button className="btn btn-secondary" onClick={handleCancel}>
              {cancelLabel}
            </button>
          )}
          <button 
            className={`btn ${type === 'confirm' || type === 'error' ? 'btn-danger' : 'btn-primary'}`} 
            onClick={handleConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
