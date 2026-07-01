# Crypto Payment Integration Plan - Direct Blockchain Verification (USDT-TRC20 / TRX)

This plan details the implementation of a decentralized, self-hosted cryptocurrency payment system using the TRON blockchain (TRX and USDT-TRC20) to bypass centralized payment processors and sanctions.

---

## 1. Database Model Changes

We need to persist transaction hashes in the database to prevent **double-spending attacks** (users submitting the same transaction hash multiple times to get free upgrades).

### [MODIFY] [schema.prisma](file:///d:/Code/trade-journal/apps/api/src/prisma/schema.prisma)
Add a new model `CryptoTransaction`:

```prisma
model CryptoTransaction {
  id           String            @id @default(uuid())
  user_id      String
  user         User              @relation(fields: [user_id], references: [id], onDelete: Cascade)
  tx_hash      String            @unique // Unique transaction hash
  coin         String            // "USDT" or "TRX"
  amount       Float             // Amount paid (e.g. 5.0 for $5 USDT)
  plan         Plan
  period       String            // "monthly" or "annual"
  status       CryptoTxStatus    @default(PENDING)
  created_at   DateTime          @default(now())
  updated_at   DateTime          @updatedAt

  @@index([user_id])
}

enum CryptoTxStatus {
  PENDING
  COMPLETED
  FAILED
}
```

Also, add the relation `@relation` inside the `User` model:
```prisma
cryptoTransactions CryptoTransaction[]
```

---

## 2. Configuration & Admin Settings

We will make the crypto parameters dynamically manageable via `SystemSetting` key `'CRYPTO_SETTINGS'`.

### JSON Schema for `'CRYPTO_SETTINGS'`
```json
{
  "usdtAddress": "TYxxxxxxYOURTRONADDRESSxxxxxxx",
  "trxAddress": "TYxxxxxxYOURTRONADDRESSxxxxxxx",
  "standard": {
    "monthlyUsd": 5.0,
    "annualUsd": 45.0
  },
  "pro": {
    "monthlyUsd": 10.0,
    "annualUsd": 90.0
  }
}
```

---

## 3. Backend Implementation (API)

### A. Query Settings Endpoint
* **`GET /api/settings/crypto`**
  - Publicly accessible endpoint to retrieve crypto deposit addresses and current USD prices.

### B. Submit & Verify Transaction Endpoint
* **`POST /api/payments/crypto/submit`**
  - **Inputs:** `txHash` (string), `coin` ("USDT" | "TRX"), `plan` ("STANDARD" | "PRO"), `period` ("monthly" | "annual"), `discountCode` (optional).
  - **Logic:**
    1. **Duplicate Check:** Check if `txHash` already exists in `CryptoTransaction` table. If yes, reject.
    2. **Temporary Record:** Create a `CryptoTransaction` record with status `PENDING`.
    3. **Blockchain Query:** Make a request to a public TRON node/explorer API (e.g. `https://apilist.tronscanapi.com/api/transaction-info?hash={txHash}`).
    4. **Verification Criteria:**
       - Confirm transaction state is `SUCCESS` / `confirmed` is true.
       - If `coin` is `USDT`:
         - Check that token recipient `to_address` matches your configured `usdtAddress`.
         - Confirm token symbol is `USDT` (smart contract `TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t`).
         - Verify `amount` matches the required USD price (accounting for decimal scaling, e.g. 6 decimals for USDT).
       - If `coin` is `TRX`:
         - Verify recipient is `trxAddress`.
         - Convert standard TRX price dynamically (or match predefined TRX rates) and check amount.
    5. **Database Update & Upgrade:** If valid:
       - Update `CryptoTransaction` status to `COMPLETED`.
       - Update User's active subscription (similar to PayPing/ZarinPal callback code).
       - Return successful response.

---

## 4. Frontend Implementation

### A. Checkout Modal Integration
We will add a "رمزارز (USDT / TRX)" tab inside the subscription checkout modal:
- Shows the USD price (e.g. $5.00 USDT).
- Displays the deposit wallet address with a "Copy" button.
- Renders a QR code of the address.
- Shows clear instructions: *"Please send the exact amount of USDT (TRC-20) to this address, then paste the Transaction TXID below to activate your plan instantly."*
- An input text field for **کد هش تراکنش (TXID)**.
- A "ثبت و فعال‌سازی" (Submit & Activate) button with a loading state.

### B. Admin Panel Integration
Add a **تنظیمات رمزارز (Crypto Settings)** section in the Admin settings:
- Input fields to update the TRON/USDT Wallet Address.
- Input fields to configure USD prices for both standard and pro plans.
- Saves changes by sending a PUT request to `/api/admin/settings/crypto`.

---

## 5. Verification Plan

### Automated/Unit Tests
- Verify that a transaction hash can only be submitted once. Subsequent attempts must trigger a `400 Bad Request` (Double Spend Protection).
- Verify that invalid/non-existent transaction hashes are rejected.

### Manual Verification
1. Open subscription modal, select "Crypto".
2. Transfer $5.00 USDT from a personal wallet (e.g., Trust Wallet) to the displayed address.
3. Paste the generated Transaction Hash into the box and press Submit.
4. Verify the plan upgrades immediately and a `CryptoTransaction` record is created in the database with status `COMPLETED`.
