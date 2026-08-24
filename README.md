# SuqET — Ethiopian Second-Hand Marketplace

SuqET is a hackathon marketplace for buying and selling used goods in Ethiopia. Browse listings, chat with the other person, pay with Chapa TEST checkout, and (as admin) review KYC.

## Two folders

| Folder | What it is |
|--------|------------|
| `web/` | Next.js 14 app (UI). **No secret keys.** Only `NEXT_PUBLIC_API_URL`. |
| `backend/` | Express API (Prisma, PostgreSQL, JWT, Chapa, Cloudinary, SMTP). **All secrets live in `backend/.env`.** |

Copy `backend/.env.example` → `backend/.env`. Copy `web/.env.local.example` → `web/.env.local`. Never commit `.env` files.

## Demo accounts

After seed, password for all of these is `Password123!`:

| Role | Email |
|------|--------|
| Buyer | `sara@buyer.et` |
| Seller | `abebe@seller.et` |
| Admin | `admin@marketplace.et` |

## How to run locally

**1. Postgres (Docker)**

```bash
docker compose up -d
```

**2. Backend** — http://localhost:4000

```bash
cd backend
cp .env.example .env
npm install
npx prisma migrate dev
npm run seed
npm run dev
```

`POST /api/health` (and `GET`) should return `{ success: true, ... }`.

**3. Frontend** — http://localhost:3000

```bash
cd web
cp .env.local.example .env.local
npm install
npm run dev
```

## API shape

Every response looks like:

```json
{ "success": true, "data": {}, "message": "..." }
```

Errors add `error` when useful. Auth uses an httpOnly cookie `etm_sid` (Bearer token still works).

## Payments (Chapa)

- With a real **Chapa TEST** secret (`CHASECK_TEST-…` from the dashboard, Test mode ON), Buy Now opens **Chapa TEST checkout**.
- Mock checkout is used **only** if the key contains `xxx` (the placeholder in `.env.example`). That mock only marks the row held in our DB — it is not a bank transfer.
- Chapa test phones (from [their docs](https://developer.chapa.co/docs)): `0900123456`, OTP `12345`.
- **localhost cannot receive Chapa webhooks.** After paying, the app returns to `/payments/return` and calls `POST /api/payments/sync` to verify the transaction.
- Admin can mark a payment **released** in our DB. That is **not** live escrow and **not** an automatic payout to the seller. Settle seller money in the Chapa dashboard if you need to.

`cd backend && npm test` runs webhook-signature unit tests.

## Email

- Gmail SMTP is optional and often flaky (App Password, port 587 or 465, `SMTP_FROM` must be that same Gmail).
- In **non-prod**, forgot-password may return `resetUrl` in the API so you can open the link without mail.
- Resend (or similar) needs a **domain you own**, not `*.vercel.app`.
- Render blocks outbound SMTP. For a hosted demo, switch to an HTTP mailer later — do not expect Gmail SMTP on Render.

## KYC

ID photos are **private** (disk under `backend/private/kyc` or Cloudinary private). They are not public listing images. Admins review them in the admin UI.

## Seed (wipes data)

```bash
cd backend && npm run seed
```

This **deletes existing marketplace rows** and reseeds demo users, listings, and local placeholder images (no Unsplash). It refuses to run when `NODE_ENV=production` unless `FORCE_SEED=true`.

## For teammates — what we shipped

Short list of what is in this branch (simple English):

- **Nav** that works on a phone: Browse, Inbox, Orders, Sell/Dashboard (sellers), Admin.
- **Inbox** — chat on a listing with the other user (Socket.io).
- **Google sign-in** — OAuth callback then a one-time **code exchange** (`POST /api/auth/oauth/exchange`) so the token is not stuck in the URL.
- **Private KYC** uploads; session cookie **`etm_sid`**.
- **Chapa TEST** checkout; return page + **`/api/payments/sync`** because localhost has no webhooks. Mock only if the key has `xxx`.
- **Health** accepts **POST** (and GET) at `/api/health`.
- Forgot / reset password, verify email, notifications menu, orders page.

Not in this demo: live escrow, automatic seller payouts, or production email on Render.
