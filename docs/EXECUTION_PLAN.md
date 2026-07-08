# Demandly - Formalized Execution Plan

**Source:** `docs/IMPROVEMENTS.md` (AI Code Review, 2026-07-06)  
**Status:** Not Started  
**Target:** 6 weeks, 41 improvements across backend, frontend, mobile, DevOps, product

---

## Structure

Each task includes:
- **ID** — Unique identifier (W{week}.{number})
- **Title** — Concise description
- **Owner** — Suggested role (BE=Backend, FE=Frontend, MO=Mobile, DO=DevOps)
- **Dependencies** — Task IDs that must complete first
- **Acceptance Criteria** — Verifiable done conditions
- **Est. Effort** — Story points (1, 2, 3, 5, 8)
- **Files** — Primary files to create/modify

---

## Week 1: Foundation & Security (Critical)

### W1.1 Remove Hardcoded Secrets
- **Owner:** BE
- **Dependencies:** None
- **Effort:** 2
- **Files:** `backend/src/config/index.ts`, `backend/src/config/env.schema.ts` (new)
- **Acceptance:**
  - `MASTER_API_KEY` has no default fallback
  - Startup fails fast with clear error if required env vars missing
  - Zod schema validates all env vars at boot
  - `.env.example` documents all required vars

### W1.2 Consolidate Auth Middleware
- **Owner:** BE
- **Dependencies:** None
- **Effort:** 3
- **Files:** `backend/src/middlewares/auth.ts` (merge), delete `auth.middleware.ts`, update all route imports
- **Acceptance:**
  - Single `auth.ts` exports `authenticate`, `authorize`, `optionalAuth`
  - All routes import from one file
  - Tests pass (if any exist)

### W1.3 Enable API Key Authentication
- **Owner:** BE
- **Dependencies:** W1.2
- **Effort:** 2
- **Files:** `backend/src/routes/index.ts`, `backend/src/middlewares/apiKeyAuth.ts` (new)
- **Acceptance:**
  - `router.use(apiKeyAuth)` enabled
  - Frontend sends `x-api-key` header on all API calls
  - Invalid/missing key returns 401 with structured error

### W1.4 Environment Validation & Config
- **Owner:** BE
- **Dependencies:** W1.1
- **Effort:** 2
- **Files:** `backend/src/config/env.schema.ts` (new), `backend/src/config/index.ts`
- **Acceptance:**
  - Zod schema covers: PORT, DATABASE_URL, REDIS_URL, JWT_SECRET, MASTER_API_KEY, ALLOWED_ORIGINS, FCM credentials, SMTP, AWS, Twilio
  - `config` object is immutable after validation
  - Clear error messages for missing/invalid vars

### W1.5 Graceful Shutdown
- **Owner:** BE
- **Dependencies:** None
- **Effort:** 2
- **Files:** `backend/src/utils/gracefulShutdown.ts` (new), `backend/src/index.ts`
- **Acceptance:**
  - `SIGTERM`/`SIGINT` handlers close: HTTP server, Prisma pool, Redis connection, cron jobs
  - 30s timeout before force exit
  - Logs shutdown phase with request IDs

---

## Week 2: Architecture & Reliability

### W2.1 Fix Prisma Extension Side Effects
- **Owner:** BE
- **Dependencies:** None
- **Effort:** 3
- **Files:** `backend/src/db.ts`, `backend/src/utils/events.ts` (new), `backend/src/services/pushNotificationService.ts`
- **Acceptance:**
  - `sendPushNotification` called via event emitter, not in Prisma query extension
  - Domain events: `order.created`, `auction.resolved`, `user.verified`
  - Unit test for event emission/handling

### W2.2 Replace Dynamic Require with Static Import
- **Owner:** BE
- **Dependencies:** W2.1
- **Effort:** 1
- **Files:** `backend/src/db.ts`
- **Acceptance:**
  - `import { eventEmitter } from './utils/events'` instead of `require()`
  - TypeScript compiles without errors

### W2.3 Centralized Error Handling
- **Owner:** BE
- **Dependencies:** W1.2
- **Effort:** 3
- **Files:** `backend/src/middlewares/errorHandler.ts` (enhance), `backend/src/utils/errors.ts` (new)
- **Acceptance:**
  - Error codes: `VALIDATION_ERROR`, `AUTH_ERROR`, `NOT_FOUND`, `CONFLICT`, `RATE_LIMITED`, `INTERNAL_ERROR`
  - All routes throw structured errors (no raw `throw new Error()`)
  - Response format: `{ error: { code, message, details?, requestId } }`
  - Sentry integration captures `INTERNAL_ERROR` with context

