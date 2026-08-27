# SuqET

SuqET is an Ethiopian second-hand marketplace for buying and selling used goods in ETB. It is built around how trade already works on the ground — especially around Merkato and Addis Ababa — with catalog, chat, payment, and handover in one place instead of scattered DMs and cash-only deals.

Buyers browse a searchable catalog (photos, condition, category, location), save listings, and open a conversation with the seller. Chat is live: ask about the item, make a price offer, and agree on meetup or delivery. When they are ready, they can pay in-app with **Buy now** through Chapa. Funds are held until the seller confirms handover — an escrow-style hold, not an instant payout. After a completed purchase, buyers can leave a review.

Sellers list items with photos, price, and meetup or delivery options, then run the rest from a dashboard: listings, conversations, and orders. Admin reviews seller KYC (ID and face photos) and listing reports so the marketplace stays usable.

| | |
|---|---|
| App | [ethiopian-marketplace-opal.vercel.app](https://ethiopian-marketplace-opal.vercel.app) |
| API | [suqet-api.onrender.com](https://suqet-api.onrender.com) (`GET /api/health`) |

## Table of Contents

- [Features](#-features)
- [Architecture](#-architecture)
- [Quick Start](#-quick-start)
- [Project Structure](#-project-structure)
- [API Endpoints](#-api-endpoints)
- [Authentication](#-authentication)
- [Database](#-database)
- [Contributing](#-contributing)
- [License](#-license)

## ✨ Features

- Searchable catalog in ETB — photos, condition, category, location, meetup or delivery
- **Buy now** — pay for a listing directly through Chapa; funds are held until the seller confirms delivery
- Real-time chat (Socket.io) — typing indicators, Seen receipts, and online presence
- Price offers on a listing, tied to the same conversation
- Saved listings and public seller profiles
- Reviews after a completed purchase
- Seller KYC (ID and face photos) and listing reports — reviewed in Admin
- Seller dashboard for listings, conversations, and orders
- Mobile-first UI (English, with Amharic in catalog copy and a header language control)

## 🏗️ Architecture

Two folders. All secrets live on the API — never in `web/` or on Vercel.

```
Browser (Next.js, Vercel)
        │  REST + Socket.io
        ▼
Express API (Render)
        ├── PostgreSQL (Prisma)
        ├── Cloudinary (listing photos)
        └── Chapa (Buy now)
```

| Folder | Stack |
|--------|--------|
| `web/` | Next.js 14 App Router + Tailwind + TypeScript. Only public env: `NEXT_PUBLIC_API_URL`. |
| `backend/` | Express + TypeScript + Prisma + PostgreSQL + Socket.io + JWT + Cloudinary + Chapa. |

Every JSON response:

```json
{ "success": true, "data": {}, "message": "..." }
```

Errors may include `error`.

Live split: the Next.js app is on Vercel; the API and Postgres are on Render (`render.yaml` deploys `suqet-db` + `suqet-api` only).

## 🚀 Quick Start

Requires **Node.js 18.17+**, npm, and Docker (Postgres). Never commit `.env` or `.env.local`.

```bash
git clone https://github.com/kikemal/ethiopian-marketplace.git
cd ethiopian-marketplace
docker compose up -d
```

**API** — http://localhost:4000

```bash
cd backend
cp .env.example .env
npm install
npx prisma migrate dev
npm run seed
npm run dev
```

Fill `backend/.env` with `DATABASE_URL`, `JWT_SECRET`, and your Cloudinary / Chapa keys. Do not put those keys in `web/`.

**Web** — http://localhost:3000

```bash
cd web
cp .env.local.example .env.local
npm install
npm run dev
```

Set `NEXT_PUBLIC_API_URL` to the API origin (default `http://localhost:4000`). Health: `GET /api/health`.

## 📁 Project Structure

```
ethiopian-marketplace/
├── docker-compose.yml          # Local PostgreSQL 16
├── render.yaml                 # Render blueprint (API + Postgres)
├── web/                        # Next.js 14 App Router
│   ├── app/
│   │   ├── page.tsx            # Home
│   │   ├── listings/           # Browse, detail, edit
│   │   ├── new/  sell/         # Create a listing
│   │   ├── chat/  inbox/       # Conversations
│   │   ├── orders/             # Buy now history
│   │   ├── saved/              # Saved listings
│   │   ├── sellers/[id]/       # Public seller profile
│   │   ├── dashboard/          # Seller dashboard
│   │   ├── admin/              # KYC + reports
│   │   ├── verify/             # Seller KYC upload
│   │   ├── account/            # Profile
│   │   ├── auth/               # Login, register, OAuth, password
│   │   ├── payments/           # Chapa return / success
│   │   └── legal/              # Terms, privacy, FAQ
│   ├── components/             # UI, chat, presence, listing cards
│   ├── lib/                    # API client, auth, socket
│   └── types/                  # Shared TypeScript types
└── backend/
    ├── prisma/                 # schema.prisma + migrations
    └── src/
        ├── server.ts           # Express + Socket.io bootstrap
        ├── socket.ts           # Typing, Seen, online presence
        ├── routes/             # HTTP mounts under /api
        ├── controllers/
        ├── middleware/         # JWT, roles, rate limits
        ├── models/             # Prisma client
        ├── types/              # Shared TypeScript types
        └── utils/              # Chapa, Cloudinary, mail, upload
```

## 🔌 API Endpoints

Prefix: `/api`. Auth column: public, JWT, or role-gated.

### Health

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/health` | Public | Liveness |

### Auth

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/auth/providers` | Public | Available login providers |
| POST | `/api/auth/register` | Public | Create account (`buyer` or `seller`) |
| POST | `/api/auth/login` | Public | Email + password |
| POST | `/api/auth/logout` | Public | Clear session |
| GET | `/api/auth/me` | Optional | Current user |
| PATCH | `/api/auth/me` | JWT | Update profile |
| POST | `/api/auth/forgot-password` | Public | Password reset request |
| POST | `/api/auth/reset-password` | Public | Apply reset token |
| POST | `/api/auth/verify-email` | Public | Confirm email token |
| POST | `/api/auth/resend-verification` | Public | Resend confirmation |
| GET | `/api/auth/google` | Public | Start Google OAuth |
| GET | `/api/auth/google/callback` | Public | Google OAuth callback |
| POST | `/api/auth/oauth/exchange` | Public | Exchange OAuth code for session |

### Listings

Query on list/search: `page`, `limit`, `query`, `category_id`, `condition` (`new` \| `like_new` \| `good` \| `fair`), `location`, `min_price`, `max_price`, `sort` (`newest` \| `price_asc` \| `price_desc`).

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/listings` | Public | Paginated catalog |
| GET | `/api/listings/categories` | Public | Categories |
| GET | `/api/listings/:id` | Public | Listing detail |
| GET | `/api/listings/:id/similar` | Public | Similar listings |
| GET | `/api/listings/:id/offers` | Public | Offers on a listing |
| POST | `/api/listings` | seller, admin | Create (multipart, up to 5 images) |
| PUT | `/api/listings/:id` | owner / admin | Update |
| DELETE | `/api/listings/:id` | owner / admin | Remove |
| POST | `/api/listings/:id/offer` | JWT | Make an offer |
| POST | `/api/listings/:id/save` | JWT | Save listing |
| DELETE | `/api/listings/:id/save` | JWT | Unsave listing |
| GET | `/api/search` | Public | Full-text search (`query` or `q`) |

### Marketplace

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/sellers/:id` | Public | Public seller profile + reviews |
| GET | `/api/saved` | JWT | Saved listings |
| POST | `/api/reviews` | JWT | Review after a completed purchase |

### Chat

Conversations are per listing with the seller. `GET /api/messages/:listing_id` requires `?with=<userId>`.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/messages` | JWT | Send a message |
| POST | `/api/messages/:listing_id` | JWT | Send a message on a listing |
| GET | `/api/messages/:listing_id` | JWT | Conversation (`?with=`) |
| GET | `/api/conversations` | JWT | Inbox |
| GET | `/api/unread-messages` | JWT | Unread count |
| GET | `/api/notifications` | JWT | In-app notifications |
| PATCH | `/api/notifications/:id/read` | JWT | Mark notification read |
| GET | `/api/dashboard` | seller, admin | Seller dashboard |

### Payments (Buy now)

No cart. Initialize against a listing; Chapa holds funds until release.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/payments/initialize` | JWT | Start Chapa checkout |
| POST | `/api/payments/sync` | JWT | Sync status after return |
| GET | `/api/payments/mine` | JWT | My transactions |
| POST | `/api/payments/release/:transaction_id` | JWT | Seller confirms delivery |
| POST | `/api/payments/refund/:transaction_id` | JWT | Refund a held payment |
| GET/POST | `/api/payments/callback` | Chapa | Checkout callback |
| GET/POST | `/api/payments/verify` | Chapa | Webhook / verify |

### Reports & KYC

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/reports` | JWT | Report a listing or user |
| GET | `/api/reports` | admin | List reports |
| PATCH | `/api/reports/:id` | admin | Resolve / dismiss |
| POST | `/api/verifications/submit` | JWT | Submit ID + face photos |
| GET | `/api/verifications/pending` | admin | Pending KYC |
| GET | `/api/verifications/:id/images/:kind` | admin | Stream KYC image |
| PATCH | `/api/verifications/:id/review` | admin | Approve / reject KYC |

### WebSocket (Socket.io)

JWT required (`auth.token`, `Authorization: Bearer`, or `etm_sid` cookie). Client connects to the API origin.

**Client → server**

| Event | Payload |
|-------|---------|
| `user_online` | — |
| `join_room` | `{ listingId, peerId }` |
| `typing` | `{ listingId, peerId }` |
| `stop_typing` | `{ listingId, peerId }` |
| `mark_read` | `{ messageId?, listingId, peerId }` |

**Server → client**

| Event | Meaning |
|-------|---------|
| `receive_message` | New chat message |
| `notification` | In-app notification |
| `messages_read` | Peer marked messages Seen |
| `unread_count` | `{ unread }` |
| `online_users` | Currently online user IDs |
| `user_online` / `user_offline` | Presence change |
| `user_typing` / `user_stop_typing` | Typing indicator |

Messages themselves are sent over REST (`POST /api/messages`); the socket layer fans them out as `receive_message`.

## 🔐 Authentication

- JWT signed with `JWT_SECRET` (default expiry 7 days).
- Send `Authorization: Bearer <token>` or rely on the httpOnly `etm_sid` cookie (`credentials: 'include'`).
- Roles: `buyer`, `seller`, `admin`. Listing create and the seller dashboard require `seller` or `admin`.
- Google OAuth is available when Google credentials are configured on the API (`GET /api/auth/google`).

## 🗄️ Database

PostgreSQL via Prisma (`backend/prisma/schema.prisma`). Local: `docker compose up -d` (database `ethiopian_marketplace` on port 5432).

| Model | Role |
|-------|------|
| `User` | `buyer` / `seller` / `admin`; optional Google id |
| `Category` | Nested catalog categories |
| `Listing` | Title, ETB price, condition, meetup/delivery, status |
| `Image` | Listing photos (Cloudinary URLs) |
| `Message` | Chat + offers (`text` \| `offer`) |
| `Transaction` | Buy now — `pending` → `held` → `released` / `refunded` / `failed` |
| `Review` | One review per listing per buyer after purchase |
| `SavedListing` | User ↔ listing saves |
| `Report` | Listing or user reports |
| `Verification` | Seller KYC (`pending` / `approved` / `rejected`) |
| `Notification` | In-app events (messages, offers, payments, KYC) |

Also: `PasswordResetToken`, `EmailVerificationToken`, `OAuthExchangeCode`.

## 🤝 Contributing

1. Fork the repo and create a branch.
2. Stay in the owning folder (`web/` or `backend/`) for the change.
3. Mirror shared types between `backend/src/types` and `web/types`.
4. Keep API responses in `{ success, data, message }`.
5. Do not commit `.env`, `.env.local`, or secrets. Never put API keys in `web/`.
6. Open a pull request with a short description of why the change exists.

## 📄 License

ISC
