'use client';

import React, { useState } from 'react';
import { api } from '../../lib/api';

interface ManualTradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newTrade: any) => void;
}

export default function ManualTradeModal({ isOpen, onClose, onSuccess }: ManualTradeModalProps) {
  const [isClosed, setIsClosed] = useState(false);
  const [direction, setDirection] = useState<'BUY' | 'SELL'>('BUY');
  
  // Form states
  const [symbol, setSymbol] = useState('');
  const [lotSize, setLotSize] = useState('0.1');
  const [openPrice, setOpenPrice] = useState('');
  const [openTime, setOpenTime] = useState(() => {
    // Current local time formatted for datetime-local input
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  });
  
  const [stopLoss, setStopLoss] = useState('');
  const [takeProfit, setTakeProfit] = useState('');
  
  const [closePrice, setClosePrice] = useState('');
  const [closeTime, setCloseTime] = useState(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  });
  const [profitUsd, setProfitUsd] = useState('0');
  const [commission, setCommission] = useState('0');
  const [swap, setSwap] = useState('0');
  
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    
    // 1. Validation
    if (!symbol.trim()) {
      setErrorMsg('وارد کردن نماد معامله الزامی است.');
      return;
    }
    if (!openPrice || parseFloat(openPrice) <= 0) {
      setErrorMsg('قیمت ورود باید یک عدد بزرگتر از صفر باشد.');
      return;
    }
    if (!lotSize || parseFloat(lotSize) <= 0) {
      setErrorMsg('حجم معامله (لات) باید بزرگتر از صفر باشد.');
      return;
    }
    if (!openTime) {
      setErrorMsg('زمان ورود به معامله الزامی است.');
      return;
    }
    
    if (isClosed) {
      if (!closePrice || parseFloat(closePrice) <= 0) {
        setErrorMsg('قیمت خروج الزامی و باید بزرگتر از صفر باشد.');
        return;
      }
      if (!closeTime) {
        setErrorMsg('زمان خروج از معامله الزامی است.');
        return;
      }
      if (new Date(closeTime) < new Date(openTime)) {
        setErrorMsg('زمان خروج نمی‌تواند قبل از زمان ورود باشد.');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const payload = {
        symbol: symbol.toUpperCase().trim(),
        direction,
        lotSize: parseFloat(lotSize),
        openPrice: parseFloat(openPrice),
        openTime: new Date(openTime).toISOString(),
        stopLoss: stopLoss ? parseFloat(stopLoss) : null,
        takeProfit: takeProfit ? parseFloat(takeProfit) : null,
        closePrice: isClosed ? parseFloat(closePrice) : null,
        closeTime: isClosed ? new Date(closeTime).toISOString() : null,
        profitUsd: isClosed ? parseFloat(profitUsd) : 0,
        commission: commission ? parseFloat(commission) : 0,
        swap: swap ? parseFloat(swap) : 0,
      };

      const res = await api.post('/api/trades', payload);

      const newTrade = res.data;
      onSuccess(newTrade);
      resetForm();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || err.message || 'خطا در اتصال به سرور');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSymbol('');
    setLotSize('0.1');
    setOpenPrice('');
    setStopLoss('');
    setTakeProfit('');
    setClosePrice('');
    setProfitUsd('0');
    setCommission('0');
    setSwap('0');
    setErrorMsg('');
  };

  return (
    <div className="lightbox-overlay" style={{ display: 'flex' }} onClick={onClose}>
      <div className="manual-trade-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>ثبت معامله دستی جدید</h3>
          <button className="close-btn" onClick={onClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {errorMsg && <div className="form-error-alert">{errorMsg}</div>}

          {/* Top Status & Direction Toggles */}
          <div className="form-toggles">
            <div className="toggle-group">
              <label>وضعیت معامله</label>
              <div className="pill-selector">
                <button
                  type="button"
                  className={!isClosed ? 'active' : ''}
                  onClick={() => setIsClosed(false)}
                >
                  باز (Open)
                </button>
                <button
                  type="button"
                  className={isClosed ? 'active' : ''}
                  onClick={() => setIsClosed(true)}
                >
                  بسته شده (Closed)
                </button>
              </div>
            </div>

            <div className="toggle-group">
              <label>جهت معامله</label>
              <div className="pill-selector direction-selector">
                <button
                  type="button"
                  className={`buy-btn ${direction === 'BUY' ? 'active' : ''}`}
                  onClick={() => setDirection('BUY')}
                >
                  خرید (Buy)
                </button>
                <button
                  type="button"
                  className={`sell-btn ${direction === 'SELL' ? 'active' : ''}`}
                  onClick={() => setDirection('SELL')}
                >
                  فروش (Sell)
                </button>
              </div>
            </div>
          </div>

          {/* Form Columns */}
          <div className="form-columns">
            {/* Left Column: Entry Details */}
            <div className="form-column">
              <h4>مشخصات ورود</h4>

              <div className="form-group">
                <label>نماد (Symbol) *</label>
                <input
                  type="text"
                  placeholder="EURUSD, BTCUSD, ..."
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>حجم معامله (Lots) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.1"
                  value={lotSize}
                  onChange={(e) => setLotSize(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>قیمت ورود *</label>
                <input
                  type="number"
                  step="any"
                  placeholder="1.08500"
                  value={openPrice}
                  onChange={(e) => setOpenPrice(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>زمان ورود *</label>
                <input
                  type="datetime-local"
                  value={openTime}
                  onChange={(e) => setOpenTime(e.target.value)}
                  required
                />
              </div>

              <div className="form-group-row">
                <div className="form-group">
                  <label>حد ضرر (SL)</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="1.08200"
                    value={stopLoss}
                    onChange={(e) => setStopLoss(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>حد سود (TP)</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="1.09000"
                    value={takeProfit}
                    onChange={(e) => setTakeProfit(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Right Column: Close Details (Only enabled if Closed is active) */}
            <div className={`form-column ${!isClosed ? 'disabled-column' : ''}`}>
              <h4>مشخصات خروج و سود</h4>

              <div className="form-group">
                <label>قیمت خروج</label>
                <input
                  type="number"
                  step="any"
                  placeholder="1.08750"
                  value={closePrice}
                  onChange={(e) => setClosePrice(e.target.value)}
                  disabled={!isClosed}
                />
              </div>

              <div className="form-group">
                <label>زمان خروج</label>
                <input
                  type="datetime-local"
                  value={closeTime}
                  onChange={(e) => setCloseTime(e.target.value)}
                  disabled={!isClosed}
                />
              </div>

              <div className="form-group">
                <label>سود/زیان خالص (دلار USD)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="25.00"
                  value={profitUsd}
                  onChange={(e) => setProfitUsd(e.target.value)}
                  disabled={!isClosed}
                />
              </div>

              <div className="form-group-row">
                <div className="form-group">
                  <label>کمیسیون (دلار)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={commission}
                    onChange={(e) => setCommission(e.target.value)}
                    disabled={!isClosed}
                  />
                </div>
                <div className="form-group">
                  <label>سواپ (دلار)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={swap}
                    onChange={(e) => setSwap(e.target.value)}
                    disabled={!isClosed}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
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
              disabled={isSubmitting}
            >
              {isSubmitting ? 'در حال ثبت...' : 'ثبت معامله دستی'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