### W2.4 Request Validation (Zod)
- **Owner:** BE
- **Dependencies:** W2.3
- **Effort:** 5
- **Files:** `backend/src/middlewares/validation.ts` (new), all route files, `backend/src/schemas/` (new)
- **Acceptance:**
  - Every route has `validate(schema)` middleware
  - Schemas for: auth (login, register, OTP), proposals, demands, bids, orders, payments, admin actions
  - Invalid payload returns 400 with field-level details

### W2.5 Request Tracing (x-request-id)
- **Owner:** BE
- **Dependencies:** None
- **Effort:** 2
- **Files:** `backend/src/middlewares/requestId.ts` (new), `backend/src/index.ts`, `backend/src/utils/logger.ts`
- **Acceptance:**
  - Middleware generates UUID v4 if header missing
  - `requestId` attached to `req`, logged on every request
  - Included in all error responses and Sentry events

---

## Week 3: API Versioning & Frontend Integration

### W3.1 API Versioning (/api/v1/)
- **Owner:** BE
- **Dependencies:** W2.4
- **Effort:** 3
- **Files:** `backend/src/routes/v1/` (new), `backend/src/routes/index.ts`, all route files moved
- **Acceptance:**
  - All endpoints under `/api/v1/*`
  - Legacy `/api/*` returns 410 with migration guide link
  - Route files reorganized: `routes/v1/auth.ts`, `routes/v1/consumer.ts`, etc.

### W3.2 Frontend API Config (NEXT_PUBLIC_API_URL)
- **Owner:** FE
- **Dependencies:** None
- **Effort:** 1
- **Files:** `demandly-app/src/lib/api.ts`, `demandly-app/.env.example`
- **Acceptance:**
  - `getApiBaseUrl()` reads `process.env.NEXT_PUBLIC_API_URL`
  - Falls back to `http://localhost:5000` only in development
  - Works in Docker/production without code changes

### W3.3 Frontend Type Safety (Remove `any`)
- **Owner:** FE
- **Dependencies:** W3.2
- **Effort:** 3
- **Files:** `demandly-app/src/types/api.ts` (new), all components using `any`
- **Acceptance:**
  - Shared `ApiResponse<T>`, `User`, `Product`, `DemandPool`, `Bid`, `Order` interfaces
  - Zero `any` in `src/app/**`, `src/components/**`
  - TypeScript strict mode passes

### W3.4 React Query Migration (TanStack Query)
- **Owner:** FE
- **Dependencies:** W3.3
- **Effort:** 5
- **Files:** `demandly-app/src/lib/queryClient.ts` (new), `demandly-app/src/components/providers/QueryProvider.tsx` (new), all data-fetching components
- **Acceptance:**
  - `QueryClientProvider` wraps app root
  - All `useEffect` + `fetch` replaced with `useQuery`/`useMutation`
  - Caching, deduping, retries, stale-while-revalidate work
  - Devtools enabled in development

---

## Week 4: Data Integrity & Operations

### W4.1 Soft Deletes
- **Owner:** BE
- **Dependencies:** W2.4
- **Effort:** 3
- **Files:** `prisma/schema.prisma`, `backend/src/middlewares/softDelete.ts` (new), affected routes
- **Acceptance:**
  - `User`, `Product`, `Order`, `DemandPool` have `deletedAt` DateTime?
  - Prisma middleware filters `deletedAt: null` by default
  - Admin can restore; hard delete requires explicit flag

### W4.2 Audit Log
- **Owner:** BE
- **Dependencies:** W2.5
- **Effort:** 3
- **Files:** `prisma/schema.prisma` (add `AuditLog`), `backend/src/models/AuditLog.ts` (new), `backend/src/middlewares/audit.ts` (new), sensitive routes
- **Acceptance:**
  - Model: `id`, `actorId`, `actorRole`, `action`, `entity`, `entityId`, `before`, `after`, `ip`, `userAgent`, `createdAt`
  - Middleware auto-logs on: user verification, product approval, settings change, payout
  - Queryable via `/api/v1/admin/audit-logs` with filters

