# Scalora Growth Engine

Internal, dark-first acquisition workspace for Scalora. This repository currently contains **Phase 1 only**: the application foundation, initial-admin authentication, and responsive application shell. Lead management, audits, outreach, proposals, and analytics remain intentionally unimplemented.

## Included in Phase 1

- React, Vite, TypeScript, Tailwind CSS, React Router, TanStack Query, React Hook Form, Zod, and Lucide client
- Express and TypeScript API with Prisma/PostgreSQL
- One-time initial admin registration, login, current-user lookup, logout, and persistent protected routes
- bcrypt password hashing and expiring JWT bearer tokens
- Environment validation, CORS allow-listing, secure headers, request logging, JSON size limits, and global/auth rate limits
- Centralized API errors and Zod request validation
- Responsive sidebar/top navigation, global API client, and toast notifications
- Docker Compose PostgreSQL service and deployable Prisma migration

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

Example login body:

```json
{ "email": "admin@scalora.com", "password": "your-password" }
```

API errors use a consistent shape:

```json
{ "error": { "code": "INVALID_CREDENTIALS", "message": "Email or password is incorrect." } }
```

## Database model

Phase 1 creates one `User` model with UUID `id`, unique normalized `email`, `name`, `passwordHash`, extensible `Role` enum (currently `ADMIN`), and timestamps. The initial registration transaction uses a PostgreSQL advisory lock to ensure two concurrent setup requests cannot create multiple first admins.

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

cd ../client
npm run typecheck
npm run build
```

To verify migrations against a disposable local database, start Docker PostgreSQL and run `npm run prisma:deploy` from `server/`.

## Railway deployment

Create a Railway PostgreSQL service plus separate services rooted at `server` and `client`.

- Server build command: `npm ci && npm run prisma:generate && npm run build`
- Server start command: `npm run prisma:deploy && npm start`
- Client build command: `npm ci && npm run build`
- Client start command: `npm run preview -- --host 0.0.0.0 --port $PORT`
- Set `DATABASE_URL` from Railway PostgreSQL, a production `JWT_SECRET`, `CLIENT_URL` to the client domain, and `VITE_API_URL` to the server domain plus `/api`.

## Phase 1 limitations

- JWT access tokens are stored in browser local storage. A refresh-token or secure-cookie strategy is reserved for the later security phase; use short expirations and strict CSP/origin controls in production until then.
- Password reset, MFA, profile editing, and additional roles are not part of Phase 1.
- Navigation modules beyond Dashboard and Settings are clearly marked placeholders and have no fake actions.
- The health endpoint intentionally reports failure when PostgreSQL is unreachable.
- No lead or service-catalogue models are introduced because the instruction requires stopping after Phase 1.

