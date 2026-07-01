# TradeKav EA — Trade Sync (MT4 & MT5)

## Files
- `TradeKav_EA.mq5` — MetaTrader 5 version
- `TradeKav_EA.mq4` — MetaTrader 4 version

Copy the appropriate file to your platform's `Experts/` folder, then compile in MetaEditor.

## Setup (MT4)
1. Copy `TradeKav_EA.mq4` to `MQL4/Experts/`
2. Open in MetaEditor → Compile (F7)
3. In MT4: Tools → Options → Expert Advisors → check "Allow WebRequest for listed URL"
4. Add API URL: `https://api.tradekav.ir` (or your server URL)
5. Drag EA onto any chart
6. Configure inputs:
   - **API Base URL** — your API server address
   - **API Auth Token** — your account's sync token from the web app
   - **Account ID** — your account ID in TradeKav
   - **Sync Interval** — seconds between auto-sync (0 = manual only via chart button)
   - **Lookback Days** — how far back to scan for historical trades on first run

## Setup (MT5)
1. Copy `TradeKav_EA.mq5` to `MQL5/Experts/`
2. Open in MetaEditor → Compile
3. In MT5: Tools → Options → Expert Advisors → check "Allow WebRequest for listed URL"
4. Add API URL: `https://api.tradekav.ir` (or your server URL)
5. Drag EA onto any chart
6. Configure inputs (same as MT4 above)

## How it works (MT5)
- On init + every N seconds (or manual button):
  1. **Syncs open positions** — reads via `PositionsTotal()`, captures SL/TP from `POSITION_SL`/`POSITION_TP`. Sends with `closeTime: null`.
  2. **Syncs closed trades** — scans deal history for closing deals (`DEAL_ENTRY_OUT`), links to open deals via `DEAL_POSITION_ID` for open price/time, calculates pips and R-multiple.
- Uses `DEAL_POSITION_ID` as the ticket to match closed trades with previously synced open positions → backend updates the same record instead of creating duplicates.

## How it works (MT4)
- On init + every N seconds (or manual button):
  1. **Syncs open positions** — reads via `OrdersTotal()` / `OrderSelect(MODE_TRADES)`. Each open order uses its own ticket. Sends with `closeTime: null`.
  2. **Syncs closed trades** — reads via `OrdersHistoryTotal()` / `OrderSelect(MODE_HISTORY)`. Each closed order is self-contained (MT4 stores all data — open/close price, time, SL, TP, profit, commission, swap — on a single order record). Uses the close order's own ticket as identifier.
- Since MT4 lacks a position-ID linking opens and closes, each closed trade creates a new record. Open records remain in the DB as snapshots (they show the trade's state at last sync).

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
- Backend upserts by `(account_id + ticket)`: creates new, updates open, skips finalized
- Tracks last synced ticket in a terminal global variable to avoid re-sending
- Works with netting and hedging accounts
- Commission on open positions may only report entry-side commission on some brokers
