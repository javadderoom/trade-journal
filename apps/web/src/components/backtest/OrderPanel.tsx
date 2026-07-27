'use client';

import React, { useState } from 'react';
import { useTranslation } from '../../store/useAppStore';
import { PositionState } from './BacktestChart';
import { calcPnL, getAssetClass } from './utils/pnl';

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
  symbol?: string;
  currentPrice: number;
  balance: number;
  positions: PositionState[];
  tradeHistory: ExecutedTrade[];
  isLoading?: boolean;
  onOpenPosition: (type: 'BUY' | 'SELL', lotSize: number, sl: number | null, tp: number | null) => void;
  onClosePosition: (positionId: string, reason?: string) => void;
  onUpdateSLTP?: (positionId: string, sl: number | null, tp: number | null) => void;
}

export default function OrderPanel({
  symbol = 'XAUUSD',
  currentPrice,
  balance,
  positions,
  tradeHistory,
  isLoading = false,
  onOpenPosition,
  onClosePosition,
  onUpdateSLTP,
}: OrderPanelProps) {
  const { language } = useTranslation();
  const isEn = language === 'en';

  const [lotSize, setLotSize] = useState<number>(0.1);
  const [stopLoss, setStopLoss] = useState<string>('');
  const [takeProfit, setTakeProfit] = useState<string>('');

  // Which position is selected for editing SL/TP
  const [selectedPosId, setSelectedPosId] = useState<string | null>(null);
  const selectedPos = positions.find((p) => p.id === selectedPosId) ?? positions[positions.length - 1] ?? null;

  // Sync inputs when selected position changes
  React.useEffect(() => {
    if (selectedPos) {
      setStopLoss(selectedPos.stopLoss !== null ? selectedPos.stopLoss.toString() : '');
      setTakeProfit(selectedPos.takeProfit !== null ? selectedPos.takeProfit.toString() : '');
    } else {
      setStopLoss('');
      setTakeProfit('');
    }
  }, [selectedPos?.id, selectedPos?.stopLoss, selectedPos?.takeProfit]);

  const handleApplySLTP = () => {
    if (!onUpdateSLTP || !selectedPos) return;
    const slVal = stopLoss ? parseFloat(stopLoss) : null;
    const tpVal = takeProfit ? parseFloat(takeProfit) : null;
    onUpdateSLTP(selectedPos.id, slVal, tpVal);
  };

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

  return (
    <div className="order-panel-container">
      {isLoading && (
        <div className="panel-section loading-skeleton">
          <div className="skeleton-line" style={{ width: '60%', height: 14 }} />
          <div className="skeleton-line" style={{ width: '80%', height: 28, marginTop: 8 }} />
          <div className="skeleton-line" style={{ width: '100%', height: 14, marginTop: 12 }} />
          <div className="skeleton-line" style={{ width: '100%', height: 14, marginTop: 6 }} />
        </div>
      )}
      {!isLoading && (
      <>
      {/* 1. Account & Balance Summary */}
      <div className="panel-section balance-card">
        <span className="section-title">{isEn ? 'Account Equity' : 'موجودی حساب'}</span>
        <div className="balance-value">${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
      </div>

      {/* 2. SL/TP Input Row — always visible */}
      <div className="panel-section sltp-section">
        <span className="section-title">{isEn ? 'Risk Management' : 'مدیریت ریسک'}</span>
        <div className="form-row split">
          <div>
            <label>{isEn ? 'Stop Loss' : 'حد ضرر'}</label>
            <input
              type="number"
              step="any"
              placeholder={currentPrice ? (currentPrice * 0.99).toFixed(2) : '—'}
              value={stopLoss}
              onChange={(e) => setStopLoss(e.target.value)}
              className="panel-input sl-input"
            />
          </div>
          <div>
            <label>{isEn ? 'Take Profit' : 'حد سود'}</label>
            <input
              type="number"
              step="any"
              placeholder={currentPrice ? (currentPrice * 1.02).toFixed(2) : '—'}
              value={takeProfit}
              onChange={(e) => setTakeProfit(e.target.value)}
              className="panel-input tp-input"
            />
          </div>
        </div>

        {/* Quick SL/TP Presets */}
        <div className="preset-buttons">
          <button type="button" className="preset-btn" onClick={() => { if (currentPrice) setStopLoss((currentPrice * 0.995).toFixed(2)); }}>
            {isEn ? 'SL 0.5%' : 'ضرربانی ۰.۵٪'}
          </button>
          <button type="button" className="preset-btn" onClick={() => { if (currentPrice) setStopLoss((currentPrice * 0.99).toFixed(2)); }}>
            {isEn ? 'SL 1%' : 'ضرربانی ۱٪'}
          </button>
          <button type="button" className="preset-btn" onClick={() => { if (currentPrice) setTakeProfit((currentPrice * 1.01).toFixed(2)); }}>
            {isEn ? 'TP 1%' : 'سودبانی ۱٪'}
          </button>
          <button type="button" className="preset-btn" onClick={() => { if (currentPrice) setTakeProfit((currentPrice * 1.02).toFixed(2)); }}>
            {isEn ? 'TP 2%' : 'سودبانی ۲٪'}
          </button>
        </div>

        {/* Apply button when a position is selected */}
        {selectedPos && onUpdateSLTP && (
          <button type="button" className="apply-sltp-btn" onClick={handleApplySLTP}>
            <span className="material-symbols-outlined">check</span>
            {isEn ? 'Apply SL/TP' : 'اعمال SL/TP'}
          </button>
        )}
      </div>

      {/* 3. Order Form — only when no positions open */}
      {positions.length === 0 && (
        <div className="panel-section order-form">
          <div className="form-row">
            <label>{isEn ? 'Lot Size' : 'حجم معامله (لات)'}</label>
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
          <div className="action-buttons-row">
            <button type="button" className="action-btn buy-btn" onClick={handleBuy}>
              <span className="material-symbols-outlined">north_east</span>
              <span>{isEn ? 'BUY' : 'خرید'}</span>
            </button>
            <button type="button" className="action-btn sell-btn" onClick={handleSell}>
              <span className="material-symbols-outlined">south_east</span>
              <span>{isEn ? 'SELL' : 'فروش'}</span>
            </button>
          </div>
        </div>
      )}

      {/* 4. Open Positions */}
      {positions.length > 0 && (
        <div className="panel-section positions-section">
          <span className="section-title">{isEn ? 'Open Positions' : 'پوزیشن‌های باز'} ({positions.length})</span>
          {positions.map((pos) => {
            const asset = getAssetClass(symbol);
            const { pnlUsd: pnl } = calcPnL(asset, pos.type, pos.entryPrice, currentPrice, pos.lotSize);
            const isSelected = selectedPosId === pos.id || (!selectedPosId && pos.id === positions[positions.length - 1]?.id);

            return (
              <div
                key={pos.id}
                className={`active-position-card ${isSelected ? 'selected' : ''}`}
                onClick={() => setSelectedPosId(pos.id)}
              >
                <div className="pos-badge-header">
                  <span className={`pos-badge ${pos.type}`}>
                    {pos.type} @ {pos.entryPrice.toFixed(2)}
                  </span>
                  <span className="pos-lots">{pos.lotSize} {isEn ? 'Lots' : 'لات'}</span>
                </div>

                {/* Running PnL */}
                {currentPrice > 0 && (
                  <div className={`running-pnl ${pnl >= 0 ? 'positive' : 'negative'}`}>
                    {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
                  </div>
                )}

                {/* SL/TP info */}
                <div className="pos-sltp-info">
                  <span className="sl-info">{isEn ? 'SL:' : 'حد ضرر:'} {pos.stopLoss !== null ? pos.stopLoss.toFixed(2) : '—'}</span>
                  <span className="tp-info">{isEn ? 'TP:' : 'حد سود:'} {pos.takeProfit !== null ? pos.takeProfit.toFixed(2) : '—'}</span>
                </div>

                <button
                  type="button"
                  className="close-pos-btn"
                  onClick={(e) => { e.stopPropagation(); onClosePosition(pos.id, 'MANUAL'); }}
                >
                  <span className="material-symbols-outlined">close</span>
                  {isEn ? 'Close' : 'بستن'}
                </button>
              </div>
            );
          })}

          {/* Quick open another trade */}
          <div className="quick-trade-row">
            <button type="button" className="action-btn buy-btn" onClick={handleBuy}>
              <span className="material-symbols-outlined">north_east</span>
              <span>{isEn ? 'BUY' : 'خرید'}</span>
            </button>
            <button type="button" className="action-btn sell-btn" onClick={handleSell}>
              <span className="material-symbols-outlined">south_east</span>
              <span>{isEn ? 'SELL' : 'فروش'}</span>
            </button>
          </div>
        </div>
      )}

      {/* 5. Trade History Table */}
      <div className="panel-section history-section">
        <span className="section-title">{isEn ? 'Trade Log' : 'تاریخچه معاملات'} ({tradeHistory.length})</span>
        <div className="history-list">
          {tradeHistory.length === 0 ? (
            <div className="empty-history">{isEn ? 'No trades yet' : 'هنوز معامله‌ای ثبت نشده'}</div>
          ) : (
            tradeHistory.map((t) => (
              <div key={t.id} className={`history-item ${t.pnlUsd >= 0 ? 'win' : 'loss'}`}>
                <div className="item-col col-type">
                  <span className={`dir-tag ${t.type}`}>{t.type}</span>
                  <span className="item-price">{t.entryPrice} → {t.exitPrice}</span>
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
      </>
      )}
    </div>
  );
}
