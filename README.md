# SuqET

Ethiopian second-hand marketplace — listings in **ETB**, in-app chat, and **Buy now** checkout. Built for how people already trade around Addis Ababa and Merkato. The UI is English, with Amharic in catalog copy and a header language control.

## Live demo

| | |
|---|---|
| App | [ethiopian-marketplace-opal.vercel.app](https://ethiopian-marketplace-opal.vercel.app) |
| API | [suqet-api.onrender.com](https://suqet-api.onrender.com) (`GET /api/health`) |

## Stack

Two folders. All secrets live on the API — never in `web/` or Vercel.

| Folder | Role |
|--------|------|
| `web/` | Next.js 14 App Router + Tailwind (`ethiopian-marketplace-web`). Only `NEXT_PUBLIC_API_URL`. |
| `backend/` | Express + TypeScript + Prisma + PostgreSQL + Socket.io + JWT + Cloudinary + Chapa (`ethiopian-marketplace-backend`). |

Every JSON response:

```json
{ "success": true, "data": {}, "message": "..." }
```

Errors may include `error`.

## Demo accounts

Password for every seeded account: `Password123!`

| Role | Email |
|------|-------|
| Seller | `abebe@seller.et` |
| Seller | `tigist@seller.et` |
| Buyer | `sara@buyer.et` |
| Buyer | `yonas@buyer.et` |
| Admin | `admin@marketplace.et` |

**Admin** is under the Account menu (user icon) → **Admin**.

Suggested path: Sara → open a listing → chat → Buy now. Second window: Abebe (seller) or admin.

## Features

- Searchable listings with photos, ETB prices, meetup or delivery
- **Buy now** (no cart) through Chapa TEST; order status in the app
- Real-time chat (Socket.io): typing, Seen, online presence
- Saved listings, public seller profiles, reviews after a completed purchase
- Seller KYC (private ID and face photos) and listing reports — reviewed in Admin

## Run locally

Requires **Node.js 18.17+**, npm, and Docker (Postgres). Never commit `.env` or `.env.local`.

```bash
docker compose up -d
```

From the repo root (`ethiopian-marketplace/`).

**API** — http://localhost:4000

```bash
cd backend
cp .env.example .env
npm install
npx prisma migrate dev
npm run seed
npm run dev
```

**Web** — http://localhost:3000

```bash
cd web
cp .env.local.example .env.local
npm install
npm run dev
```

Set `NEXT_PUBLIC_API_URL` to the API origin (default `http://localhost:4000`). Do not put Chapa, Cloudinary, JWT, Google, or database secrets in `web/`.

Health: `GET /api/health`.

## Email

- **Live:** `SKIP_EMAIL_VERIFICATION=true` on Render (no custom domain). Signups can log in immediately.
- **Local:** Gmail SMTP (`SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`) can send confirmation and password-reset mail.

## Google OAuth

The callback is on the **API** (Render), not Vercel.

| | |
|---|---|
| `GOOGLE_CALLBACK_URL` | `https://suqet-api.onrender.com/api/auth/google/callback` (same URI in Google Cloud Console) |
| `FRONTEND_URL` | Vercel origin, no trailing slash: `https://ethiopian-marketplace-opal.vercel.app` |
| Vercel | Only `NEXT_PUBLIC_API_URL=https://suqet-api.onrender.com` |

## Render

Blueprint (`render.yaml`) deploys Postgres (`suqet-db`) + API (`suqet-api`) only. Next.js stays on Vercel.

- Start: `npx prisma migrate deploy && node dist/server.js`
- `SKIP_EMAIL_VERIFICATION=true` (blueprint default)
- `FORCE_SEED=true` upserts demo users on boot (listings only if the catalog is empty)
- `FRONTEND_URL` = Vercel origin; `BACKEND_PUBLIC_URL` = public API origin
