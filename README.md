# SuqET — Ethiopian Second-Hand Marketplace

Monorepo with `web/` (Next.js 14) and `backend/` (Express + Prisma + PostgreSQL).
Listings, users, and categories come from live PostgreSQL — there is no demo seed.

## Quick start

### 1. Database
```bash
docker compose up -d
```

### 2. Backend
```bash
cd backend
cp .env.example .env   # already present for local dev
npm install
npx prisma migrate deploy
npm run dev
```
API: http://localhost:4001 (or `PORT` in `backend/.env`) — `GET /api/health` should return `{ success: true }`.

Register a seller in the app, then create listings. Categories are inserted by migration if missing.

### 3. Frontend
```bash
cd web
cp .env.local.example .env.local
npm install
npm run dev
```
App: http://localhost:3000

Set `NEXT_PUBLIC_API_URL` to the same host and port as the backend.

## Env secrets
Keep Chapa, Cloudinary, JWT, and `DATABASE_URL` in `backend/.env` only — never in `web/`.
Without a real Chapa key, Buy Now uses a mock checkout page.