### W4.3 Idempotency Keys
- **Owner:** BE
- **Dependencies:** W2.3
- **Effort:** 2
- **Files:** `backend/src/middlewares/idempotency.ts` (new), payment routes
- **Acceptance:**
  - `Idempotency-Key` header required for `POST /payments/create-order`
  - Duplicate key within 24h returns original response
  - Stored in Redis with TTL

### W4.4 Database Indexes
- **Owner:** BE
- **Dependencies:** None
- **Effort:** 2
- **Files:** `prisma/schema.prisma`
- **Acceptance:**
  - `@@index([email])` on User
  - `@@index([status, createdAt])` on DemandPool, Order, Bid
  - `@@index([pincode, productId])` on DemandPool
  - `prisma migrate dev` generates migration; `explain analyze` shows index usage

### W4.5 Connection Pool Tuning
- **Owner:** BE
- **Dependencies:** None
- **Effort:** 1
- **Files:** `backend/src/db.ts`
- **Acceptance:**
  - `pool.size` set to `Math.min(20, cpuCount * 4)` or configurable via `DATABASE_POOL_SIZE`
  - Monitoring shows no pool exhaustion under load test

---

## Week 5: Testing, CI/CD, Docker, Monitoring

### W5.1 Unit Tests (Vitest)
- **Owner:** BE/FE
- **Dependencies:** W2.4, W3.4
- **Effort:** 8
- **Files:** `backend/tests/unit/`, `demandly-app/src/**/*.test.ts`, `vitest.config.ts` (both)
- **Acceptance:**
  - Backend: >80% coverage on services, utils, middleware
  - Frontend: >70% coverage on hooks, utils, components
  - Mocked Prisma, Redis, external APIs
  - Run in CI on every PR

### W5.2 E2E Tests (Playwright/Cypress)
- **Owner:** FE/BE
- **Dependencies:** W5.1
- **Effort:** 5
- **Files:** `tests/e2e/`, `playwright.config.ts` (new)
- **Acceptance:**
  - Critical paths: signup → create demand → bid → resolve → fulfill
  - Runs against staging-like environment
  - Flake rate < 5%

### W5.3 CI/CD Pipeline (GitHub Actions)
- **Owner:** DO
- **Dependencies:** W5.1
- **Effort:** 5
- **Files:** `.github/workflows/ci.yml`, `.github/workflows/cd.yml` (new)
- **Acceptance:**
  - CI: lint → typecheck → unit test → build (backend + frontend + mobile)
  - CD: deploy to staging on merge to `main`; production on tag
  - Artifacts: Docker images, test reports, coverage

### W5.4 Docker Hardening
- **Owner:** DO
- **Dependencies:** None
- **Effort:** 3
- **Files:** `backend/Dockerfile`, `demandly-app/Dockerfile`, `docker-compose.yml`
- **Acceptance:**
  - Multi-stage: builder → runner
  - Non-root user (`node`/`nextjs`)
  - Healthcheck: `curl -f /lb-health`
  - `.dockerignore` excludes node_modules, .git, tests
  - Image size < 500MB (backend), < 800MB (frontend)

### W5.5 Monitoring & Health Checks
- **Owner:** DO/BE
- **Dependencies:** W1.5, W2.5
- **Effort:** 3
- **Files:** `backend/src/routes/v1/health.ts` (new), `backend/src/utils/metrics.ts` (new), Grafana/Prometheus config (if applicable)
- **Acceptance:**
  - `/health` returns: `{ status, version, uptime, checks: { db, redis, fcm, email } }`
  - `/metrics` exposes Prometheus counters/histograms (request duration, errors, queue depth)
  - Alert rules: error rate > 5%, p95 latency > 2s, DB pool > 80%

### W5.6 Load Testing (k6)
- **Owner:** DO
- **Dependencies:** W5.4
- **Effort:** 2
- **Files:** `backend/tests/load-test.js`
- **Acceptance:**
  - Scripts for: `/api/v1/public/landing`, `/api/v1/auth/login`, `/api/v1/demand-pools`
  - 100 VUs for 5 min; p95 < 500ms, error rate < 1%
  - Runs in CI on performance branch

---

## Week 6: Polish, Accessibility, Mobile Parity

### W6.1 Error Boundaries (Frontend)
- **Owner:** FE
- **Dependencies:** W3.4
- **Effort:** 2
- **Files:** `demandly-app/src/components/ui/ErrorBoundary.tsx` (new), route layouts
- **Acceptance:**
  - Class component catches render errors
  - Shows friendly UI with "Try again" and "Report issue"
  - Logs to Sentry with component stack

