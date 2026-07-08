# Demandly - Improvement Suggestions

*Generated during code review - for future implementation*

---

## 🔴 Critical (Security & Architecture)

### 1. Remove Hardcoded Secrets
**File:** `backend/src/config/index.ts:7`
```typescript
masterApiKey: process.env.MASTER_API_KEY || 'your-super-secret-master-api-key',
```
**Fix:** Remove default, enforce env var at startup with validation.

### 2. Enable API Key Authentication
**File:** `backend/src/routes/index.ts:17`
```typescript
// router.use(apiKeyAuth); // commented out
```
**Fix:** Enable middleware; ensure frontend sends `x-api-key` header.

### 3. Consolidate Duplicate Auth Middleware
**Files:** 
- `backend/src/middlewares/auth.ts`
- `backend/src/middlewares/auth.middleware.ts`
**Fix:** Merge into single file, update all imports.

### 4. Fix Prisma Extension Side Effects
**File:** `backend/src/db.ts:11-26`
```typescript
// Side effect in query extension - tight coupling
const { sendPushNotification } = require('./services/pushNotificationService');
```
**Fix:** Use event emitter / domain events pattern instead.

### 5. Replace Dynamic Require with Static Import
**File:** `backend/src/db.ts:17`
```typescript
const { sendPushNotification } = require('./services/pushNotificationService');
```
**Fix:** Use `import` or dependency injection.

### 6. Add API Versioning
**File:** `backend/src/routes/index.ts`
```typescript
// Current: /api/*
// Target: /api/v1/*
```
**Fix:** Prefix all routes with version.

---

## 🟡 High (Type Safety & Config)

### 7. Environment-Driven API URL
**File:** `demandly-app/src/lib/api.ts:8-14`
```typescript
// Hardcoded port 5000, only works on localhost
return `http://${hostname}:5000`;
```
**Fix:** Use `NEXT_PUBLIC_API_URL` env var.

### 8. Remove `any` Types
**File:** `demandly-app/src/app/page.tsx:23`
```typescript
const [data, setData] = useState<any>({...})
```
**Fix:** Define proper TypeScript interfaces.

### 9. Add Input Validation (Zod/Joi)
**All route files** - no request validation currently.
**Fix:** Add schemas for every endpoint.

### 10. Centralized Error Handling
**Fix:** Add error-handling middleware with structured error codes.

---

## 🟢 Medium (Quality & Operations)

### 11. Tighten Rate Limiting
**File:** `backend/src/index.ts:41-46`
```typescript
max: 5000, // too permissive
```
**Fix:** Per-route limits (auth: 10/min, API: 100/min).

### 12. Structured Logging
**Files:** `backend/src/utils/logger.ts`, `backend/src/index.ts:13`
**Fix:** Replace `console.log` with pino/winston + log levels.

### 13. JWT Security Hardening
**File:** `backend/src/routes/auth.ts:11`
```typescript
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-dev';
```
**Fix:** Enforce env var; use short expiry (15m) + refresh tokens.

### 14. Local Assets Instead of External Images
**File:** `demandly-app/src/app/page.tsx:126-129`
```typescript
'https://images.unsplash.com/photo-...' // external dependency
```
**Fix:** Use `next/image` with local optimized assets.

### 15. Docker Improvements
**File:** `backend/Dockerfile`
**Fix:** Multi-stage build, non-root user, healthcheck.

---

## 📋 Low (Nice to Have)

| Area | Action |
|------|--------|
| **Testing** | Add Vitest/Jest unit tests with mocked Prisma |
| **CI/CD** | GitHub Actions: lint, typecheck, test, build |
| **API Docs** | OpenAPI/Swagger generation from route handlers |
| **Env Validation** | Zod schema for all env vars at startup |
| **Refresh Tokens** | Implement token rotation + revocation |
| **Monitoring** | Add health check endpoint with DB/Redis checks |

---

## 📁 Files to Create/Modify

```
docs/
  IMPROVEMENTS.md           ← this file
  ARCHITECTURE.md           ← (future) system design docs
  API_SPEC.md               ← (future) OpenAPI spec
backend/
  src/
    config/
      index.ts              ← add env validation
      env.schema.ts         ← (new) Zod schema
    middlewares/
      auth.ts               ← (consolidate)
      errorHandler.ts       ← (new)
      validation.ts         ← (new) Zod middleware
    utils/
      events.ts             ← (new) event emitter for side effects
    routes/
      v1/                   ← (new) versioned routes
demandly-app/
  src/
    lib/
      api.ts                ← use env var
    types/
      api.ts                ← (new) shared API types
