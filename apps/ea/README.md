# MT5 Expert Advisor — Trade Sync

## File
`TradeJournal_EA.mq5` — copy to MT5 `Experts/` folder, compile in MetaEditor.

## Setup
1. Copy `TradeJournal_EA.mq5` to `MQL5/Experts/`
2. Open in MetaEditor → Compile
3. In MT5: Tools → Options → Expert Advisors →勾选 "Allow WebRequest for listed URL"
4. Add API URL: `http://localhost:3000` (or your server URL)
5. Drag EA onto any chart
6. Configure inputs:
   - **API Base URL** — your API server address
   - **API Auth Token** — leave empty if no auth
   - **Account ID** — your account ID in معامله‌یار
   - **Sync Interval** — seconds between auto-sync (0 = manual only)
   - **Lookback Days** — how far back to sync on first run

## How it works
- On init + every N seconds (or manual button), scans MT5 deal history
- Finds closing deals (`DEAL_ENTRY_OUT`), links to open deals for SL/TP/open price
- Calculates pips and R-multiple
- Sends JSON via `WebRequest POST` to `/api/trades/sync`
- Tracks last synced ticket in global variable to avoid re-sending

## JSON payload format
```json
[{
  "ticket": 12345678,
  "symbol": "EURUSD",
  "direction": "BUY",
  "openTime": "2026-06-15T10:30:00Z",
  "closeTime": "2026-06-15T14:45:00Z",
  "openPrice": 1.0850,
  "closePrice": 1.0880,
  "lotSize": 0.1,
  "stopLoss": 1.0820,
  "takeProfit": 1.0900,
  "profitUsd": 30.00,
  "commission": -1.50,
  "swap": -0.25,
  "pips": 30.0,
  "rMultiple": 0.83
}]
```

## Notes
- Only closed trades are synced (not open positions)
- SL/TP come from the position level, not the deal
- Works with netting accounts (most common for forex)
