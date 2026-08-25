# SuqET — Ethiopian Second-Hand Marketplace

SuqET is a hackathon demo for buying and selling used goods in Ethiopia. You can browse listings, message the other person, pay with **Chapa TEST** checkout, and (as admin) review private KYC photos.

This README is written for **judges**. It is honest about what works in the demo and what is not live production.

**Phase 4 final submission** (organizer: Seblewongel). Deadline: **26 August 2026**.

| Submission item | Link |
|-----------------|------|
| GitHub repo | https://github.com/kikemal/ethiopian-marketplace |
| Demo branch (until merged to `main`) | https://github.com/kikemal/ethiopian-marketplace/tree/feat/hackathon-demo-ship |
| Pull request | https://github.com/kikemal/ethiopian-marketplace/pull/1 |
| Hosted demo | _add your Render/Vercel URL here_ |
| Video walkthrough | _add your video URL here_ |

---

## The Project

SuqET is a two-folder marketplace:

| Folder | What it is |
|--------|------------|
| `web/` | Next.js 14 app (the screens). **No secret keys.** Only `NEXT_PUBLIC_API_URL`. |
| `backend/` | Express API (Prisma, PostgreSQL, JWT, Chapa, Cloudinary, SMTP, Socket.io). **All secrets live in `backend/.env` only.** |

**What you can show in a demo**

- A buyer browses used listings (phones, furniture, clothes, and more), chats with a seller, and pays through checkout.
- A seller posts a listing, sees orders, and can submit ID + face photos for KYC.
- An admin reviews those KYC photos in the admin UI (they are **not** public listing images).

**What this is not**

- It is **not** live escrow. “Released” only updates our database. It does **not** automatically pay the seller.
- Chapa is **TEST mode** when you use a real `CHASECK_TEST-…` key. If the key still contains `xxx` (the placeholder), Buy Now uses an **in-app mock** checkout — that is not a bank transfer.
- Email on a hosted server is optional and often broken (Gmail SMTP; Render blocks outbound SMTP). Local demo still works without mail.

---

## Setup

You need **Node.js 18.17+**, **npm**, and **Docker** (for Postgres). Copy example env files. Never commit `.env` files.

### Demo accounts (after seed)

Password for every seeded account is `Password123!`. Copy any row:

| Role | Email | Password |
|------|-------|----------|
| Buyer | sara@buyer.et | Password123! |
| Seller | abebe@seller.et | Password123! |
| Admin | admin@marketplace.et | Password123! |

Same password also works for extra seed users: `tigist@seller.et`, `dawit@seller.et`, `yonas@buyer.et`, `hanna@buyer.et`.

Seed **deletes existing marketplace rows** and recreates demo data. It refuses to run when `NODE_ENV=production` unless `FORCE_SEED=true`.

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

Fill in `backend/.env` as needed. For real Chapa TEST checkout, replace `CHAPA_SECRET_KEY` with a dashboard **Test** key (`CHASECK_TEST-…`). Leave the `xxx` placeholder only if you want mock checkout.

`GET` or `POST /api/health` should return `{ "success": true, ... }`.

### 3. Frontend — http://localhost:3000

```bash
cd web
cp .env.local.example .env.local
npm install
npm run dev
```

`web/.env.local` only needs:

```
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### API shape

Every JSON response looks like:

```json
{ "success": true, "data": {}, "message": "..." }
```

Errors add `error` when useful. Auth uses an httpOnly cookie `etm_sid` (a Bearer token still works).

---

## Features

- **Browse and search** listings by category, text, and location. Mobile-first layout (works at 375px width).
- **Accounts** — register, log in, log out. Optional **Google sign-in**. Forgot / reset password and email verify (mail is optional in local/dev).
- **Inbox** — chat about a listing with the other user (Socket.io), plus a notifications menu.
- **Sell** — sellers create listings with photos. Seller dashboard for their items and sales.
- **Buy Now** — Chapa **TEST** hosted checkout when a real test secret is set. **Mock checkout only** if the key contains `xxx`.
- **Orders** — buyer and seller see payment status (`held` / `released` / `refunded`). Seller can mark delivery confirmed; buyer can request a refund. Those buttons update **our DB**. They are **not** live escrow or automatic seller payouts.
- **KYC** — sellers upload ID + face photos. Files stay **private** (disk under `backend/private/kyc` or Cloudinary private). Admins review them in **Admin**.
- **Admin** — pending KYC, listing reports, and the same payment status tools.
- **Health** — `GET` and `POST /api/health`.

**Payments (honest)**

- Chapa test phones (from [Chapa docs](https://developer.chapa.co/docs)): `0900123456`, OTP `12345`.
- **localhost cannot receive Chapa webhooks.** After paying, the app returns to `/payments/return` and calls `POST /api/payments/sync` to verify the transaction.
- `cd backend && npm test` runs webhook-signature unit tests.

**Email (honest)**

- Gmail SMTP is optional. In non-prod, forgot-password may return `resetUrl` in the API so you can open the link without mail.
- Do not expect Gmail SMTP on Render.

---

## Usage

Open **http://localhost:3000**. Use two browsers (or a normal window + a private window) if you want buyer and seller at the same time.

### Buyer path (Sara)

1. Log in as `sara@buyer.et` / `Password123!`.
2. Home or **Browse** — open a listing (for example Samsung Galaxy A14).
3. **Inbox** / the chat on the listing — message the seller (seed data already has a short thread).
4. **Buy Now** — you leave the site for Chapa TEST checkout (or the mock page if the key still has `xxx`).
5. After pay, you return to `/payments/return`, then **Orders**. Status should move to **held** when sync succeeds.
6. On **Orders**, the buyer can **Request refund** while status is held (DB flag; Chapa refund is attempted in TEST, not a live bank recall).

### Seller path (Abebe)

1. Log in as `abebe@seller.et` / `Password123!`.
2. **Sell** — create a listing with photos, price in ETB, and location.
3. **Dashboard** — see your listings and sales.
4. **Orders** — when a payment is **held**, **Confirm delivery** marks it **released** in our database. That is **not** an automatic payout. Settle seller money in the Chapa dashboard if you need to.
5. Open **Verify** (`/verify`) — upload an ID photo and a face photo. Those files are private.

### Admin path

1. Log in as `admin@marketplace.et` / `Password123!`.
2. **Admin** — review KYC (approve or reject). Photos load only for the admin session; they are not public URLs.
3. Review listing reports on the same page.

### Optional Google sign-in

Only works if `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_CALLBACK_URL` are set in `backend/.env` and match the Google Cloud client. After Google redirects, the app exchanges a one-time code (`POST /api/auth/oauth/exchange`) so the token is not left in the URL.
