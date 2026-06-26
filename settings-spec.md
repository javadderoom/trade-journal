# Settings Page — تنظیمات
## TradeKav | Page Specification

---

## Purpose

The settings page lets users manage everything about their account that isn't trading data.
It is divided into four tabs. Each tab is a self-contained section — no cross-tab dependencies.

---

## Layout

```
┌─────────────────────────────────────────────────────────┐
│  SIDEBAR (right, fixed)                                  │
│  داشبورد | معاملات | گزارش عملکرد | ژورنال | تنظیمات ✓  │
├─────────────────────────────────────────────────────────┤
│  PAGE TITLE: "تنظیمات"                                   │
│                                                          │
│  TAB BAR (horizontal, right-aligned):                    │
│  پروفایل | حساب‌های بروکر | اشتراک | امنیت              │
├─────────────────────────────────────────────────────────┤
│  TAB CONTENT (changes per tab)                           │
└─────────────────────────────────────────────────────────┘
```

---

## Tab 1 — پروفایل (Profile)

### Fields

| Field | Label | Type | Notes |
|---|---|---|---|
| Name | نام کامل | Text input | Required |
| Email | ایمیل | Text input | Read-only if verified — show green verified badge |
| Phone | شماره موبایل | Text input | Iranian format 09XXXXXXXXX — optional |
| Display currency | ارز نمایش | Toggle | USD / تومان / هر دو |
| Language | زبان | Read-only | فارسی — v1 only has Farsi |

### Avatar
- Circle avatar — initials fallback if no image
- "تغییر عکس" button — file upload, max 2MB, JPG/PNG only
- No external URL input

### Save behavior
- Single "ذخیره تغییرات" button at the bottom
- Show inline success toast: "پروفایل با موفقیت ذخیره شد"
- Show inline error if email already taken

### Display currency note
This affects how P&L is shown across the entire app:
- **USD only:** $1,247.50
- **Toman only:** ۱۸٬۷۱۲٬۵۰۰ ت
- **Both:** $1,247.50 (۱۸٬۷۱۲٬۵۰۰ ت)

Store preference in user table. Apply globally via a React context.

---

## Tab 2 — حساب‌های بروکر (Broker Accounts)

This is the most important settings tab — it directly affects trade import and filtering.

### Account card (per account)

```
┌──────────────────────────────────────────────────────┐
│  [Avatar: broker initial]  Amarkets                  │
│                            حساب شماره: #12345        │
│                            پلتفرم: MT5 | ارز: USD    │
│                            ۸۴ معامله | آخرین واردات:  │
│                            ۲۸ خرداد ۱۴۰۴             │
│                                                      │
│  [واردات جدید]  [ویرایش]  [حذف]                      │
└──────────────────────────────────────────────────────┘
```

- "واردات جدید" → navigates to import flow (trades page import tab)
- "ویرایش" → opens inline edit form inside the card (expand, not modal)
- "حذف" → confirmation dialog before delete:
  ```
  "با حذف این حساب، تمام ۸۴ معامله مرتبط با آن نیز حذف می‌شوند.
  آیا مطمئن هستید؟"
  [بله، حذف کن] [انصراف]
  ```

### Add new account

Dashed border card at the bottom of the list:

```
┌──────────────────────────────────────────────────────┐
│            +  افزودن حساب بروکر جدید                 │
└──────────────────────────────────────────────────────┘
```

Clicking expands an inline form (not a modal):

| Field | Label | Type | Notes |
|---|---|---|---|
| Broker name | نام بروکر | Searchable dropdown | Preloaded: Amarkets, LiteFinance, Errante, Alpari, RoboForex, HFM, + custom input |
| Account number | شماره حساب | Text | Numbers only |
| Platform | پلتفرم | Toggle | MT4 / MT5 |
| Currency | ارز حساب | Toggle | USD / EUR / GBP |
| Description | توضیحات | Text | Optional — e.g. "حساب اصلی" |

Save button: "ذخیره حساب"
Cancel link: "انصراف"

### Limits by plan

| Plan | Max accounts |
|---|---|
| رایگان | ۱ |
| استاندارد | ۳ |
| حرفه‌ای | نامحدود |

If user hits the limit, show a banner above the add button:
```
"برای افزودن حساب بیشتر، اشتراکت رو ارتقا بده"
[ارتقا به استاندارد]
```

---

## Tab 3 — اشتراک (Subscription)

### Current plan card

```
┌──────────────────────────────────────────────────────┐
│  پلن فعلی: استاندارد                    [badge]      │
│  تمدید خودکار: ۱ تیر ۱۴۰۴                           │
│  مبلغ: ۱۵۰٬۰۰۰ تومان / ماه                          │
│                                                      │
│  [لغو اشتراک]                                        │
└──────────────────────────────────────────────────────┘
```

### Plan comparison table

| Feature | رایگان | استاندارد | حرفه‌ای |
|---|---|---|---|
| معاملات | ۵۰/ماه | نامحدود | نامحدود |
| حساب بروکر | ۱ | ۳ | نامحدود |
| واردات MT4/MT5 | ✗ | ✓ | ✓ |
| گزارش عملکرد | محدود | کامل | کامل |
| ژورنال روزانه | ✓ | ✓ | ✓ |
| قیمت ماهانه | رایگان | ۱۵۰٬۰۰۰ ت | ۳۵۰٬۰۰۰ ت |
| قیمت سالانه | رایگان | ۱٬۴۴۰٬۰۰۰ ت | ۳٬۳۶۰٬۰۰۰ ت |

