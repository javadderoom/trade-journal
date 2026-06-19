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
- On init + every N seconds (or manual button):
  1. **Syncs open positions** — reads all live positions via `PositionsTotal()`, captures SL/TP directly from `POSITION_SL`/`POSITION_TP` (reliable source). Sends with `closeTime: null`.
  2. **Syncs closed trades** — scans MT5 deal history for closing deals (`DEAL_ENTRY_OUT`), links to open deals for open price/time, calculates final pips and R-multiple.
- Sends JSON via `WebRequest POST` to `/api/trades/sync`
- Backend upserts: creates new, updates open, skips already-closed
- Tracks last synced deal ticket in global variable to avoid re-sending closed trades

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
- Both open positions and closed trades are synced
- Open trades have `closeTime: null` and `closePrice: null`
- SL/TP for open trades come directly from `POSITION_SL` / `POSITION_TP` (always accurate)
- SL/TP for closed trades are recovered from `HistoryOrders` (may be 0 if broker doesn't store them, but the open sync should have already captured them)
- Closed trades use `DEAL_POSITION_ID` as the ticket to match previously synced open positions
- Works with netting accounts (most common for forex)
- Commission on open positions may only report entry-side commission on some brokers
