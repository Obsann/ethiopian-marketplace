# SuqET — Ethiopian Second-Hand Marketplace

Monorepo with `web/` (Next.js 14) and `backend/` (Express + Prisma + PostgreSQL).

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
npx prisma migrate dev --name init
npm run seed
npm run dev
```
API: http://localhost:4000 — `POST /api/health` should return `{ success: true }`.

### 3. Frontend
```bash
cd web
cp .env.local.example .env.local
npm install
npm run dev
```
App: http://localhost:3000

## Demo accounts (after seed)
| Role   | Email                 | Password      |
|--------|-----------------------|---------------|
| Admin  | admin@marketplace.et  | Password123!  |
| Seller | abebe@seller.et       | Password123!  |
| Buyer  | sara@buyer.et         | Password123!  |

## Env secrets
Keep Chapa, Cloudinary, JWT, and `DATABASE_URL` in `backend/.env` only — never in `web/`.
Without a real Chapa key, Buy Now uses a mock checkout page.
