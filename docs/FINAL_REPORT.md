# Demandly — Final Project Report

**Date:** 2026-07-08  
**Author:** Mohankumar Hegde  
**Status:** Complete (ready for delivery)

---

## 1. Executive Summary

Demandly is a **reverse buying eCommerce platform** that flips traditional retail. Consumers aggregate demand by product and location; once a threshold is met, verified manufacturers compete in a reverse auction — lowest bid wins. The platform comprises three applications:

| App | Technology | Status |
|-----|-----------|--------|
| **Backend API** | Node.js · Express 5 · TypeScript · Prisma 7 · PostgreSQL · Redis | ✅ Functional |
| **Web Frontend** | Next.js 15 · React 19 · TypeScript · Zustand · CSS Modules | ✅ Functional |
| **Mobile App** | Flutter · Dart · Clean Architecture | ✅ Functional |

---

## 2. Core Features Delivered

### Consumer
- Account registration (email + OTP) with Google OAuth
- Product browsing and demand interest creation (quantity, price limit, pincode)
- Real-time demand pool status tracking
- Order management with live shipping status
- COD-based payment integration (Razorpay)
- Annual subscription model for daily essentials

### Manufacturer
- Registration with admin-verified onboarding
- Product catalog management & proposals
- Reverse auction bidding with real-time feedback (leading / outbid)
- Order fulfilment pipeline (accept → pack → ship → deliver)
- Analytics dashboard (sales, bids, revenue)

### Admin
- User & manufacturer verification portal
- Product & proposal approval workflows
- Demand pool monitoring & manual intervention
- Platform settings management
- Flash event creation and management

### Platform Mechanics
- **Demand Aggregation Engine** — Pincode-based clustering, configurable thresholds
- **Reverse Auction Resolver** — Cron-based auto-closure, lowest-bid-wins logic
- **Notification System** — Firebase push notifications on bid updates, order status
- **Geocoding** — Pincode-to-coordinates mapping for local fulfilment

---

## 3. Architecture Overview

```
┌──────────────┐     ┌──────────────┐     ┌─────────────┐
│  Next.js 15  │     │  Flutter App │     │  Admin UI   │
│  (Web App)   │     │  (Mobile)    │     │  (Web)      │
└──────┬───────┘     └──────┬───────┘     └──────┬──────┘
       │                    │                    │
       └────────────┬───────┘────────────────────┘
                    │  REST API (HTTPS)
              ┌─────▼─────────────────────────┐
              │  Express 5 + TypeScript        │
              │  ├── Auth (JWT + Refresh)      │
              │  ├── Zod Validation            │
              │  ├── Rate Limiting             │
              │  ├── Error Handler             │
              │  ├── Request Tracing (x-req-id)│
              │  └── Structured Logging        │
              └──────────┬────────────────────┘
                         │
           ┌─────────────┼──────────────┐
           │             │              │
    ┌──────▼──────┐ ┌────▼────┐ ┌───────▼──────┐
    │ PostgreSQL  │ │  Redis  │ │   AWS S3     │
    │ (Prisma 7)  │ │ (Cache) │ │ (File Store) │
    └─────────────┘ └─────────┘ └──────────────┘
```

---

## 4. Security & Infrastructure Hardening (Sprint Log)

The following improvements were implemented during the final sprint:

| # | Improvement | Status |
|---|-------------|--------|
| 1 | **Env Schema Validation** — Zod validates all env vars at boot; fails fast with clear errors | ✅ |
| 2 | **Remove Hardcoded Secrets** — No default fallback for `MASTER_API_KEY` or `JWT_SECRET` | ✅ |
| 3 | **JWT Hardening** — 15-min access tokens + HttpOnly refresh tokens + `/auth/refresh` + `/auth/logout` | ✅ |
| 4 | **Zod Input Validation** — All protected routes validate request body/params via `validate()` middleware | ✅ |
| 5 | **Centralized Error Handling** — Structured `{ error: { code, message, details?, requestId } }` responses | ✅ |
| 6 | **Request Tracing** — `x-request-id` middleware generates/reads UUID, attaches to `req.id` | ✅ |
| 7 | **Per-Route Rate Limiting** — Configurable rate limits per route category; bypassable in test env | ✅ |
| 8 | **Structured Logging** — Winston with JSON format, log levels, timestamps | ✅ |
| 9 | **Graceful Shutdown** — SIGTERM/SIGINT handlers close HTTP, Prisma, Redis, cron | ✅ |
| 10 | **Redis Caching Helpers** — Cache-aside utilities for frequently-read endpoints | ✅ |
| 11 | **Database Indexes** — Performance indexes on `User.email`, `DemandPool`, `Order`, `Bid` composites | ✅ |
| 12 | **Connection Pool Tuning** — Configurable via `DATABASE_POOL_SIZE` env var | ✅ |
| 13 | **Frontend API Config** — `NEXT_PUBLIC_API_URL` env var replaces hardcoded localhost | ✅ |

---

## 5. Test Results

### Backend Unit & Integration Tests
```
Total: 41 tests | Passed: 41 | Failed: 0
```