### W6.2 Skeleton Loaders
- **Owner:** FE
- **Dependencies:** W3.4
- **Effort:** 2
- **Files:** `demandly-app/src/components/ui/Skeleton.tsx` (new), all list/detail pages
- **Acceptance:**
  - Consistent shimmer animation
  - Matches final content layout
  - No layout shift on data arrival

### W6.3 Image Optimization (next/image)
- **Owner:** FE
- **Dependencies:** None
- **Effort:** 2
- **Files:** `demandly-app/src/app/page.tsx`, all components using `<img>`
- **Acceptance:**
  - Zero external Unsplash URLs
  - Local assets in `public/images/` with WebP/AVIF
  - `next/image` with `placeholder="blur"`, `sizes`, `priority` where appropriate
  - Lighthouse Performance > 90

### W6.4 Accessibility (a11y)
- **Owner:** FE
- **Dependencies:** W6.1
- **Effort:** 5
- **Files:** `eslint.config.mjs` (add `eslint-plugin-jsx-a11y`), all components
- **Acceptance:**
  - ESLint a11y rules pass
  - axe-core audit: zero critical/serious violations
  - Focus management on modals, skip links, ARIA labels
  - Color contrast AA minimum

### W6.5 SEO (generateMetadata)
- **Owner:** FE
- **Dependencies:** None
- **Effort:** 3
- **Files:** Each route segment `page.tsx` / `layout.tsx`
- **Acceptance:**
  - Dynamic `title`, `description`, `openGraph`, `twitter` per page
  - Structured data (JSON-LD) for Product, Organization
  - Sitemap.xml + robots.txt generated at build

### W6.6 Internationalization (next-intl)
- **Owner:** FE
- **Dependencies:** W6.5
- **Effort:** 5
- **Files:** `demandly-app/src/i18n/` (new), `demandly-app/middleware.ts`, all components
- **Acceptance:**
  - Locale routing: `/en/...`, `/hi/...`, `/ta/...`
  - Message files: `messages/en.json`, `messages/hi.json`, `messages/ta.json`
  - Language switcher in header
  - RTL support ready (future Arabic)

### W6.7 Mobile Feature Parity Audit
- **Owner:** MO
- **Dependencies:** None
- **Effort:** 3
- **Files:** `Demandly-mobile-main/lib/features/**`, `docs/MOBILE_PARITY.md` (new)
- **Acceptance:**
  - Matrix: web feature ↔ mobile implementation status
  - Gaps documented with priority
  - Shared API types (`api.ts`) generated from backend OpenAPI spec

---

## Cross-Cutting (Ongoing)

| ID | Area | Action |
|----|------|--------|
| X.1 | Dependency Scanning | `npm audit` + Dependabot PRs weekly; fail CI on critical |
| X.2 | DB Migration Safety | `prisma migrate deploy` in CD; pre-deploy backup; rollback plan |
| X.3 | Feature Flags | Evaluate LaunchDarkly/Unleash for gradual rollouts (post-MVP) |
| X.4 | Chaos Engineering | Quarterly: kill Redis/DB primary in staging; verify failover |
| X.5 | Runbooks | `docs/RUNBOOKS/` — OTP failures, stuck auctions, payout delays |
| X.6 | Documentation | `ARCHITECTURE.md`, `API_SPEC.md` (OpenAPI), `CONTRIBUTING.md` |

---

## Tracking

| Week | Tasks | Total Points | Status |
|------|-------|--------------|--------|
| 1 | 5 | 11 | ⏳ |
| 2 | 5 | 14 | ⏳ |
| 3 | 4 | 12 | ⏳ |
| 4 | 5 | 11 | ⏳ |
| 5 | 6 | 26 | ⏳ |
| 6 | 7 | 22 | ⏳ |
| **Total** | **32** | **96** | |

---

## Next Steps

1. **Assign owners** — Confirm BE/FE/MO/DO capacity per week
2. **Sprint planning** — Break Week 1 tasks into daily tickets
3. **Set up tooling** — Vitest, Playwright, GitHub Actions, Docker registry
4. **Baseline metrics** — Current test coverage, build time, deploy frequency
5. **Kickoff** — Week 1 starts Monday; daily standups 15min

---

*Generated: 2026-07-07*  
*Reviewer: AI Code Review → Formalized by opencode*