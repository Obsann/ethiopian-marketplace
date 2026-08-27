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
- [Features and API endpoints](#-features-and-api-endpoints)
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

## 🔌 Features and API endpoints

Prefix: `/api`. Auth: public, JWT, or role-gated (`seller` / `admin`).

### Health

Operators and the hosted app ping this route to confirm the API is up. It is the same check used in production (`GET /api/health` on Render).

- `GET /api/health` — public, liveness
- `POST /api/health` — public, same as GET

### Auth

A person joins as a **buyer** or **seller** with email and password, or continues with Google when that provider is configured. They can update their profile, recover a forgotten password, and confirm their email from a link. The session is a JWT, sent as `Authorization: Bearer` or the httpOnly `etm_sid` cookie. Logout clears it.

- `GET /api/auth/providers` — public, available login providers
- `POST /api/auth/register` — public, create account (`buyer` or `seller`)
- `POST /api/auth/login` — public, email + password
- `POST /api/auth/logout` — public, clear session
- `GET /api/auth/me` — optional auth, current user
- `PATCH /api/auth/me` — JWT, update profile
- `POST /api/auth/forgot-password` — public, password reset request
- `POST /api/auth/reset-password` — public, apply reset token
- `POST /api/auth/verify-email` — public, confirm email token
- `POST /api/auth/resend-verification` — public, resend confirmation
- `GET /api/auth/google` — public, start Google OAuth
- `GET /api/auth/google/callback` — public, Google OAuth callback
- `POST /api/auth/oauth/exchange` — public, exchange OAuth code for session

### Listings

Buyers browse a searchable catalog in ETB — photos, condition, category, location, meetup or delivery — and open a listing for detail, similar items, and any price offers. Sellers (or admins) post an item with up to five photos, then edit or remove their own listings from the dashboard. A signed-in buyer can save a listing for later or send a price offer, which is tied to the same conversation as chat.

List and search accept `page`, `limit`, `query` (search also accepts `q`), `category_id`, `condition` (`new` | `like_new` | `good` | `fair`), `location`, `min_price`, `max_price`, and `sort` (`newest` | `price_asc` | `price_desc`).

- `GET /api/listings` — public, paginated catalog
- `GET /api/listings/categories` — public, categories
- `GET /api/listings/:id` — public, listing detail
- `GET /api/listings/:id/similar` — public, similar listings
- `GET /api/listings/:id/offers` — public, offers on a listing
- `POST /api/listings` — seller or admin, create (multipart, up to 5 images)
- `PUT /api/listings/:id` — owner or admin, update
- `DELETE /api/listings/:id` — owner or admin, remove
- `POST /api/listings/:id/offer` — JWT, make an offer
- `POST /api/listings/:id/save` — JWT, save listing
- `DELETE /api/listings/:id/save` — JWT, unsave listing
- `GET /api/search` — public, full-text search

### Marketplace

Before buying, a person can open a seller's public profile — active listings, ratings, and reviews — to see who they are dealing with. They keep a personal list of saved listings and return to it when they are ready to message or pay. After a purchase is completed (payment released), the buyer can leave one review for that listing.

- `GET /api/sellers/:id` — public, seller profile + reviews
- `GET /api/saved` — JWT, saved listings
- `POST /api/reviews` — JWT, review after a completed purchase

### Chat

Each listing has a conversation with the seller: questions about the item, price offers, and agreeing on meetup or delivery. Both sides use an inbox of those threads; unread counts and in-app notifications keep them current. Sellers (and admins) also get a dashboard that brings listings, conversations, and orders together. Messages are posted over REST; Socket.io fans them out live (typing, Seen, presence).

`GET /api/messages/:listing_id` requires `?with=<userId>`.

- `POST /api/messages` — JWT, send a message
- `POST /api/messages/:listing_id` — JWT, send a message on a listing
- `GET /api/messages/:listing_id` — JWT, conversation (`?with=`)
- `GET /api/conversations` — JWT, inbox
- `GET /api/unread-messages` — JWT, unread count
- `GET /api/notifications` — JWT, in-app notifications
- `PATCH /api/notifications/:id/read` — JWT, mark notification read
- `GET /api/dashboard` — seller or admin, seller dashboard

### Payments (Buy now)

When they are ready, the buyer pays for that listing in-app through Chapa. Funds are held until the seller confirms handover — an escrow-style hold, not an instant payout. The seller then marks the payment released; the buyer or an admin can refund a held payment, which puts the listing back on the market. Both sides can see their transactions. Chapa confirms checkout via callback and verify routes.

- `POST /api/payments/initialize` — JWT, start Chapa checkout
- `POST /api/payments/sync` — JWT, sync status after return
- `GET /api/payments/mine` — JWT, my transactions
- `POST /api/payments/release/:transaction_id` — JWT, seller confirms delivery
- `POST /api/payments/refund/:transaction_id` — JWT, refund a held payment
- `GET` / `POST /api/payments/callback` — Chapa checkout callback
- `GET` / `POST /api/payments/verify` — Chapa webhook / verify

### Reports & KYC

Sellers submit ID and face photos so admin can verify them before they are treated as trusted on the marketplace. Anyone signed in can report a listing or a user. Admins review pending KYC (including the uploaded images) and open reports, then approve, reject, resolve, or dismiss.

- `POST /api/reports` — JWT, report a listing or user
- `GET /api/reports` — admin, list reports
- `PATCH /api/reports/:id` — admin, resolve / dismiss
- `POST /api/verifications/submit` — JWT, submit ID + face photos
- `GET /api/verifications/pending` — admin, pending KYC
- `GET /api/verifications/:id/images/:kind` — admin, stream KYC image
- `PATCH /api/verifications/:id/review` — admin, approve / reject KYC

### WebSocket (Socket.io)

While a conversation is open, both people see typing indicators, online presence, and Seen receipts without refreshing. New messages, notifications, and unread counts arrive on the same connection. The client connects to the API origin with a JWT (`auth.token`, `Authorization: Bearer`, or `etm_sid` cookie). Messages themselves are sent over REST (`POST /api/messages`); the socket layer fans them out as `receive_message`.

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