### E2E Lifecycle Tests
```
Total: 45 tests | Passed: 45 | Failed: 0
```
Covers the full lifecycle: registration → verification → demand creation → bidding → auction resolution → order fulfilment → shipping.

### Frontend Build
```
Status: Successful (0 TypeScript errors, 0 build errors)
```

---

## 6. Directory Structure

```
Demandly/
├── backend/                       # REST API Server
│   ├── prisma/                    # Database schema & migrations
│   │   └── schema.prisma          # 15 models, performance indexes
│   ├── src/
│   │   ├── config/                # Env validation (Zod) + frozen config
│   │   ├── middlewares/           # Auth, validation, rate limiter, error handler, request ID
│   │   ├── routes/                # Admin, Auth, Consumer, Manufacturer, Public
│   │   ├── schemas/               # Zod schemas for all route inputs
│   │   ├── services/              # Push notifications, email, SMS
│   │   ├── cron/                  # Auto-closure & auction resolver
│   │   ├── cache/                 # Redis cache-aside helpers
│   │   ├── utils/                 # Errors, logger, geocoding, auction resolver
│   │   └── index.ts               # Express app entry point
│   ├── tests/                     # E2E tests, load tests, utilities
│   ├── .env.example               # All env vars documented
│   ├── Dockerfile                 # Docker build
│   └── docker-compose.yml         # PostgreSQL + Redis stack
│
├── demandly-app/                  # Next.js Web Frontend
│   ├── src/
│   │   ├── app/                   # App Router pages & layouts
│   │   ├── components/ui/         # Reusable visual components
│   │   ├── stores/                # Zustand state management
│   │   └── lib/                   # API client, utilities
│   ├── public/                    # Static assets
│   └── .env.example               # Frontend env vars
│
├── Demandly-mobile-main/          # Flutter Mobile App (git-ignored)
│   ├── lib/features/              # Clean architecture feature modules
│   └── ...
│
├── docs/                          # Project documentation
│   ├── FINAL_REPORT.md            # This file
│   ├── IMPROVEMENTS.md            # 41-item code review findings
│   ├── EXECUTION_PLAN.md          # 6-week, 96-point implementation plan
│   └── CREDENTIALS.md             # Test account credentials (git-ignored)
│
└── README.md                      # Quick-start guide
```

---

## 7. How to Run

### Prerequisites
- Node.js v18+
- PostgreSQL instance
- Redis instance

### Backend
```bash
cd backend
cp .env.example .env          # Fill in your values
npm install
npx prisma migrate dev        # Apply DB migrations
npx prisma db seed            # Seed initial data (admin user, categories)
npm run dev                   # Starts on PORT (default 5000)
```

### Frontend
```bash
cd demandly-app
cp .env.example .env.local    # Fill in your values
npm install
npm run dev                   # Starts on port 3000
```

### Run Tests
```bash
cd backend
npm test                      # 41 unit/integration tests
npm run test:e2e              # 45 E2E lifecycle tests
```

---

## 8. Known Limitations & Future Work

These items were identified but **not implemented** in this phase. They are documented in [IMPROVEMENTS.md](./IMPROVEMENTS.md) and [EXECUTION_PLAN.md](./EXECUTION_PLAN.md):

| Category | Items |
|----------|-------|
| **Architecture** | Consolidate duplicate auth middleware, Prisma extension side effects refactor, API versioning (`/api/v1/`) |
| **Data Integrity** | Soft deletes, audit log model, idempotency keys for payments |
| **Frontend** | TanStack Query migration, error boundaries, skeleton loaders, accessibility audit, i18n |
| **DevOps** | Multi-stage Docker, CI/CD pipeline (GitHub Actions), monitoring/health checks, load testing |
| **Product** | Email notification fallback, KYC/document verification, price comparison backend |

---

## 9. Configuration Reference

### Backend Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `JWT_SECRET` | ✅ | Min 32 chars, used for token signing |
| `MASTER_API_KEY` | ✅ | API key for authenticated routes |
| `REDIS_URL` | ✅ | Redis connection string |
| `ALLOWED_ORIGINS` | ✅ | Comma-separated CORS origins |
| `PORT` | — | Server port (default: 5000) |
| `NODE_ENV` | — | `development` / `production` / `test` |
| `SENTRY_DSN` | — | Sentry error tracking |
| `FCM_SERVER_KEY` | — | Firebase push notifications |
| `SMTP_*` | — | Email service config |
| `AWS_*` | — | S3 file storage config |
| `TWILIO_*` | — | SMS (OTP) service config |
| `DISABLE_RATE_LIMIT` | — | Set `true` for testing |

### Frontend Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | ✅ | Backend API base URL |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | — | Google OAuth client ID |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | — | Razorpay payment gateway key |
| `NEXT_PUBLIC_MASTER_API_KEY` | — | API key sent in x-api-key header |

---

## 10. Accounts & Credentials

See [CREDENTIALS.md](./CREDENTIALS.md) for all test user accounts.

> ⚠️ `CREDENTIALS.md` is git-ignored and must be shared securely outside version control.

---

*End of Report*
