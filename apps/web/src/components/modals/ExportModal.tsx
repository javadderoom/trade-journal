'use client';

import React, { useState } from 'react';
import { api } from '../../lib/api';
import { notify } from '../../lib/notify';
import './export-modal.scss';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  filteredCount: number;
  totalCount: number;
  activeFilters: {
    accountId: string;
    symbol: string;
    direction: string;
    status: string;
    searchQuery: string;
    dateFilter: string | null;
  };
}

export default function ExportModal({
  isOpen,
  onClose,
  filteredCount,
  totalCount,
  activeFilters,
}: ExportModalProps) {
  const [format, setFormat] = useState<'csv' | 'xlsx' | 'pdf'>('csv');
  const [scope, setScope] = useState<'all' | 'filtered'>('filtered');
  const [isDownloading, setIsDownloading] = useState(false);

  if (!isOpen) return null;

  const handleDownload = async () => {
    try {
      setIsDownloading(true);

      const params = new URLSearchParams();
      params.append('format', format);
      params.append('scope', scope);
      params.append('accountId', activeFilters.accountId);

      if (scope === 'filtered') {
        if (activeFilters.symbol) params.append('symbol', activeFilters.symbol);
        if (activeFilters.direction) params.append('direction', activeFilters.direction);
        if (activeFilters.status) params.append('status', activeFilters.status);
        if (activeFilters.searchQuery) params.append('search', activeFilters.searchQuery);
        if (activeFilters.dateFilter) params.append('dates', activeFilters.dateFilter);
      }

      // We trigger browser download using a token-authenticated link or direct window open
      // Since it's a GET file download, window.open or window.location is standard.
      // To pass JWT, we request a brief download token, or we fetch the file as a Blob using the axios client.
      // Fetching as Blob is safer as it uses the Axios client which handles auth headers and refresh tokens.
      const response = await api.get(`/api/trades/export/export?${params.toString()}`, {
        responseType: 'blob',
      });

      const blob = new Blob([response.data], {
        type: response.headers['content-type'] ? String(response.headers['content-type']) : undefined,
      });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);

      // Extract filename from header or use default
      let filename = `tradekav-trades-${new Date().toISOString().substring(0, 10)}`;
      const disposition = response.headers['content-disposition'];
      if (disposition && disposition.indexOf('attachment') !== -1) {
        const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
        const matches = filenameRegex.exec(disposition);
        if (matches != null && matches[1]) {
          filename = matches[1].replace(/['"]/g, '');
        }
      } else {
        filename += `.${format}`;
      }

      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      notify.success('خروجی داده با موفقیت دریافت شد.');
      onClose();
    } catch (err: any) {
      console.error('Download export failed:', err);
      notify.error('خطا در دریافت فایل خروجی. لطفا مجددا تلاش کنید.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="export-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>خروجی داده‌ها (Export)</h2>
          <button className="close-btn" onClick={onClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="modal-body">
          {/* Format selection */}
          <div className="section-title">فرمت فایل خروجی:</div>
          <div className="format-options-grid">
            <label className={`format-option-card ${format === 'csv' ? 'active' : ''}`}>
              <input
                type="radio"
                name="format"
                value="csv"
                checked={format === 'csv'}
                onChange={() => setFormat('csv')}
              />
              <span className="material-symbols-outlined format-icon">csv</span>
              <span className="format-name">فایل CSV</span>
              <span className="format-desc">مناسب جهت تحلیل در اکسل یا گوگل شیتز</span>
            </label>

            <label className={`format-option-card ${format === 'xlsx' ? 'active' : ''}`}>
              <input
                type="radio"
                name="format"
                value="xlsx"
                checked={format === 'xlsx'}
                onChange={() => setFormat('xlsx')}
              />
              <span className="material-symbols-outlined format-icon">table_chart</span>
              <span className="format-name">فایل Excel (XLSX)</span>
              <span className="format-desc">فایل رنگ‌بندی شده اکسل با ساختار مرتب</span>
            </label>

            <label className={`format-option-card ${format === 'pdf' ? 'active' : ''}`}>
              <input
                type="radio"
                name="format"
                value="pdf"
                checked={format === 'pdf'}
                onChange={() => setFormat('pdf')}
              />
              <span className="material-symbols-outlined format-icon">picture_as_pdf</span>
              <span className="format-name">گزارش PDF</span>
              <span className="format-desc">گزارش خلاصه عملکرد مشابه متاتریدر</span>
            </label>
          </div>

          {/* Scope selection */}
          <div className="scope-selection-section">
            <div className="section-title">محدوده معاملات:</div>
            <div className="scope-options">
              <label className="scope-radio-option">
                <input
                  type="radio"
                  name="scope"
                  value="filtered"
                  checked={scope === 'filtered'}
                  onChange={() => setScope('filtered')}
                />
                <span className="radio-label-text">
                  معاملات فیلتر شده جاری ({filteredCount} معامله)
                </span>
              </label>

              <label className="scope-radio-option">
                <input
                  type="radio"
                  name="scope"
                  value="all"
                  checked={scope === 'all'}
                  onChange={() => setScope('all')}
                />
                <span className="radio-label-text">
                  همه معاملات حساب ({totalCount} معامله)
                </span>
              </label>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button
            className="btn btn-primary btn-download"
            onClick={handleDownload}
            disabled={isDownloading}
          >
            {isDownloading ? (
              <>
                <span className="spinner"></span>
                در حال آماده‌سازی فایل...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined">download</span>
                دریافت خروجی داده
              </>
            )}
          </button>
          <button className="btn btn-secondary" onClick={onClose} disabled={isDownloading}>
            انصراف
          </button>
        </div>
      </div>
    </div>
  );
}
