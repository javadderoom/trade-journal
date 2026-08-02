'use client';

import React, { useState, useMemo } from 'react';
import Select from '../ui/Select';

const ACCOUNT_CURRENCIES = [
  { value: 'USD', label: 'USD' },
  { value: 'EUR', label: 'EUR' },
  { value: 'GBP', label: 'GBP' },
  { value: 'JPY', label: 'JPY' },
  { value: 'CAD', label: 'CAD' },
  { value: 'AUD', label: 'AUD' },
  { value: 'CHF', label: 'CHF' },
];

const CURRENCY_PAIRS = [
  { value: 'EURUSD', label: 'EUR/USD' },
  { value: 'GBPUSD', label: 'GBP/USD' },
  { value: 'USDJPY', label: 'USD/JPY' },
  { value: 'USDCAD', label: 'USD/CAD' },
  { value: 'USDCHF', label: 'USD/CHF' },
  { value: 'AUDUSD', label: 'AUD/USD' },
  { value: 'NZDUSD', label: 'NZD/USD' },
  { value: 'EURJPY', label: 'EUR/JPY' },
  { value: 'GBPJPY', label: 'GBP/JPY' },
  { value: 'EURGBP', label: 'EUR/GBP' },
  { value: 'XAUUSD', label: 'XAU/USD (Gold)' },
];

export default function PipCalculator({ isEn }: { isEn: boolean }) {
  const [accountCurrency, setAccountCurrency] = useState('USD');
  const [pair, setPair] = useState('EURUSD');
  const [lots, setLots] = useState<string>('1');
  const [currentPrice, setCurrentPrice] = useState<string>('');

  const t = {
    accountCurrency: isEn ? 'Account Currency' : 'ارز حساب',
    currencyPair: isEn ? 'Currency Pair' : 'جفت ارز',
    tradeSize: isEn ? 'Trade Size (Lots)' : 'حجم معامله (لات)',
    currentPricePrefix: isEn ? 'Current Price of' : 'قیمت فعلی',
    pipValue: isEn ? 'Value per Pip' : 'ارزش هر پیپ',
    standardLotLabel: isEn ? '(1 Lot = 100,000 units)' : '(۱ لات = ۱۰۰,۰۰۰ واحد)'
  };

  const { quote, needsPrice, priceLabel, finalValue } = useMemo(() => {
    const isGold = pair === 'XAUUSD';
    const quoteCurrency = isGold ? 'USD' : pair.substring(3, 6);
    
    // A standard lot in forex is 100,000 units. For gold, it's 100 oz.
    const unitsPerLot = isGold ? 100 : 100000;
    // Standard pip for JPY is 0.01, for Gold is 0.1 or 0.01 depending on broker, but standard convention for 1 tick in gold often uses 0.01
    // Let's use 0.01 for XAUUSD (10 cents per pip on standard lot) or 0.1
    // Usually XAUUSD pip is the first decimal (0.1), giving $10 per lot.
    const pipSize = isGold ? 0.1 : (quoteCurrency === 'JPY' ? 0.01 : 0.0001);
    
    const parsedLots = parseFloat(lots) || 0;
    const units = parsedLots * unitsPerLot;
    
    // Raw pip value in quote currency
    const rawPipValueInQuote = pipSize * units;

    const _needsPrice = accountCurrency !== quoteCurrency;
    const _priceLabel = `${t.currentPricePrefix} ${accountCurrency}/${quoteCurrency}`;

    let _finalValue = rawPipValueInQuote;
    const parsedPrice = parseFloat(currentPrice) || 0;

    if (_needsPrice) {
      if (parsedPrice > 0) {
        _finalValue = rawPipValueInQuote / parsedPrice;
      } else {
        _finalValue = 0; // Wait for user to input price
      }
    }

    return {
      quote: quoteCurrency,
      needsPrice: _needsPrice,
      priceLabel: _priceLabel,
      finalValue: _finalValue
    };
  }, [accountCurrency, pair, lots, currentPrice, isEn]);

  const displaySymbol = (currency: string) => {
    switch(currency) {
      case 'USD': case 'CAD': case 'AUD': case 'NZD': return '$';
      case 'EUR': return '€';
      case 'GBP': return '£';
      case 'JPY': return '¥';
      case 'CHF': return '₣';
      default: return currency;
    }
  };

  return (
    <div className="calculator-card">
      <div className="calc-grid">
        <div className="form-group">
          <label>{t.accountCurrency}</label>
          <Select
            value={accountCurrency}
            onChange={setAccountCurrency}
            options={ACCOUNT_CURRENCIES}
          />
        </div>

        <div className="form-group">
          <label>{t.currencyPair}</label>
          <Select
            value={pair}
            onChange={setPair}
            options={CURRENCY_PAIRS}
          />
        </div>

        <div className="form-group">
          <label>{t.tradeSize} <span style={{fontSize: '0.75rem', opacity: 0.7}}>{t.standardLotLabel}</span></label>
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={lots}
            onChange={(e) => setLots(e.target.value)}
            placeholder="1.00"
          />
        </div>

        {needsPrice ? (
          <div className="form-group">
            <label>{priceLabel}</label>
            <input
              type="number"
              min="0.0001"
              step="any"
              value={currentPrice}
              onChange={(e) => setCurrentPrice(e.target.value)}
              placeholder="e.g. 1.1050"
            />
          </div>
        ) : (
          <div className="form-group" style={{ opacity: 0.5, pointerEvents: 'none' }}>
            <label>{isEn ? 'Current Price (Not Required)' : 'قیمت فعلی (نیاز نیست)'}</label>
            <input type="text" disabled placeholder="-" />
          </div>
        )}
      </div>

      <div className="calc-result">
        <span className="result-label">{t.pipValue}</span>
        <div className="result-value">
          <span className="currency-symbol">{displaySymbol(accountCurrency)}</span>
          {finalValue > 0 ? finalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 }) : '0.00'}
        </div>
      </div>
    </div>
  );
}