- Highlight current plan column with emerald border
- Show "۲ ماه رایگان" badge on annual pricing

### Upgrade CTA
- If on Free: show "ارتقا به استاندارد" (emerald) and "ارتقا به حرفه‌ای" (outline)
- If on Standard: show "ارتقا به حرفه‌ای" only
- If on Pro: show "بهترین پلن رو داری 🎉"

### Payment history table

| Column | Value |
|---|---|
| تاریخ | Jalali date |
| مبلغ | Toman amount |
| پلن | plan name |
| وضعیت | موفق / ناموفق |
| رسید | دانلود لینک |

Show last 6 payments. "مشاهده همه" link for full history.

### Cancellation flow
"لغو اشتراک" button → confirmation dialog:
```
"با لغو اشتراک، دسترسی به ویژگی‌های پرمیوم تا پایان دوره فعلی
(۱ تیر ۱۴۰۴) ادامه خواهد داشت. داده‌هایت حفظ می‌شود."

[بله، لغو کن]  [انصراف]
```
Never delete user data on cancellation — downgrade to free plan only.

---

## Tab 4 — امنیت (Security)

### Change password

```
فعلی:      [••••••••]
جدید:      [••••••••]  ← strength indicator
تکرار:     [••••••••]
[تغییر رمز عبور]
```

- Password strength bar: ضعیف / متوسط / قوی
- Show/hide toggle on all three fields
- Inline validation — don't wait for submit
- Success: "رمز عبور با موفقیت تغییر کرد"
- After change: invalidate all refresh tokens except current session

### Active sessions

List of active refresh tokens with device/browser info:

```
┌──────────────────────────────────────────────────────┐
│  Chrome — Windows          این دستگاه [badge]        │
│  آخرین فعالیت: همین الان                             │
├──────────────────────────────────────────────────────┤
│  Firefox — Android                                   │
│  آخرین فعالیت: ۲ روز پیش          [خروج از این دستگاه]│
└──────────────────────────────────────────────────────┘
```

"خروج از تمام دستگاه‌ها" button at the bottom — invalidates all refresh tokens.

### Danger zone

Collapsed section at the bottom, red border:

```
⚠️ حذف حساب کاربری

"با حذف حساب، تمام معاملات، ژورنال‌ها و داده‌هایت
به صورت دائمی حذف می‌شوند و قابل بازیابی نیستند."

[حذف حساب کاربری]  ← red outline button
```

Delete flow:
1. Click button → modal appears
2. User must type their email to confirm
3. Second confirmation: "آیا کاملاً مطمئن هستید؟"
4. On confirm: soft delete (set `deletedAt` timestamp, schedule hard delete after 30 days)
5. Log out immediately + redirect to landing page

---

## API Endpoints Needed

```
// Profile
GET    /api/settings/profile
PUT    /api/settings/profile
POST   /api/settings/avatar

// Broker accounts
GET    /api/accounts
POST   /api/accounts
PUT    /api/accounts/:id
DELETE /api/accounts/:id

// Subscription
GET    /api/subscription
GET    /api/subscription/history
POST   /api/subscription/cancel
POST   /api/payments/checkout     ← ZarinPal

// Security
PUT    /api/auth/password
GET    /api/auth/sessions
DELETE /api/auth/sessions/:id
DELETE /api/auth/sessions          ← all sessions
DELETE /api/settings/account       ← account deletion
```

---

## Shared UI Behaviors

### Save patterns
- Profile tab: explicit save button — user controls when to save
- Broker accounts: save per-card action
- Security: explicit save button per section
- Never auto-save in settings — user must confirm changes

### Toast notifications (bottom-left, RTL)
- Success: emerald background — "تغییرات ذخیره شد"
- Error: red background — "خطا در ذخیره تغییرات"
- Duration: 3 seconds, dismissible

### Unsaved changes guard
If user navigates away from profile tab with unsaved changes:
```
"تغییرات ذخیره نشده دارید. آیا می‌خواهید صفحه را ترک کنید؟"
[ترک صفحه]  [ماندن]
```

---

## Design Tokens

```
Background:        #0F1117
Surface (cards):   #181C27
Border:            #252A3A
Danger zone:       border #FF5370/30, bg #FF5370/5
Accent:            #3DDC97
Text primary:      #E8EAF0
Text muted:        #6B7280
Font:              Vazirmatn
Direction:         RTL
```

---

## Build Order

1. Tab shell + routing (query param: `?tab=profile`)
2. Profile tab — form + avatar upload
3. Broker accounts tab — CRUD + plan limit enforcement
4. Subscription tab — plan display + payment history (ZarinPal comes later)
5. Security tab — password change + sessions
6. Danger zone — account deletion (soft delete)

---

## Notes

- **Never hard-delete immediately** — always soft delete with 30-day grace period
- **ZarinPal checkout** lives in payments route, not settings — settings just links to it
- **Avatar upload** — store on Arvan Cloud Object Storage, not in PostgreSQL
- **Session list** — store `userAgent` + `createdAt` on `RefreshToken` model (add these columns)
- **Display currency preference** — store on `User` model, expose via `/api/auth/me`

---

*TradeKav Settings Spec v1.0*
