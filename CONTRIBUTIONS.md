# Work since the first clone

This file is for judges and teammates. It is written in simple English and follows **git history**, not memory. If a feature is not in git, it is not claimed here.

GitHub: https://github.com/kikemal/ethiopian-marketplace  
Branch for this work: `feat/hackathon-demo-ship` (PR https://github.com/kikemal/ethiopian-marketplace/pull/1)

---

## Timeline (`git log --reverse`)

| Date | Author (git) | Commit | What landed |
|------|----------------|--------|-------------|
| 21 Aug 2026 | kikemal | `dc2c12b` | Initial commit: team Word docs only (`GIT_WORKFLOW.md.docx`, `TEAM_ASSIGNMENTS.md.docx`, `task.md.docx`). |
| 21 Aug 2026 | kikemal | `2b3752d` | First working SuqET monorepo: Express API + Next.js UI, Prisma, Docker Postgres, seed accounts, listings, basic auth, chat API, payments, KYC submit, admin screen. |
| 21 Aug 2026 | kikemal | `e2b69fd` | Fix listings layout compile error (invalid `#` comment). This is **`main`** today. |
| 25 Aug 2026 | Obsann | `7a7dfa3` | Demo-ready work on `feat/hackathon-demo-ship`: auth (Google, cookies, reset/verify), inbox UI, private KYC, Chapa TEST checkout + sync, orders, notifications, honest teammate README. |
| 25 Aug 2026 | Obsann | `76d236d` | Judge-facing `README.md` (project, setup, features, usage only) and this separate `CONTRIBUTIONS.md` file. |

Commands used to check this: `git log --reverse --format="%h %ad %an %s" --date=short` and `git log` with dates.

There are **four** product commits before these docs. This contributor did **not** write the first three.

---

## Original clone (not this contributor)

The repo this person cloned already had a real marketplace scaffold (author **kikemal**, 21 Aug 2026):

- Two folders: `web/` (Next.js 14) and `backend/` (Express + Prisma + PostgreSQL)
- Docker Compose for Postgres
- Seed demo users (buyer / seller / admin) and sample listings
- Register and log in, browse listings, sell form, listing detail
- Basic chat API and Socket.io server
- Payments with a **mock checkout** path when Chapa was not configured
- KYC upload endpoint and an admin page
- Reports, health route, Cloudinary helper, `.env.example`

That is the starting point. The compile fix on listings layout (`e2b69fd`) is also original-clone work, not later hackathon work.

---

## After clone — this contributor (git author: Obsann)

All of the following is in **one** git commit (`7a7dfa3`, 25 Aug 2026), grouped by theme. It is hackathon / demo-ship work on top of the clone, not a rewrite of the whole app from zero.

### Auth

- Google sign-in, then a one-time **code exchange** so the session token is not stuck in the URL
- Session cookie `etm_sid` (httpOnly)
- Forgot password, reset password, verify email, resend verification
- Account page (`/account`)
- Optional SMTP helper; in non-prod the API may return the reset link if mail is not set up

### Payments (Chapa TEST, not fake live escrow)

- Real **Chapa TEST** checkout when `CHAPA_SECRET_KEY` is a dashboard test key (`CHASECK_TEST-…`)
- **Mock checkout only** if the key still contains `xxx` (placeholder). The mock marks a row held in our DB; it is not a bank transfer
- Return page `/payments/return` plus `POST /api/payments/sync`, because **localhost cannot receive Chapa webhooks**
- Orders page; seller/admin can mark **released** in our DB; buyer/admin can request **refund**. Released is **not** an automatic payout to the seller
- Webhook signature unit tests (`backend/src/utils/chapa.test.ts`)

### Chat and notifications

- Inbox list and per-listing chat UI (`ListingChat`)
- Socket.io rooms wired to the logged-in user
- Notifications menu in the nav

### KYC (private)

- ID and face photos stored **privately** (disk under `backend/private/kyc` or Cloudinary private), not as public listing images
- Admin UI loads those images with the admin session; approve / reject review

### Demo polish

- Phone-friendly nav: Browse, Inbox, Orders, Sell/Dashboard, Admin
- Health accepts **POST** and GET
- Seed uses local placeholder images (no Unsplash)
- Extra Prisma migrations (payment locks, OAuth/reset tokens, notifications, email verified)
- First teammate README (honest about TEST vs mock, escrow, SMTP)

### These docs (kept separate from the judge README)

- `README.md` is **only** for hackathon judges: Project, Setup, Features, Usage. It does **not** contain this clone-to-now history.
- This `CONTRIBUTIONS.md` file is the journey from the first clone onward.

---

## What we are not claiming

- Live escrow or automatic seller payouts
- A hosted demo URL (none is in the repo yet — the README has a placeholder)
- Production email on Render
- The original monorepo, seed listings, or the 21 Aug listings-layout fix (those commits are **kikemal**)

Until PR #1 is merged, judges should look at branch `feat/hackathon-demo-ship`, not only `main`.
