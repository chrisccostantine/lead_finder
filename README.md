# Scalora Growth Engine

Internal, dark-first acquisition workspace for Scalora. This repository currently contains **Phases 1–4**: the authenticated foundation, lead management, approved-source Lead Finder, and website audit engine. Social audits, outreach, proposals, and analytics remain intentionally unimplemented.

## Included

- React, Vite, TypeScript, Tailwind CSS, React Router, TanStack Query, React Hook Form, Zod, and Lucide client
- Express and TypeScript API with Prisma/PostgreSQL
- One-time initial admin registration, login, current-user lookup, logout, and persistent protected routes
- bcrypt password hashing and expiring JWT bearer tokens
- Environment validation, CORS allow-listing, secure headers, request logging, JSON size limits, and global/auth rate limits
- Centralized API errors and Zod request validation
- Responsive sidebar/top navigation, global API client, and toast notifications
- Docker Compose PostgreSQL service and deployable Prisma migration
- Lead CRUD with server-side pagination, search, filtering, and sorting
- Table and card lead views with responsive loading, empty, and error states
- Lead contacts, notes, status history, priority controls, and soft archival
- Duplicate detection across normalized website domains, email addresses, phone numbers, and business names
- Two-step CSV import with dry-run review, invalid-row reporting, within-file duplicate detection, and a 500-row limit
- Dedicated lead creation, editing, details, and CSV import screens
- Unit tests for lead validation, normalization, duplicate matching, and quoted CSV parsing
- Adapter-based Lead Finder with mock, manual CSV, and official Google Places providers
- Persisted search jobs, reviewed result imports, existing-lead indicators, search history, and saved templates
- Provider feature flags, graceful Google configuration handling, API usage logs, and explicit cost/data warnings
- Persistent website-audit background jobs with progress, history, re-runs, and restart recovery
- DNS-aware SSRF protection, redirect revalidation, strict fetch timeouts, response-size limits, and HTTP(S)-only URLs
- Technical, performance, SEO, conversion, and mobile analysis with deterministic category and overall scores
- Optional server-side Google PageSpeed Insights integration with graceful local-check fallback
- Severity-grouped findings, strengths, recommended actions, raw metrics, and comparison with the previous audit
- Unit tests for audit scoring and private-network address blocking

## Repository structure

```text
.
├── client/               React application
├── server/               Express API and Prisma schema
├── docker-compose.yml    Local PostgreSQL
└── README.md
```

## Prerequisites

- Node.js 20 or newer
- npm 10 or newer
- Docker Desktop (recommended for local PostgreSQL), or another PostgreSQL 16-compatible database

## Local setup

1. Start PostgreSQL:

   ```bash
   docker compose up -d postgres
   ```

2. Create local environment files:

   ```bash
   cp server/.env.example server/.env
   cp client/.env.example client/.env
   ```

   Replace `JWT_SECRET` with a securely generated value of at least 32 characters. The example database credentials are for local development only.

3. Install dependencies and prepare the database:

   ```bash
   cd server
   npm install
   npm run prisma:generate
   npm run prisma:deploy
   ```

4. In a second terminal, install the client:

   ```bash
   cd client
   npm install
   ```

5. Run both applications in separate terminals:

   ```bash
   cd server && npm run dev
   cd client && npm run dev
   ```

6. Visit `http://localhost:5173`. With an empty database, the UI redirects to `/setup`. Create the initial admin; all later public registration attempts return `409 REGISTRATION_DISABLED`.

## API endpoints