```

---

## 🚀 Implementation Priority

1. **Week 1**: Secrets, auth middleware, env config
2. **Week 2**: Prisma side effects, validation, error handling
3. **Week 3**: API versioning, frontend config, type safety
4. **Week 4**: Testing, CI/CD, Docker, monitoring

---

*Review date: 2026-07-06*  
*Reviewer: AI Code Review*

---

## 🔧 Backend Enhancements (Additional)

| # | Area | Issue | Fix |
|---|------|-------|-----|
| 16 | **Redis Caching** | `getRedis()` called but caching not visible in routes | Add cache-aside pattern for `/public/landing`, product listings |
| 17 | **Graceful Shutdown** | No SIGTERM handling in `index.ts` | Add `process.on('SIGTERM')` to close Prisma pool, Redis, cron jobs |
| 18 | **Request Tracing** | No request IDs for debugging | Add `x-request-id` middleware + include in logs |
| 19 | **Idempotency** | Payment endpoints lack idempotency keys | Require `Idempotency-Key` header for `/payment/create-order` |
| 20 | **DB Indexes** | No visible Prisma indexes on high-query fields | Add `@@index([email])`, `@@index([status, createdAt])` etc. |
| 21 | **Connection Pool** | Default pool size may be insufficient | Tune `pool.size` in `db.ts` based on load |
| 22 | **Soft Deletes** | `auth.ts:353` hard deletes user + relations | Add `deletedAt` + Prisma middleware to filter |
| 23 | **Audit Log** | No trail for admin actions (verifications, settings) | Add `AuditLog` model + middleware on sensitive routes |

---

## 🌐 Frontend Enhancements (Additional)

| # | Area | Issue | Fix |
|---|------|-------|-----|
| 24 | **React Query/SWR** | Manual `fetch` + `useEffect` everywhere | Add TanStack Query for caching, deduping, retries |
| 25 | **Error Boundaries** | None - crashes white-screen app | Wrap route segments in `ErrorBoundary` |
| 26 | **Loading States** | Inconsistent (spinners vs skeleton) | Standardize with `Skeleton` components |
| 27 | **Image Optimization** | External Unsplash URLs, no `next/image` | Use `next/image` with local blurs/placeholders |
| 28 | **Accessibility** | No `aria-*`, focus management, contrast audit | Add `eslint-plugin-jsx-a11y`, test with axe |
| 29 | **SEO** | Only root `metadata` - no dynamic per-page | Add `generateMetadata` in each route |
| 30 | **i18n** | Hardcoded English strings | Add `next-intl` or `i18next` |

---

## 📦 DevOps & Reliability (Additional)

| # | Area | Suggestion |
|---|------|------------|
| 31 | **Dependency Scanning** | Add `npm audit` / `snyk` / `dependabot` in CI |
| 32 | **DB Migrations** | Document `prisma migrate deploy` in CI/CD; backup before |
| 33 | **Feature Flags** | Add LaunchDarkly/Unleash for gradual rollouts |
| 34 | **Load Testing** | k6 script for `/api/public/landing`, `/auth/login` |
| 35 | **Chaos Engineering** | Test Redis/DB failure scenarios in staging |
| 36 | **Runbook** | Document common incidents (OTP not sending, auction stuck) |

---

## 🎯 Product-Specific (Additional)

| # | Feature | Gap |
|---|---------|-----|
| 37 | **Auction Cron** | `auctionCron.ts` - no visibility into stuck/failed auctions |
| 38 | **Notifications** | Push + in-app only - no email fallback for critical alerts |
| 39 | **Manufacturer Onboarding** | No KYC/document verification flow visible |
| 40 | **Price Comparison** | `PriceCompare.tsx` UI exists - backend aggregation missing |
| 41 | **Analytics** | `/manufacturer/analytics` - define metrics, add time-range params |

---

## 📁 Updated Files to Create/Modify

```
docs/
  IMPROVEMENTS.md           ← this file
  ARCHITECTURE.md           ← (future) system design docs
  API_SPEC.md               ← (future) OpenAPI spec
backend/
  src/
    config/
      index.ts              ← add env validation
      env.schema.ts         ← (new) Zod schema
    middlewares/
      auth.ts               ← (consolidate)
      errorHandler.ts       ← (new)
      validation.ts         ← (new) Zod middleware
      requestId.ts          ← (new) request tracing
      idempotency.ts        ← (new) idempotency keys
    utils/
      events.ts             ← (new) event emitter for side effects
      gracefulShutdown.ts   ← (new) SIGTERM handler
    routes/
      v1/                   ← (new) versioned routes
    models/                 ← (new) AuditLog, SoftDelete mixin
demandly-app/
  src/
    lib/
      api.ts                ← use env var
      queryClient.ts        ← (new) TanStack Query provider
    types/
      api.ts                ← (new) shared API types
    components/
      ui/
        ErrorBoundary.tsx   ← (new)
        Skeleton.tsx        ← (new)
```

---

## 🚀 Updated Implementation Priority

1. **Week 1**: Secrets, auth middleware, env config, graceful shutdown
2. **Week 2**: Prisma side effects, validation, error handling, request tracing
3. **Week 3**: API versioning, frontend config, type safety, React Query
4. **Week 4**: Soft deletes, audit log, idempotency, DB indexes
5. **Week 5**: Testing, CI/CD, Docker, monitoring, load testing
6. **Week 6**: Accessibility, SEO, i18n, feature flags, runbooks

---

*Review date: 2026-07-06*  
*Reviewer: AI Code Review*