'use client';

import React, { useState, useRef } from 'react';
import { api } from '../../lib/api';

interface ImportMT4ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (result: { found: number; imported: number; skipped: number }) => void;
}

export default function ImportMT4Modal({ isOpen, onClose, onSuccess }: ImportMT4ModalProps) {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith('.html') || droppedFile.name.endsWith('.htm')) {
        setFile(droppedFile);
        setErrorMsg('');
      } else {
        setErrorMsg('لطفا فقط فایل گزارش متاتریدر ۴ یا ۵ با پسوند .html یا .htm را انتخاب کنید.');
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.name.endsWith('.html') || selectedFile.name.endsWith('.htm')) {
        setFile(selectedFile);
        setErrorMsg('');
      } else {
        setErrorMsg('لطفا فقط فایل گزارش متاتریدر ۴ یا ۵ با پسوند .html یا .htm را انتخاب کنید.');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setErrorMsg('لطفا ابتدا یک فایل گزارش انتخاب کنید.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', 'dev-user');
    formData.append('accountId', 'dev-account');

    try {
      const res = await api.post('/api/trades/import-mt4', formData);

      const result = res.data;
      onSuccess(result);
      setFile(null);
      onClose();
    } catch (err: any) {
      console.error('Failed to import MT4 statement:', err);
      setErrorMsg(err.response?.data?.error || err.message || 'خطا در ارتباط با سرور. لطفا دوباره تلاش کنید.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="lightbox-overlay" style={{ display: 'flex' }} onClick={onClose}>
      <div className="manual-trade-modal import-mt4-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>واردات معاملات از متاتریدر (MT4 / MT5)</h3>
          <button className="close-btn" onClick={onClose} disabled={isSubmitting}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {errorMsg && <div className="form-error-alert">{errorMsg}</div>}

          <div className="import-description">
            فایل گزارش خروجی معاملات خود را از متاتریدر ۴ یا ۵ (با فرمت <code>.html</code> یا <code>.htm</code>) در کادر زیر رها کرده یا فایل را انتخاب کنید تا به صورت خودکار به ژورنال شما افزوده شود.
          </div>

          <div 
            className={`import-dropzone ${dragActive ? 'drag-active' : ''} ${file ? 'has-file' : ''}`}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
          >
            <input 
              ref={fileInputRef}
              type="file" 
              className="file-upload-input"
              accept=".html,.htm"
              onChange={handleChange}
              style={{ display: 'none' }}
            />

            {!file ? (
              <div className="dropzone-prompt" onClick={onButtonClick}>
                <span className="material-symbols-outlined upload-icon">cloud_upload</span>
                <p className="primary-text">فایل گزارش را به اینجا بکشید یا کلیک کنید</p>
                <p className="secondary-text">فرمت‌های مجاز: HTML, HTM</p>
              </div>
            ) : (
              <div className="dropzone-file-info">
                <span className="material-symbols-outlined file-icon">description</span>
                <div className="file-meta">
                  <p className="file-name">{file.name}</p>
                  <p className="file-size">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
                <button 
                  type="button" 
                  className="remove-file-btn" 
                  onClick={() => setFile(null)}
                  disabled={isSubmitting}
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              انصراف
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!file || isSubmitting}
            >
              {isSubmitting ? 'در حال پردازش...' : 'شروع واردات معاملات'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