| Method | Route | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/api/health` | Public | API and database readiness |
| GET | `/api/auth/setup-status` | Public | Whether initial registration is open |
| POST | `/api/auth/register` | Public once | Create the first `ADMIN` |
| POST | `/api/auth/login` | Public | Authenticate an admin |
| GET | `/api/auth/me` | Bearer token | Return the current user |
| GET | `/api/leads` | Bearer token | Paginated lead list with search, filters, and sorting |
| POST | `/api/leads` | Bearer token | Create a lead and initial status history |
| POST | `/api/leads/check-duplicates` | Bearer token | Preview potential duplicate matches |
| POST | `/api/leads/import` | Bearer token | Dry-run or execute a reviewed CSV import |
| GET | `/api/leads/:id` | Bearer token | Lead details, contacts, and status history |
| PATCH | `/api/leads/:id` | Bearer token | Update a lead and record status changes |
| DELETE | `/api/leads/:id` | Bearer token | Soft-archive a lead |
| POST | `/api/leads/:id/archive` | Bearer token | Soft-archive a lead |
| GET | `/api/lead-finder/providers` | Bearer token | Provider availability and warnings |
| POST | `/api/lead-finder/search` | Bearer token | Run and persist an approved-provider search |
| GET | `/api/lead-finder/history` | Bearer token | Recent search jobs |
| GET | `/api/lead-finder/jobs/:id` | Bearer token | Search job and reviewed results |
| POST | `/api/lead-finder/jobs/:id/import` | Bearer token | Import selected, non-duplicate results |
| GET/POST | `/api/lead-finder/templates` | Bearer token | List or save search templates |
| DELETE | `/api/lead-finder/templates/:id` | Bearer token | Delete a search template |
| GET | `/api/lead-finder/usage` | Bearer token | Provider request/result totals |
| GET | `/api/audits` | Bearer token | Paginated audit history, optionally filtered by lead or status |
| POST | `/api/audits/leads/:leadId` | Bearer token | Queue a website audit for a lead |
| GET | `/api/audits/:id` | Bearer token | Audit progress, scores, issues, recommendations, and metrics |
| POST | `/api/audits/:id/rerun` | Bearer token | Queue a new audit using the lead's current website URL |

Example login body:

```json
{ "email": "admin@scalora.com", "password": "your-password" }
```

API errors use a consistent shape:

```json
{ "error": { "code": "INVALID_CREDENTIALS", "message": "Email or password is incorrect." } }
```

## Database model

`User` has a UUID identifier, unique normalized email, name, password hash, extensible role enum, and timestamps. The initial registration transaction uses a PostgreSQL advisory lock to ensure two concurrent setup requests cannot create multiple first admins.

`Lead` contains the requested business, location, website, social, source, status, priority, and notes fields. It also stores normalized internal matching keys and `archivedAt` for soft deletion. `LeadContact` stores manually entered business contacts. `LeadStatusHistory` records each initial and subsequent status with the responsible user. Phase 2 adds indexed filters and lookup keys without introducing later-phase audit or outreach relationships.

`SearchJob` stores provider criteria, status, result snapshots, import counts, duplicate counts, errors, and timing. `ApiUsageLog` records provider requests and returned result counts. `SavedSearchTemplate` stores reusable, user-owned search criteria. Google API keys never enter these records or frontend responses.

`WebsiteAudit` stores the requested URL, background-job status and timing, category scores, overall score, strengths, severity-tagged problems, recommended actions, raw metrics, and a safe failure reason. It belongs to a lead and records the admin who requested it. Completed audits are immutable history records so later runs can be compared without overwriting evidence.

## Lead list filters

`GET /api/leads` supports `page`, `pageSize`, `search`, `status`, `priority`, `industry`, `country`, `city`, `source`, `hasWebsite`, `hasEmail`, `hasSocialMedia`, `createdFrom`, `createdTo`, `archived`, `sortBy`, and `sortOrder`. Page size is capped at 100.

## CSV import

The client reads the selected CSV locally and sends its text to the authenticated API. Imports first run in dry-run mode so the user can review invalid and duplicate rows. A confirmed import skips those rows and inserts the remaining leads in a transaction.

`businessName` is required. Supported optional headers include `industry`, `description`, `websiteUrl` (or `website`), `email`, `phone`, `country`, `city`, `address`, `googleMapsUrl`, `instagramUrl`, `facebookUrl`, `linkedinUrl`, `source`, `sourceReference`, `status`, `priority`, and `notes`. Header matching ignores case, spaces, hyphens, and underscores.

## Environment variables

### Server

| Variable | Required | Description |
| --- | --- | --- |
| `NODE_ENV` | No | `development`, `test`, or `production`; defaults to `development` |
| `PORT` | No | API port; defaults to `4000` |
| `DATABASE_URL` | Yes | PostgreSQL connection URL |
| `JWT_SECRET` | Yes | Signing secret, minimum 32 characters |
| `JWT_EXPIRES_IN` | No | Access-token lifetime; defaults to `8h` |
| `CLIENT_URL` | Yes | Exact allowed browser origin |
| `LOG_LEVEL` | No | Pino log level; defaults to `info` |
| `GOOGLE_PLACES_API_KEY` | No | Server-only Places API (New) credential |
| `ENABLE_GOOGLE_PLACES` | No | Enables Google provider when set to `true` and a key exists |
| `ENABLE_MOCK_PROVIDER` | No | Enables synthetic development results; defaults to `true` |
| `GOOGLE_PAGESPEED_API_KEY` | No | Server-only PageSpeed Insights credential |
| `ENABLE_PAGESPEED` | No | Enables PageSpeed mobile/Lighthouse metrics when a key is present |
| `AUDIT_FETCH_TIMEOUT_MS` | No | Per-request website timeout; defaults to `10000`, maximum `30000` |
| `AUDIT_MAX_RESPONSE_BYTES` | No | Maximum audited response body; defaults to `1500000` |

### Client

| Variable | Required | Description |
| --- | --- | --- |
| `VITE_API_URL` | Yes | Public API base URL, including `/api` |

Only `VITE_` values are bundled into the browser. Never place database, JWT, or provider secrets in the client environment.

## Verification commands

```bash
cd server
npm run prisma:validate
npm run typecheck
npm run build
npm test

