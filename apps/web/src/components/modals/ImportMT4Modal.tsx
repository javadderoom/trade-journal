'use client';

import React, { useState, useRef, useEffect } from 'react';
import { api } from '../../lib/api';

interface ImportMT4ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (result: { found: number; imported: number; skipped: number }) => void;
  accounts: ImportAccount[];
}

interface ImportAccount {
  id: string;
  name?: string;
  broker?: string;
  broker_name?: string;
  accountNumber?: string | null;
  account_number?: string | null;
  currency?: string | null;
}

type ImportUiState = 'READY' | 'IMPORTING';
type ImportStep = 'FILE' | 'ACCOUNT';

export default function ImportMT4Modal({ isOpen, onClose, onSuccess, accounts }: ImportMT4ModalProps) {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [step, setStep] = useState<ImportStep>('FILE');
  const [importAccountId, setImportAccountId] = useState('');

  const [uiState, setUiState] = useState<ImportUiState>('READY');
  const [progressPct, setProgressPct] = useState(0);
  const [progressLabel, setProgressLabel] = useState('در حال آماده‌سازی...');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Reset modal state when opening/closing.
    if (!isOpen) {
      setStep('FILE');
      setUiState('READY');
      setProgressPct(0);
      setProgressLabel('در حال آماده‌سازی...');
      setIsSubmitting(false);
      setErrorMsg('');
      setDragActive(false);
      // Note: keep file=null to avoid importing old file on next open
      setFile(null);
      setImportAccountId('');
    }
  }, [isOpen]);

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
        setImportAccountId('');
        setErrorMsg('');
        setStep('FILE');
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
        setImportAccountId('');
        setErrorMsg('');
        setStep('FILE');
      } else {
        setErrorMsg('لطفا فقط فایل گزارش متاتریدر ۴ یا ۵ با پسوند .html یا .htm را انتخاب کنید.');
      }
    }
  };

  const bumpProgress = (to: number, label: string) => {
    setProgressLabel(label);
    setProgressPct((prev) => (prev < to ? to : prev));
  };

  const getAccountLabel = (account: ImportAccount) => {
    const brokerName = account.broker_name || account.broker || account.name || 'MT5';
    const accountNumber = account.account_number || account.accountNumber || account.id;
    return `${brokerName} (${accountNumber})`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      setErrorMsg('لطفا ابتدا یک فایل گزارش انتخاب کنید.');
      return;
    }

    if (step === 'FILE') {
      setStep('ACCOUNT');
      setErrorMsg('');
      return;
    }

    if (!importAccountId) {
      setErrorMsg('لطفا ابتدا یک حساب معاملاتی انتخاب کنید.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    setUiState('IMPORTING');
    setProgressPct(8);
    setProgressLabel('در حال آپلود فایل...');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('accountId', importAccountId);

    try {
      // Axios supports onUploadProgress, but we don't know if it's enabled in this env.
      // We still show a responsive progress bar with a best-effort approach.
      const res = await api.post(
        '/api/trades/import-mt4',
        formData,
        {
          onUploadProgress: (evt) => {
            const total = evt.total ?? 0;
            const loaded = evt.loaded ?? 0;
            if (total > 0) {
              const pct = Math.round((loaded / total) * 55); // map upload to 0..55%
              setProgressPct(pct);
              setProgressLabel('در حال آپلود فایل...');
            }
          },
        } as any
      );

      bumpProgress(75, 'در حال پردازش معاملات...');

      const result = res.data;
      setProgressPct(100);
      setProgressLabel('انجام شد ✅');

      onSuccess(result);
      setFile(null);
      setImportAccountId('');
      onClose();
    } catch (err: any) {
      console.error('Failed to import MT4 statement:', err);
      setUiState('READY');
      setProgressPct(0);
      setProgressLabel('در حال آماده‌سازی...');
      setErrorMsg(err.response?.data?.error || err.message || 'خطا در ارتباط با سرور. لطفا دوباره تلاش کنید.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="lightbox-overlay" style={{ display: 'flex' }} onClick={() => !isSubmitting && onClose()}>
      <div className="manual-trade-modal import-mt4-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>واردات معاملات از متاتریدر (MT4 / MT5)</h3>
          <button className="close-btn" onClick={onClose} disabled={isSubmitting}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Progress bar under header */}
        {uiState === 'IMPORTING' && (
          <div className="import-progress-wrap" style={{ padding: '0 16px 8px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ color: '#61f9b1', fontSize: 13 }}>{progressLabel}</span>
              <span style={{ color: '#cbd5e1', fontSize: 12 }}>{progressPct}%</span>
            </div>
            <div
              style={{
                width: '100%',
                height: 8,
                background: 'rgba(255,255,255,0.10)',
                borderRadius: 999,
                overflow: 'hidden',
                marginTop: 6,
              }}
            >
              <div
                style={{
                  width: `${Math.min(100, Math.max(0, progressPct))}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #61f9b1, #22c55e)',
                  transition: 'width 220ms ease',
                }}
              />
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="import-steps" aria-label="مراحل واردات">
            <div className={`import-step ${step === 'FILE' ? 'active' : ''} ${file ? 'complete' : ''}`}>
              <span>1</span>
              <p>انتخاب فایل</p>
            </div>
            <div className={`import-step ${step === 'ACCOUNT' ? 'active' : ''} ${importAccountId ? 'complete' : ''}`}>
              <span>2</span>
              <p>انتخاب حساب</p>
            </div>
          </div>

          {errorMsg && <div className="form-error-alert">{errorMsg}</div>}

          {step === 'FILE' ? (
            <>
              <div className="import-description">
                فایل گزارش خروجی معاملات خود را از متاتریدر ۴ یا ۵ (با فرمت <code>.html</code> یا <code>.htm</code>) در کادر زیر رها کرده یا فایل را انتخاب کنید.
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
                      onClick={() => {
                        setFile(null);
                        setImportAccountId('');
                      }}
                      disabled={isSubmitting}
                    >
                      <span className="material-symbols-outlined">close</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="import-account-step">
              <div className="import-description">
                حساب معاملاتی مربوط به این فایل را انتخاب کنید تا معاملات در همان حساب ثبت شوند.
              </div>

              {accounts.length > 0 ? (
                <div className="import-account-list">
                  {accounts.map((account) => (
                    <button
                      key={account.id}
                      type="button"
                      className={`import-account-option ${importAccountId === account.id ? 'selected' : ''}`}
                      onClick={() => {
                        setImportAccountId(account.id);
                        setErrorMsg('');
                      }}
                      disabled={isSubmitting}
                    >
                      <span className="material-symbols-outlined">account_balance_wallet</span>
                      <span className="account-option-main">
                        <span className="account-option-title">{getAccountLabel(account)}</span>
                        {account.currency && <span className="account-option-subtitle">{account.currency}</span>}
                      </span>
                      {importAccountId === account.id && (
                        <span className="material-symbols-outlined selected-icon">check_circle</span>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="form-error-alert">هیچ حساب معاملاتی برای انتخاب پیدا نشد.</div>
              )}
            </div>
          )}

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                if (step === 'ACCOUNT' && !isSubmitting) {
                  setStep('FILE');
                  setErrorMsg('');
                  return;
                }
                onClose();
              }}
              disabled={isSubmitting}
            >
              {step === 'ACCOUNT' ? 'بازگشت' : 'انصراف'}
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!file || isSubmitting || (step === 'ACCOUNT' && (!importAccountId || accounts.length === 0))}
            >
              {isSubmitting ? 'در حال پردازش...' : step === 'FILE' ? 'مرحله بعد' : 'شروع واردات معاملات'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
