# M-TRAVEL

An enterprise travel marketplace for Kenya — vehicle hire, bus reservations, tours, and
holiday homes on one platform, with M-Pesa built in.

This repo is a **working scaffold**, not a finished product: the core booking flow
(auth → search → book → owner accepts → wallet payout) is fully implemented end-to-end
on both frontend and backend. The remaining modules from the original spec (buses,
tours, holiday homes, notifications, payments providers, admin dashboard) are **modeled
in the database and documented**, but not yet wired up — see "What's implemented" below
before you demo this to anyone.

```
m-travel/
├── backend/    NestJS API (auth, vehicles, bookings, wallet, reviews)
├── frontend/   React + Vite + Tailwind client
└── docs/       API and architecture notes
```

## Quick start

### 1. Database
Create a free [Supabase](https://supabase.com) Postgres project (or point at any
Postgres instance) and copy the connection string.

### 2. Backend
```bash
cd backend
cp .env.example .env        # fill in DATABASE_URL at minimum
npm install
npx prisma migrate dev --name init
npm run start:dev           # http://localhost:4000/api/v1
```
Swagger docs: `http://localhost:4000/api/v1/docs`

### 3. Frontend
```bash
cd frontend
cp .env.example .env        # VITE_API_URL should point at the backend above
npm install
npm run dev                 # http://localhost:5173
```

## What's implemented

**Backend (NestJS + Prisma + PostgreSQL)**
- JWT auth (access + refresh tokens, argon2 password hashing, refresh-token
  rotation stored hashed in the DB)
- Role-based access control (`@Roles()` + guards) across `TRAVELER`,
  `VEHICLE_OWNER`, `ADMIN`, etc.
- Vehicles: create/update/delete, public search with type/price filters and
  nearby-search (Haversine distance)
- Bookings: create → owner accept/reject → traveler cancel, with auto-computed
  pricing from date range
- Wallet: balance, transaction ledger, withdrawal requests
- Reviews: tied to completed bookings, auto-recalculates vehicle rating
- Security: helmet, global rate limiting, strict input validation
  (`whitelist` + `forbidNonWhitelisted`), centralized error handling, Swagger docs

**Frontend (React + TypeScript + Vite + Tailwind + Framer Motion + React Three Fiber)**
- Home, Services, Our Team, and Contact pages
- Login / Register wired to the API, with token refresh handled automatically
  by the axios interceptor
- Vehicle search with filters, vehicle detail + booking flow with live price
  calculation
- Traveler dashboard (my bookings, cancel), owner dashboard (accept/reject
  requests), wallet page (balance, history, withdraw)
- A 3D "route network" globe (`react-three-fiber`) in the hero section as the
  platform's signature visual — real destinations-and-routes geometry, not a
  generic spinning shape
- Design system: custom Tailwind tokens (`ink` / `marigold` / `teal` / `bone`
  / `coral`) built around a "journey" motif rather than default theme colors

## What's *not* implemented yet

These are modeled in `backend/prisma/schema.prisma` so the data shape won't
need to change, and each has a `README.md` in its module folder explaining
exactly how to build it out:

| Area | Status |
|---|---|
| Bus reservations | DB modeled, API stubbed — `backend/src/modules/buses/README.md` |
| Tours & travel | DB modeled, API stubbed — `backend/src/modules/tours/README.md` |
| Holiday homes | DB modeled, API stubbed — `backend/src/modules/homes/README.md` |
| Notifications (Push/SMS/Email) | DB modeled, API stubbed — `backend/src/modules/notifications/README.md` |
| Payments (M-Pesa, Stripe, PayPal) | DB modeled, API stubbed — `backend/src/modules/payments/README.md` |
| Admin dashboard | DB modeled, API stubbed — `backend/src/modules/admin/README.md` |
| Phone OTP / Google login / 2FA | Placeholders noted in `auth.controller.ts` |
| Google Maps live tracking | Not started — vehicle search currently uses raw lat/lng, no map UI |
| Unit / integration / E2E tests | Not started |
| CI/CD pipelines | Not started |

## Deployment (once you're ready)
- **Frontend** → Vercel (`frontend/`, framework preset: Vite)
- **Backend** → Railway or any Docker host (`backend/Dockerfile` included)
- **Database** → Supabase Postgres

## Tech stack
React 18 · TypeScript · Vite · TailwindCSS · Framer Motion · React Three Fiber ·
Redux Toolkit · React Query · NestJS · Prisma · PostgreSQL · JWT · Swagger