cd ../client
npm run typecheck
npm run build
```

To verify migrations against a disposable local database, start Docker PostgreSQL and run `npm run prisma:deploy` from `server/`.

## Railway deployment

Create a Railway PostgreSQL service plus separate services rooted at `server` and `client`.

- Server build command: `npm run prisma:generate && npm run build`
- Server pre-deploy command: `npm run prisma:deploy`
- Server start command: `npm start`
- Client build command: `npm run build`
- Client start command: `npm run preview -- --host 0.0.0.0 --port $PORT`
- Set `DATABASE_URL` from Railway PostgreSQL, a production `JWT_SECRET`, `CLIENT_URL` to the client domain, and `VITE_API_URL` to the server domain plus `/api`.

## Current limitations

- JWT access tokens are stored in browser local storage. A refresh-token or secure-cookie strategy is reserved for the later security phase; use short expirations and strict CSP/origin controls in production until then.
- Password reset, MFA, profile editing, and additional roles are not part of Phase 1.
- Lead archive is intentionally one-way in Phase 2; restoring archived leads can be added with a future retention policy.
- CSV import accepts up to 500 rows and 2 MB per file and does not attempt to infer missing business data.
- Google Places does not provide email addresses; the interface labels this limitation and never invents them.
- Radius bias for Google requires a user-provided latitude/longitude search center. Automatic geocoding is not part of Phase 3.
- API costs are not estimated because billing varies; actual request/result counts and cost warnings are shown.
- Website checks analyze the public homepage and conventional `robots.txt`, `sitemap.xml`, and favicon locations. HTML heuristics can require human confirmation and are presented as findings, not guarantees.
- PageSpeed is optional. Without it, performance uses bounded response-time and HTML-size signals; accessibility, best-practices, and web-vital metrics remain unavailable.
- Background jobs run inside the API process as required for Phase 4. Interrupted pending/running jobs resume on startup, but a dedicated queue is recommended before horizontal scaling.
- Websites that reject automated requests, present invalid TLS certificates, exceed safety limits, or are unreachable are saved as failed audits with a reviewable reason.
- Navigation modules beyond Dashboard, Lead Finder, Leads, Audits, and Settings are clearly marked placeholders and have no fake actions.
- The health endpoint intentionally reports failure when PostgreSQL is unreachable.
- No unauthorized scraping, social audit, outreach generation, or proposal logic is included because the instruction requires stopping after Phase 4.
