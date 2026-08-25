# SuqET — Ethiopian Second-Hand Marketplace

**Phase 4 final submission** · Organizer: Seblewongel · Deadline: **26 August 2026**

SuqET is a full-stack marketplace for buying and selling used goods in Ethiopia. Buyers browse listings, chat with sellers, and pay through **Chapa TEST** checkout. Sellers list items and submit private KYC. Admins review verification photos that never appear on public listings.

This README is written for **hackathon judges**: clear about what the demo proves, how to run it in minutes, and what is intentionally not live production.

| Submission item | Link |
|-----------------|------|
| GitHub repo | https://github.com/kikemal/ethiopian-marketplace |
| Hosted demo | _add public URL before submission_ |
| Video walkthrough | _add video URL before submission_ |

---

## The Project

**Problem.** Informal second-hand trade in Ethiopia relies on social media and private chats. That makes discovery hard, payment trust thin, and seller identity difficult to verify without exposing IDs publicly.

**Solution.** SuqET gives buyers and sellers a shared product surface: searchable listings, in-app messaging, TEST-mode payment checkout, order status in the app, and admin-reviewed KYC stored privately.

| Folder | Role |
|--------|------|
| `web/` | Next.js 14 App Router + Tailwind. **No secret keys** — only `NEXT_PUBLIC_API_URL`. |
| `backend/` | Express + TypeScript + Prisma + PostgreSQL + JWT + Socket.io + Chapa + Cloudinary. **All secrets live in `backend/.env` only.** |

**Stack at a glance:** Node.js · Express · Prisma/PostgreSQL · Next.js 14 · Socket.io · Chapa (TEST) · Cloudinary (optional) · JWT (httpOnly cookie)

**What the demo proves**

- End-to-end buyer → chat → checkout → order status flow
- Seller listing + private KYC upload + admin review
- Secrets never shipped to the frontend

**What this is not**

- **Not live escrow.** “Released” / “refunded” update **our database**. They do not automatically pay the seller or reverse a real bank transfer.
- **Chapa is TEST mode** when `CHAPA_SECRET_KEY` is a real `CHASECK_TEST-…` key. If the key still contains the `xxx` placeholder, Buy Now uses an **in-app mock** checkout — not a bank transfer.
- Email (Gmail SMTP) is optional. Hosted platforms often block outbound SMTP; local demo works without mail.

---

## Setup

Requirements: **Node.js 18.17+**, **npm**, **Docker** (Postgres). Copy example env files. Never commit `.env` files.

### Demo accounts (after seed)

Password for every seeded account: `Password123!`

| Role | Email | Password |
|------|-------|----------|
| Buyer | sara@buyer.et | Password123! |
| Seller | abebe@seller.et | Password123! |
| Admin | admin@marketplace.et | Password123! |

Also seeded: `tigist@seller.et`, `dawit@seller.et`, `yonas@buyer.et`, `hanna@buyer.et` (same password).

`npm run seed` **deletes existing marketplace rows** and recreates demo data. It refuses to run when `NODE_ENV=production` unless `FORCE_SEED=true`.

### 1. Postgres

```bash
docker compose up -d
```

### 2. Backend — http://localhost:4000

```bash
cd backend
cp .env.example .env
npm install
npx prisma migrate dev
npm run seed
npm run dev
```

Edit `backend/.env` as needed. For real Chapa TEST checkout, set `CHAPA_SECRET_KEY` to a dashboard **Test** key (`CHASECK_TEST-…`). Leave the `xxx` placeholder only if you want mock checkout.

Health check: `GET` or `POST /api/health` → `{ "success": true, ... }`.

### 3. Frontend — http://localhost:3000

```bash
cd web
cp .env.local.example .env.local
npm install
npm run dev
```

`web/.env.local` needs only:

```
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### API shape

Every JSON response:

```json
{ "success": true, "data": {}, "message": "..." }
```

Errors may include `error`. Auth uses httpOnly cookie `etm_sid` (Bearer token still accepted).

---

## Features

- **Browse & search** — category, text, location; mobile-first (375px).
- **Accounts** — register / login / logout; optional Google OAuth; forgot/reset password and email verify when SMTP is configured.
- **Inbox** — listing-scoped chat (Socket.io) and notifications.
- **Sell** — photo listings, seller dashboard for items and sales.
- **Buy Now** — Chapa **TEST** hosted checkout with a real test secret; **mock checkout** only when the key still contains `xxx`.
- **Orders** — payment status `held` / `released` / `refunded`. Seller can confirm delivery; buyer can request a refund. Those actions update **our DB** — not live escrow or automatic payouts.
- **KYC** — sellers upload ID + face photos. Files stay **private** (disk under `backend/private/kyc` or Cloudinary private). Admins review in **Admin**; photos are not public listing images.
- **Admin** — pending KYC, listing reports, payment status tools.
- **i18n assist** — Google Translate for Amharic, Oromo, and Tigrinya (navbar / floating widget).
- **Health** — `GET` and `POST /api/health`.

**Payments (honest)**

- Chapa test phones ([docs](https://developer.chapa.co/docs)): `0900123456`, OTP `12345`.
- **localhost cannot receive Chapa webhooks.** After paying, the app returns to `/payments/return` and calls `POST /api/payments/sync` to verify the transaction.
- `cd backend && npm test` runs webhook-signature unit tests.

**Email (honest)**

- Gmail SMTP is optional. In non-prod, forgot-password may return `resetUrl` in the API so you can open the link without mail.
- Do not expect Gmail SMTP on Render.

---

## Usage

**Five-minute judge path:** open http://localhost:3000 → log in as Sara → open a listing → chat → Buy Now → return to Orders. Use a second browser (or private window) for Abebe or Admin in parallel.

### Buyer (Sara)

1. Log in: `sara@buyer.et` / `Password123!`
2. **Browse** — open a listing (e.g. Samsung Galaxy A14)
3. Message the seller from the listing or **Inbox** (seed includes a short thread)
4. **Buy Now** — Chapa TEST checkout, or mock page if the key still has `xxx`
5. After pay → `/payments/return` → **Orders** (status **held** when sync succeeds)
6. While **held**, buyer may **Request refund** (DB flag; Chapa refund may be attempted in TEST — not a live bank recall)

### Seller (Abebe)

1. Log in: `abebe@seller.et` / `Password123!`
2. **Sell** — create a listing (photos, ETB price, location)
3. **Dashboard** — listings and sales
4. **Orders** — **Confirm delivery** on a **held** payment marks it **released** in our DB only (not an automatic payout; settle in the Chapa dashboard if needed)
5. **Verify** (`/verify`) — upload ID + face photos (private)

### Admin

1. Log in: `admin@marketplace.et` / `Password123!`
2. **Admin** — approve/reject KYC (photos load only for the admin session)
3. Review listing reports on the same page

### Optional Google sign-in

Requires `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_CALLBACK_URL` in `backend/.env`. After Google redirects, the app exchanges a one-time code (`POST /api/auth/oauth/exchange`) so the token is not left in the URL.

---

## Deploy

Production target: **Render** (API + PostgreSQL + web).

| Item | Status |
|------|--------|
| Hosted demo URL | _add public URL before submission_ |
| Infra config | `render.yaml` when present in the repo root (Blueprint) |

Secrets stay on the server (Render env vars mapped from `backend/.env` patterns). The web service only receives `NEXT_PUBLIC_API_URL` pointing at the public API.

Local Docker Compose remains the supported path for judges who prefer to run the stack themselves (see **Setup**).
