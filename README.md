# SuqET — Ethiopian Second-Hand Marketplace

**Phase 4 final submission** · Organizer: Seblewongel · Deadline: **26 August 2026**

SuqET is a full-stack marketplace for buying and selling used goods in Ethiopia. Buyers discover listings, message sellers in real time, and check out through **Chapa TEST**. Sellers list items and submit private KYC. Admins review verification photos that never appear on public listings.

This README is for **hackathon judges**: what the product is, what the demo proves, how to run it in minutes, and what is intentionally not live production.

| Submission item | Link |
|-----------------|------|
| GitHub repo | https://github.com/kikemal/ethiopian-marketplace |
| Hosted demo | _add public Render URL after deploy_ |
| Video walkthrough | _add video URL before submission_ |

---

## What SuqET is

**Problem.** Informal second-hand trade in Ethiopia leans on social media and private chats. Discovery is noisy, payment trust is thin, and seller identity is hard to verify without posting IDs in public threads.

**Solution.** SuqET gives buyers and sellers one shared surface:

- Searchable listings with photos and ETB prices
- In-app chat scoped to a listing
- TEST-mode payment checkout with order status in the app
- Admin-reviewed KYC stored privately (not on listing pages)

**What the demo proves**

- End-to-end buyer → chat → checkout → order status
- Seller listing + private KYC upload + admin review
- Secrets stay on the API — never in the Next.js app

**What this is not**

- **Not live escrow.** “Released” / “refunded” update **our database**. They do not automatically pay the seller or reverse a real bank transfer.
- **Chapa is TEST mode** with a real `CHASECK_TEST-…` key. If the key still contains the `xxx` placeholder, Buy Now uses an **in-app mock** checkout — not a bank transfer.
- Email (Gmail SMTP) is optional. Hosted platforms often block outbound SMTP; local demo works without mail.

---

## Architecture

Two codebases. Clear boundary.

| Folder | Role |
|--------|------|
| `web/` | Next.js 14 App Router + Tailwind. **No secret keys** — only `NEXT_PUBLIC_API_URL`. |
| `backend/` | Express + TypeScript + Prisma + PostgreSQL + JWT + Socket.io + Chapa + Cloudinary. **All secrets live in `backend/.env` only.** |

**Stack:** Node.js · Express · Prisma/PostgreSQL · Next.js 14 · Socket.io · Chapa (TEST) · Cloudinary (optional) · JWT via httpOnly cookie

Every JSON API response:

```json
{ "success": true, "data": {}, "message": "..." }
```

Errors may include `error`. Auth uses httpOnly cookie `etm_sid` (Bearer token still accepted).

```
Browser (web/) ──REST + cookies──► Express API (backend/)
                 Socket.io chat
API ──Prisma──► PostgreSQL
API ──optional──► Cloudinary · Chapa TEST
```

---

## User flows

### Buyer — browse → chat → buy → hold/release

1. Browse and search listings (category, text, location).
2. Open a listing → message the seller (Socket.io inbox).
3. **Buy Now** → Chapa TEST hosted checkout (or mock if the key still has `xxx`).
4. Return to `/payments/return` → sync verifies the tx → order shows **held**.
5. Seller **Confirm delivery** → status **released** in our DB. Buyer may **Request refund** while held (DB flag; TEST refund may be attempted — not a live bank recall).

### Seller — list + dashboard

1. Create listings with photos, ETB price, location.
2. **Dashboard** for own items and sales.
3. **Orders** — confirm delivery on held payments.
4. **Verify** — upload ID + face photos for KYC.

### Admin — KYC + reports

1. Review pending KYC (photos load only for the admin session).
2. Approve or reject sellers.
3. Review listing reports on the same admin surface.

---

## Cloudinary

| Use | Behavior |
|-----|----------|
| Listing images | Public upload (or local `uploads/` when Cloudinary is unset). |
| KYC documents | **Private** storage — Cloudinary `type: 'private'` when configured, else disk under `backend/private/kyc`. Served only through authenticated admin/KYC routes — never as public listing URLs. |

On Render, Cloudinary is strongly recommended (ephemeral disk).

---

## Auth

- **Email / password** — register, login, logout; optional forgot/reset and email verify when SMTP is configured.
- **Google OAuth** (optional) — after Google redirects, the frontend exchanges a **one-time code** via `POST /api/auth/oauth/exchange`. The session JWT is **not** left in the URL.
- **Session** — httpOnly cookie `etm_sid`. In production (`NODE_ENV=production`), cookie is Secure + SameSite=None so login works across separate web/API hosts.

Requires `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_CALLBACK_URL` in `backend/.env` for Google sign-in.

---

## Google Translate

Navbar language control (Google Translate Element) for:

- **English** (`en`)
- **Amharic** (`am`)
- **Afaan Oromo** (`om`)
- **Tigrinya** (`ti`)

No special deploy config. Assists reading the UI; it is not a full i18n string catalog.

---

## Chapa payments (honest)

