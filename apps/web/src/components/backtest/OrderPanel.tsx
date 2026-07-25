'use client';

import React, { useState } from 'react';
import { useTranslation } from '../../store/useAppStore';
import { PositionState } from './BacktestChart';

export interface ExecutedTrade {
  id: string;
  type: 'BUY' | 'SELL';
  entryPrice: number;
  exitPrice: number;
  stopLoss: number | null;
  takeProfit: number | null;
  lotSize: number;
  pnlUsd: number;
  pips: number;
  rMultiple: number;
  result: 'WIN' | 'LOSS' | 'BREAKEVEN';
  openTime: number;
  closeTime: number;
}

interface OrderPanelProps {
  currentPrice: number;
  balance: number;
  activePosition: PositionState | null;
  tradeHistory: ExecutedTrade[];
  onOpenPosition: (type: 'BUY' | 'SELL', lotSize: number, sl: number | null, tp: number | null) => void;
  onClosePosition: (reason?: string) => void;
}

export default function OrderPanel({
  currentPrice,
  balance,
  activePosition,
  tradeHistory,
  onOpenPosition,
  onClosePosition,
}: OrderPanelProps) {
  const { language } = useTranslation();
  const isEn = language === 'en';

  const [lotSize, setLotSize] = useState<number>(0.1);
  const [stopLoss, setStopLoss] = useState<string>('');
  const [takeProfit, setTakeProfit] = useState<string>('');

  const handleBuy = () => {
    const slVal = stopLoss ? parseFloat(stopLoss) : null;
    const tpVal = takeProfit ? parseFloat(takeProfit) : null;
    onOpenPosition('BUY', lotSize, slVal, tpVal);
  };

  const handleSell = () => {
    const slVal = stopLoss ? parseFloat(stopLoss) : null;
    const tpVal = takeProfit ? parseFloat(takeProfit) : null;
    onOpenPosition('SELL', lotSize, slVal, tpVal);
  };

  // Quick SL/TP helper presets (e.g. +20 pips, -10 pips)
  const setPresetPips = (slPips: number, tpPips: number) => {
    if (!currentPrice) return;
    const pipScale = currentPrice > 500 ? 1 : 0.0001; // Scale for Gold/Crypto vs Forex
    setStopLoss((currentPrice - slPips * pipScale).toFixed(2));
    setTakeProfit((currentPrice + tpPips * pipScale).toFixed(2));
  };

  return (
    <div className="order-panel-container">
      {/* 1. Account & Balance Summary */}
      <div className="panel-section balance-card">
        <span className="section-title">{isEn ? 'Account Equity' : 'موجودی حساب'}</span>
        <div className="balance-value">${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
      </div>

      {/* 2. Order Form */}
      <div className="panel-section order-form">
        <div className="form-row">
          <label>{isEn ? 'Lot Size / Position' : 'حجم معامله (لات)'}</label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            max="100"
            value={lotSize}
            onChange={(e) => setLotSize(parseFloat(e.target.value) || 0.01)}
            className="panel-input"
          />
        </div>

        <div className="form-row split">
          <div>
            <label>{isEn ? 'Stop Loss (SL)' : 'حد ضرر (SL)'}</label>
            <input
              type="number"
              step="any"
              placeholder={currentPrice ? (currentPrice * 0.99).toFixed(2) : '0.00'}
              value={stopLoss}
              onChange={(e) => setStopLoss(e.target.value)}
              className="panel-input sl-input"
            />
          </div>
          <div>
            <label>{isEn ? 'Take Profit (TP)' : 'حد سود (TP)'}</label>
            <input
              type="number"
              step="any"
              placeholder={currentPrice ? (currentPrice * 1.02).toFixed(2) : '0.00'}
              value={takeProfit}
              onChange={(e) => setTakeProfit(e.target.value)}
              className="panel-input tp-input"
            />
          </div>
        </div>

        {/* Preset R:R Helpers */}
        <div className="preset-buttons">
          <button type="button" className="preset-btn" onClick={() => setPresetPips(15, 30)}>1:2 R:R</button>
          <button type="button" className="preset-btn" onClick={() => setPresetPips(20, 60)}>1:3 R:R</button>
          <button type="button" className="preset-btn" onClick={() => setStopLoss('')}>{isEn ? 'Clear SL/TP' : 'حذف SL/TP'}</button>
        </div>

        {/* Active Position vs Buy/Sell Actions */}
        {activePosition ? (
          <div className="active-position-card">
            <div className="pos-badge-header">
              <span className={`pos-badge ${activePosition.type}`}>
                {activePosition.type} @ ${activePosition.entryPrice}
              </span>
              <span className="pos-lots">{activePosition.lotSize} Lots</span>
            </div>
            <button
              type="button"
              className="close-pos-btn"
              onClick={() => onClosePosition('MANUAL')}
            >
              <span className="material-symbols-outlined">close</span>
              {isEn ? 'Close Position Now' : 'بستن معامله در قیمت فعلی'}
            </button>
          </div>
        ) : (
          <div className="action-buttons-row">
            <button type="button" className="action-btn buy-btn" onClick={handleBuy}>
              <span className="material-symbols-outlined">north_east</span>
              <span>{isEn ? 'BUY' : 'خرید (BUY)'}</span>
            </button>
            <button type="button" className="action-btn sell-btn" onClick={handleSell}>
              <span className="material-symbols-outlined">south_east</span>
              <span>{isEn ? 'SELL' : 'فروش (SELL)'}</span>
            </button>
          </div>
        )}
      </div>

      {/* 3. Trade History Table */}
      <div className="panel-section history-section">
        <span className="section-title">{isEn ? 'Trade Logs' : 'تاریخچه معاملات ریپلی'} ({tradeHistory.length})</span>
        <div className="history-list">
          {tradeHistory.length === 0 ? (
            <div className="empty-history">{isEn ? 'No trades executed yet' : 'هنوز معامله‌ای ثبت نشده است'}</div>
          ) : (
            tradeHistory.map((t) => (
              <div key={t.id} className={`history-item ${t.pnlUsd >= 0 ? 'win' : 'loss'}`}>
                <div className="item-col col-type">
                  <span className={`dir-tag ${t.type}`}>{t.type}</span>
                  <span className="item-price">{t.entryPrice} ➔ {t.exitPrice}</span>
                </div>
                <div className="item-col col-pnl">
                  <span className={`pnl-val ${t.pnlUsd >= 0 ? 'positive' : 'negative'}`}>
                    {t.pnlUsd >= 0 ? '+' : ''}${t.pnlUsd.toFixed(2)}
                  </span>
                  <span className="r-val">{t.rMultiple >= 0 ? '+' : ''}{t.rMultiple.toFixed(1)}R</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
