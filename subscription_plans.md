# TradeKav (تریدکاو) Subscription Plans & Access Control

This document outlines the architecture, limits, pricing, and integration details for the subscription plans implemented in **TradeKav (تریدکاو)**.

---

## 1. Plan Overview & Feature Matrix

TradeKav offers three subscription tiers: **FREE**, **STANDARD**, and **PRO**. Access controls are enforced both on the backend database level and in the frontend user interface.

| Feature / Limit | FREE (رایگان) | STANDARD (استاندارد) | PRO (حرفه‌ای) | Enforced By |
| :--- | :--- | :--- | :--- | :--- |
| **Price (Monthly)** | 0 Toman | 150,000 Toman | 350,000 Toman | - |
| **Price (4-Month)** | - | 500,000 Toman (16% off) | 1,200,000 Toman (14% off) | - |
| **Price (Annual)** | - | 1,200,000 Toman (33% off) | 3,000,000 Toman (28% off) | - |
| **Broker Accounts** | Max 1 account | Max 3 accounts | Unlimited | `checkAccountLimit` |
| **Manual Trades Logging**| Max 50 trades / month | Unlimited | Unlimited | `checkTradeLimit` |
| **MT4/MT5 File Imports** | ❌ Blocked | ✔️ Unlimited | ✔️ Unlimited | `checkImportPermission` |
| **Automated EA Sync** | ❌ Blocked | ❌ Blocked | ✔️ Unlimited | `checkSyncPermission` |

---

## 2. Backend Middleware Protection

Access limits are validated in the API backend routes using the custom middleware defined in [checkPlanLimits.ts](file:///d:/Code/trade-journal/apps/api/src/middleware/checkPlanLimits.ts). 

Rather than relying on the client's JWT payload (which could be stale), the middleware performs **live database lookups** on the user's current plan status to enforce constraints:

1.  **Account Limits (`checkAccountLimit`):**
    Triggered during `POST /api/settings/accounts`. It checks the total number of non-deleted broker accounts linked to the user.
2.  **Trade Limits (`checkTradeLimit`):**
    Triggered during `POST /api/trades` (manual logging). It tallies the number of manually created trades logged in the current calendar month for FREE tier users, blocking creation if they exceed 50.
3.  **Import Limits (`checkImportPermission`):**
    Triggered during `POST /api/trades/import-mt4`. Restricts Bulk Statement file processing to STANDARD and PRO tiers.
4.  **Sync Limits (`checkSyncPermission`):**
    Triggered during `POST /api/trades/sync`. Restricts automated Expert Advisor (EA) synchronization to the PRO tier only.

---

## 3. ZarinPal Gateway Integration

Payments are integrated using the ZarinPal gateway service. 

### Gateway Config (`/api/payments/checkout`)
Requests payment authorization with the selected package duration (`monthly`, `4-month`, or `annual`) and corresponding Toman price. It registers a unique transaction authority code and returns the redirection URL.

### Local Mock Billing Gateway
To facilitate local offline testing without calling live financial networks:
*   Setting `MOCK_PAYMENT=true` in `apps/api/.env` redirects checkouts to `http://localhost:3000/api/payments/mock-gateway`.
*   This renders a simulated bank gateway page offering **"پرداخت موفق" (Successful Payment)** and **"انصراف از پرداخت" (Cancel Payment)** options.

### Verification (`/api/payments/verify`)
Triggered automatically on return callback redirect. It:
1.  Performs a database transaction (`prisma.$transaction`) to atomically expire any previous active subscriptions.
2.  Creates a new active subscription record with correct start and expiration dates (1 month, 4 months, or 12 months from now).
3.  Upgrades the user's `plan` column (`STANDARD` or `PRO`) on the `User` model.
4.  Refreshes the client-side authentication context so the upgraded limits take effect immediately.

---

## 4. Frontend UI Implementation

### Upgrades Grid ([settings/page.tsx](file:///d:/Code/trade-journal/apps/web/src/app/settings/page.tsx))
Located in the **Subscription** tab of Settings. It displays card packages showing prices dynamically toggled by Month / 4-Months / Year, with a detailed comparative features table at the bottom.

### Warning Banners ([trades/page.tsx](file:///d:/Code/trade-journal/apps/web/src/app/trades/page.tsx) & [dashboard/page.tsx](file:///d:/Code/trade-journal/apps/web/src/app/dashboard/page.tsx))
Warns FREE tier users when they approach or exceed their limits:
*   **Warning State (40-49 trades):** Displays an orange warning alert banner indicating they are close to their monthly 50-trade limit.
*   **Locked State (>= 50 trades):** Displays a red warning alert banner informing them that logging is locked until they upgrade.

### Layout Status Badges ([SideNavBar.tsx](file:///d:/Code/trade-journal/apps/web/src/components/layout/SideNavBar.tsx))
Updates the navigation panel's sub-label to display **"نسخه رایگان"**, **"نسخه استاندارد"**, or **"نسخه حرفه‌ای"** based on the state. Hides the upgrade advertisement card for PRO tier users.
