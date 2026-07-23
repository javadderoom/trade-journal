'use client';

import React, { useState, useRef, useEffect } from 'react';
import { api } from '../../lib/api';
import { useTranslation } from '../../store/useAppStore';
import { getSharedTranslations } from '../../locales/components';
import LoadingButton from '../ui/LoadingButton';

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
  const { t, language } = useTranslation();
  const isEn = language === 'en';

  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [step, setStep] = useState<ImportStep>('FILE');
  const [importAccountId, setImportAccountId] = useState('');

  const [uiState, setUiState] = useState<ImportUiState>('READY');
  const [progressPct, setProgressPct] = useState(0);
  const [progressLabel, setProgressLabel] = useState(isEn ? 'Preparing...' : 'در حال آماده‌سازی...');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setStep('FILE');
      setUiState('READY');
      setProgressPct(0);
      setProgressLabel(isEn ? 'Preparing...' : 'در حال آماده‌سازی...');
      setIsSubmitting(false);
      setErrorMsg('');
      setDragActive(false);
      setFile(null);
      setImportAccountId('');
    }
  }, [isOpen, isEn]);

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
        setErrorMsg(isEn ? 'Please select a MetaTrader 4/5 HTML report file (.html or .htm).' : 'لطفا فقط فایل گزارش متاتریدر ۴ یا ۵ با پسوند .html یا .htm را انتخاب کنید.');
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
        setErrorMsg(isEn ? 'Please select a MetaTrader 4/5 HTML report file (.html or .htm).' : 'لطفا فقط فایل گزارش متاتریدر ۴ یا ۵ با پسوند .html یا .htm را انتخاب کنید.');
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
      setErrorMsg(isEn ? 'Please select a file first.' : 'لطفا ابتدا یک فایل گزارش انتخاب کنید.');
      return;
    }

    if (step === 'FILE') {
      setStep('ACCOUNT');
      setErrorMsg('');
      return;
    }

    if (!importAccountId) {
      setErrorMsg(isEn ? 'Please select an account first.' : 'لطفا ابتدا یک حساب معاملاتی انتخاب کنید.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    setUiState('IMPORTING');
    setProgressPct(8);
    setProgressLabel(isEn ? 'Uploading file...' : 'در حال آپلود فایل...');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('accountId', importAccountId);

    try {
      const res = await api.post(
        '/api/trades/import-mt4',
        formData,
        {
          onUploadProgress: (evt) => {
            const total = evt.total ?? 0;
            const loaded = evt.loaded ?? 0;
            if (total > 0) {
              const pct = Math.round((loaded / total) * 55);
              setProgressPct(pct);
              setProgressLabel(isEn ? 'Uploading file...' : 'در حال آپلود فایل...');
            }
          },
        } as any
      );

      bumpProgress(75, isEn ? 'Processing trades...' : 'در حال پردازش معاملات...');

      const result = res.data;
      setProgressPct(100);
      setProgressLabel(isEn ? 'Done ✅' : 'انجام شد ✅');

      onSuccess(result);
      setFile(null);
      setImportAccountId('');
      onClose();
    } catch (err: any) {
      console.error('Failed to import MT4 statement:', err);
      setUiState('READY');
      setProgressPct(0);
      setProgressLabel(isEn ? 'Preparing...' : 'در حال آماده‌سازی...');
      setErrorMsg(err.response?.data?.error || err.message || (isEn ? 'Server connection error. Please try again.' : 'خطا در ارتباط با سرور. لطفا دوباره تلاش کنید.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  const p = {
    ...getSharedTranslations(isEn),
    title: isEn ? 'Import MetaTrader Trades' : 'واردات معاملات از متاتریدر (MT4 / MT5)',
    step1: isEn ? 'Select File' : 'انتخاب فایل',
    step2: isEn ? 'Select Account' : 'انتخاب حساب',
    fileDesc: isEn ? 'Drag and drop your HTML statement file here or click to browse.' : 'فایل گزارش خروجی معاملات خود را از متاتریدر ۴ یا ۵ (با فرمت .html یا .htm) در کادر زیر رها کرده یا فایل را انتخاب کنید.',
    promptText: isEn ? 'Drag report file here or click to browse' : 'فایل گزارش را به اینجا بکشید یا کلیک کنید',
    allowedFormats: isEn ? 'Allowed formats: HTML, HTM' : 'فرمت‌های مجاز: HTML, HTM',
    accountDesc: isEn ? 'Select the trading account associated with this file to import trades to.' : 'حساب معاملاتی مربوط به این فایل را انتخاب کنید تا معاملات در همان حساب ثبت شوند.',
    noAccountError: isEn ? 'No trading accounts found.' : 'هیچ حساب معاملاتی برای انتخاب پیدا نشد.',
    back: isEn ? 'Back' : 'بازگشت',
    next: isEn ? 'Next Step' : 'مرحله بعد',
    import: isEn ? 'Start Import' : 'شروع واردات معاملات',
    processing: isEn ? 'Processing...' : 'در حال پردازش...',
  };

  return (
    <div className="lightbox-overlay" style={{ display: 'flex' }} onClick={() => !isSubmitting && onClose()}>
      <div className="manual-trade-modal import-mt4-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{p.title}</h3>
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
          <div className="import-steps" aria-label="mراحل واردات">
            <div className={`import-step ${step === 'FILE' ? 'active' : ''} ${file ? 'complete' : ''}`}>
              <span>1</span>
              <p>{p.step1}</p>
            </div>
            <div className={`import-step ${step === 'ACCOUNT' ? 'active' : ''} ${importAccountId ? 'complete' : ''}`}>
              <span>2</span>
              <p>{p.step2}</p>
            </div>
          </div>

          {errorMsg && <div className="form-error-alert" role="alert" aria-live="assertive">{errorMsg}</div>}

          {step === 'FILE' ? (
            <>
              <div className="import-description">
                {p.fileDesc}
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
                    <p className="primary-text">{p.promptText}</p>
                    <p className="secondary-text">{p.allowedFormats}</p>
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
                {p.accountDesc}
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
                <div className="form-error-alert" role="alert">{p.noAccountError}</div>
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
              {step === 'ACCOUNT' ? p.back : p.cancel}
            </button>

            <LoadingButton
              type="submit"
              variant="primary"
              disabled={!file || isSubmitting || (step === 'ACCOUNT' && (!importAccountId || accounts.length === 0))}
              isLoading={isSubmitting}
            >
              {step === 'FILE' ? p.next : p.import}
            </LoadingButton>
          </div>
        </form>
      </div>
    </div>
  );
}