| Mode | When |
|------|------|
| **TEST checkout** | `CHAPA_SECRET_KEY` is a real dashboard Test key (`CHASECK_TEST-…`). |
| **Mock checkout** | Key still contains the `xxx` placeholder — in-app mock only. |

- Webhooks: HMAC-verified (`CHAPA_WEBHOOK_SECRET`); dashboard URL → `POST /api/payments/verify`.
- **localhost cannot receive Chapa webhooks.** After paying, the app returns to `/payments/return` and calls `POST /api/payments/sync` to verify.
- Order statuses `held` / `released` / `refunded` are **app DB state**, not full live escrow or automatic seller payout.
- Chapa test phones ([docs](https://developer.chapa.co/docs)): `0900123456`, OTP `12345`.
- `cd backend && npm test` runs webhook-signature unit tests.

---

## KYC

1. Seller uploads ID + face photos at **Verify**.
2. Files stay private (disk or Cloudinary private).
3. Admin opens **Admin**, reviews photos in-session, approves or rejects.
4. KYC images are **not** public listing assets.

---

## Other strengths

- **Realtime chat & inbox** — Socket.io, listing-scoped threads, notifications.
- **Mobile-first** — layouts aimed at 375px width.
- **Rate limits** — auth, payments, and write routes (`express-rate-limit`; `TRUST_PROXY` behind Render).
- **Health** — `GET` and `POST /api/health` → `{ "success": true, ... }`.
- **Render deploy** — root `render.yaml` Blueprint: Postgres (`suqet-db`) + API (`suqet-api`) + Next.js (`suqet-web`). Secrets only on the API service.

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

Health check: `GET` or `POST /api/health`.

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

---

## Usage — five-minute judge path

Open http://localhost:3000 → log in as Sara → open a listing → chat → Buy Now → return to Orders. Use a second browser (or private window) for Abebe or Admin in parallel.

### Buyer (Sara)

1. Log in: `sara@buyer.et` / `Password123!`
2. **Browse** — open a listing (e.g. Samsung Galaxy A14)
3. Message the seller from the listing or **Inbox**
4. **Buy Now** — Chapa TEST checkout, or mock page if the key still has `xxx`
5. After pay → `/payments/return` → **Orders** (status **held** when sync succeeds)

### Seller (Abebe)

1. Log in: `abebe@seller.et` / `Password123!`
2. **Sell** — create a listing
3. **Dashboard** — listings and sales
4. **Orders** — **Confirm delivery** on a **held** payment → **released** in our DB only
5. **Verify** (`/verify`) — upload ID + face photos (private)

### Admin

1. Log in: `admin@marketplace.et` / `Password123!`
2. **Admin** — approve/reject KYC; review listing reports

---

## Deploy (Render)

Production target: **Render** (PostgreSQL + Express API + Next.js 14 App Router). App Router needs a **Web Service** (Node), not Static Site.

`render.yaml` Blueprint resources:

| Resource | Name | Role |
|----------|------|------|
| Postgres | `suqet-db` | `DATABASE_URL` |
| Web Service | `suqet-api` | Express API (`backend/`) |
| Web Service | `suqet-web` | Next.js (`web/`) |

**API** — build: `npm install --include=dev && npm run build` · start: `npx prisma migrate deploy && node dist/server.js` · health: `GET /api/health`

**Web** — build: `npm install --include=dev && npm run build` · start: `npm start` · only `NEXT_PUBLIC_API_URL` (inlined at **build** time — clear cache & redeploy after changing it)

### Env checklist (names only)

**`suqet-api`:** `DATABASE_URL`, `NODE_ENV`, `TRUST_PROXY`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `FRONTEND_URL`, `BACKEND_PUBLIC_URL`, `CHAPA_SECRET_KEY`, `CHAPA_WEBHOOK_SECRET`, `CHAPA_CALLBACK_URL`, optional Cloudinary / SMTP / Google OAuth.

**`suqet-web`:** `NEXT_PUBLIC_API_URL` (same origin as `BACKEND_PUBLIC_URL`, no trailing slash), `NODE_ENV`.

### Dashboard steps

1. [Render Dashboard](https://dashboard.render.com) → **New** → **Blueprint** → connect this repo → `render.yaml` on `main`.
2. Apply Blueprint; set `FRONTEND_URL` / `BACKEND_PUBLIC_URL` / Chapa / Cloudinary after hostnames exist.
3. Wait for Postgres + `suqet-api`. Set `NEXT_PUBLIC_API_URL` on `suqet-web` and redeploy with cleared build cache.
4. Chapa Test webhook: `https://<suqet-api-host>/api/payments/verify`. Callback must match `CHAPA_CALLBACK_URL`.
5. Smoke-test: `GET /api/health`, then browse/login on the web URL.

Do **not** commit `.env` / `.env.local`. Do not put Chapa/Cloudinary/JWT secrets in `web/`.

Local Docker Compose remains the supported path for judges who prefer to run the stack themselves (see **Setup**).
