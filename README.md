# Scalora Growth Engine

Internal, dark-first acquisition workspace for Scalora. This repository currently contains **Phases 1 and 2**: the authenticated application foundation and complete lead-management module. Lead discovery, audits, outreach, proposals, and analytics remain intentionally unimplemented.

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
- Navigation modules beyond Dashboard, Leads, and Settings are clearly marked placeholders and have no fake actions.
- The health endpoint intentionally reports failure when PostgreSQL is unreachable.
- No lead discovery, audit execution, outreach generation, or proposal logic is included because the instruction requires stopping after Phase 2.
