'use client';

import React, { useRef } from 'react';
import Select from '../../ui/Select';
import LoadingButton from '../../ui/LoadingButton';
import { Timeframe } from '../../../services/marketData';
import { parseCSVHistory } from '../../../services/marketData';
import { notify } from '../../../lib/notify';
import { useTranslation } from '../../../store/useAppStore';

interface BacktestHeaderProps {
  symbol: string;
  timeframe: Timeframe;
  onSymbolChange: (sym: string) => void;
  onTimeframeChange: (tf: Timeframe) => void;
  onSaveSession: () => void;
  onCSVImport: (candles: any[]) => void;
}

const SYMBOL_OPTIONS = [
  { value: 'XAUUSD', label: 'Gold / XAUUSD' },
  { value: 'EURUSD', label: 'EUR / USD' },
  { value: 'GBPUSD', label: 'GBP / USD' },
  { value: 'USDJPY', label: 'USD / JPY' },
  { value: 'BTCUSD', label: 'Bitcoin / BTCUSD' },
  { value: 'ETHUSD', label: 'Ethereum / ETHUSD' },
];

const TIMEFRAME_OPTIONS: { value: Timeframe; label: string }[] = [
  { value: '1m', label: '1 Min (1m)' },
  { value: '5m', label: '5 Min (5m)' },
  { value: '15m', label: '15 Min (15m)' },
  { value: '1h', label: '1 Hour (1h)' },
  { value: '4h', label: '4 Hours (4h)' },
  { value: '1d', label: 'Daily (1d)' },
];

export default function BacktestHeader({
  symbol,
  timeframe,
  onSymbolChange,
  onTimeframeChange,
  onSaveSession,
  onCSVImport,
}: BacktestHeaderProps) {
  const { language } = useTranslation();
  const isEn = language === 'en';
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        const parsedCandles = parseCSVHistory(text);
        if (parsedCandles.length > 0) {
          onCSVImport(parsedCandles);
          notify.success(
            isEn
              ? `Loaded ${parsedCandles.length} custom candles from CSV!`
              : `${parsedCandles.length} کندل سفارشی از فایل CSV بارگذاری شد!`
          );
        } else {
          notify.error(isEn ? 'Could not parse CSV candle format' : 'فرمت فایل CSV معتبر نیست');
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="backtest-header">
      <div className="header-title-wrap">
        <h1>{isEn ? 'Backtest' : 'بک‌تست'}</h1>
      </div>

      <div className="header-controls">
        {/* Symbol Selector */}
        <div className="selector-group">
          <label>{isEn ? 'Symbol:' : 'نماد:'}</label>
          <Select
            value={symbol}
            onChange={(val) => onSymbolChange(val)}
            options={SYMBOL_OPTIONS}
          />
        </div>

        {/* Timeframe Pill Buttons */}
        <div className="selector-group">
          <label>{isEn ? 'Timeframe:' : 'تایم‌فریم:'}</label>
          <div className="tf-pills">
            {TIMEFRAME_OPTIONS.map((tf) => (
              <button
                key={tf.value}
                type="button"
                className={`tf-pill ${timeframe === tf.value ? 'active' : ''}`}
                onClick={() => onTimeframeChange(tf.value)}
              >
                {tf.value}
              </button>
            ))}
          </div>
        </div>

        {/* Custom CSV Upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.txt"
          style={{ display: 'none' }}
          onChange={handleFileUpload}
        />
        <button
          type="button"
          className="import-csv-btn"
          onClick={() => fileInputRef.current?.click()}
          title={isEn ? 'Upload MT4/MT5 CSV History' : 'بارگذاری فایل تاریخچه CSV'}
        >
          <span className="material-symbols-outlined">upload_file</span>
          <span>{isEn ? 'Import CSV' : 'ورود CSV'}</span>
        </button>

        {/* Save Session Report Button */}
        <LoadingButton
          onClick={onSaveSession}
          className="save-session-btn"
          variant="ghost"
          size="sm"
          successText={isEn ? 'Saved!' : 'ذخیره شد'}
        >
          <span className="material-symbols-outlined">cloud_upload</span>
          <span>{isEn ? 'Save' : 'ذخیره'}</span>
        </LoadingButton>
      </div>
    </div>
  );
}
