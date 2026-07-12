'use client';

import React, { useState } from 'react';
import { api } from '../../lib/api';
import { notify } from '../../lib/notify';
import { useTranslation } from '../../store/useAppStore';
import { getSharedTranslations } from '../../locales/components';
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
  const { t, language } = useTranslation();
  const isEn = language === 'en';

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

      const response = await api.get(`/api/trades/export/export?${params.toString()}`, {
        responseType: 'blob',
      });

      const blob = new Blob([response.data], {
        type: response.headers['content-type'] ? String(response.headers['content-type']) : undefined,
      });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);

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

      notify.success(isEn ? 'Export downloaded successfully.' : 'خروجی داده با موفقیت دریافت شد.');
      onClose();
    } catch (err: any) {
      console.error('Download export failed:', err);
      notify.error(isEn ? 'Error downloading export file. Please try again.' : 'خطا در دریافت فایل خروجی. لطفا مجددا تلاش کنید.');
    } finally {
      setIsDownloading(false);
    }
  };

  const p = {
    ...getSharedTranslations(isEn),
    title: isEn ? 'Export Data' : 'خروجی داده‌ها (Export)',
    formatTitle: isEn ? 'Output File Format:' : 'فرمت فایل خروجی:',
    csvName: isEn ? 'CSV File' : 'فایل CSV',
    csvDesc: isEn ? 'Best for analysis in Excel or Google Sheets' : 'مناسب جهت تحلیل در اکسل یا گوگل شیتز',
    xlsxName: isEn ? 'Excel File (XLSX)' : 'فایل Excel (XLSX)',
    xlsxDesc: isEn ? 'Styled Excel file with structured format' : 'فایل رنگ‌بندی شده اکسل با ساختار مرتب',
    pdfName: isEn ? 'PDF Report' : 'گزارش PDF',
    pdfDesc: isEn ? 'Summary performance report' : 'گزارش خلاصه عملکرد مشابه متاتریدر',
    scopeTitle: isEn ? 'Trades Scope:' : 'محدوده معاملات:',
    scopeFiltered: isEn ? `Current filtered trades (${filteredCount} trades)` : `معاملات فیلتر شده جاری (${filteredCount} معامله)`,
    scopeAll: isEn ? `All account trades (${totalCount} trades)` : `همه معاملات حساب (${totalCount} معامله)`,
    preparing: isEn ? 'Preparing file...' : 'در حال آماده‌سازی فایل...',
    downloadLabel: isEn ? 'Download Export' : 'دریافت خروجی داده',
  };

  return (
    <div className="lightbox-overlay" style={{ display: 'flex' }} onClick={onClose}>
      <div className="manual-trade-modal export-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{p.title}</h3>
          <button className="close-btn" onClick={onClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="modal-form">
          <div className="modal-body">
            {/* Format selection */}
            <div className="section-title">{p.formatTitle}</div>
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
                <span className="format-name">{p.csvName}</span>
                <span className="format-desc">{p.csvDesc}</span>
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
                <span className="format-name">{p.xlsxName}</span>
                <span className="format-desc">{p.xlsxDesc}</span>
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
                <span className="format-name">{p.pdfName}</span>
                <span className="format-desc">{p.pdfDesc}</span>
              </label>
            </div>

            {/* Scope selection */}
            <div className="scope-selection-section">
              <div className="section-title">{p.scopeTitle}</div>
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
                    {p.scopeFiltered}
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
                    {p.scopeAll}
                  </span>
                </label>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button 
              type="button"
              className="btn btn-secondary" 
              onClick={onClose} 
              disabled={isDownloading}
            >
              {p.cancel}
            </button>
            <button
              type="button"
              className="btn btn-primary btn-download"
              onClick={handleDownload}
              disabled={isDownloading}
            >
              {isDownloading ? (
                <>
                  <span className="spinner"></span>
                  {p.preparing}
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">download</span>
                  {p.downloadLabel}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
