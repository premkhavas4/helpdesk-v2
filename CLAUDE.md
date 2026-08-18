# HELPDESK — Project Memory

AI-powered ticket management system that automatically processes support emails, classifies tickets using AI (Claude API), and generates intelligent responses from a knowledge base.

## Tech Stack

- **Runtime:** Bun (v1.3+) — use `bun` for installs, dev, builds. `bun run dev`, `bun add`, `bunx` (equivalent to `npx`).
- **Server:** Node.js + Express (v5) + TypeScript → `server/`
- **Client:** React + TypeScript + Vite (v8) → `client/`
- **Database:** PostgreSQL + Prisma ORM (planned, Phase 2)
- **AI:** Anthropic Claude API (planned, Phase 5)
- **Email:** Nodemailer + SMTP (planned, Phase 6)

## Project Structure

```
HELPDESK/
├── client/          # React + TypeScript + Vite frontend
│   ├── src/
│   │   ├── App.tsx, App.css, main.tsx, index.css
│   │   └── assets/
│   ├── public/
│   ├── .env         # VITE_API_URL=http://localhost:3000
│   ├── package.json # react, react-router-dom, axios
│   ├── tsconfig*.json
│   └── vite.config.ts
├── server/          # Express + TypeScript backend
│   ├── src/
│   │   ├── index.ts         # Entry point (CORS, /health, /api)
│   │   ├── routes/          # API routes (empty)
│   │   ├── controllers/     # (empty)
│   │   ├── middleware/      # (empty)
│   │   ├── services/        # Claude API, email (empty)
│   │   ├── models/          # Prisma models (empty)
│   │   ├── config/          # (empty)
│   │   └── utils/           # (empty)
│   ├── .env         # PORT=3000, CLIENT_URL, DATABASE_URL, SESSION_SECRET, ANTHROPIC_API_KEY, SMTP_*
│   ├── .env.example
│   └── package.json # express, @types/express, @types/node
├── CLAUDE.md            # This file — project memory
├── implementation-plan.md  # 8-phase roadmap (authoritative plan)
├── project-scope.md        # Features, roles, statuses, categories
├── tech-stack.md           # Technology decisions
├── README.md               # Setup guide
├── PROJECT-STATUS.md       # Phase 1 status
└── RESTRUCTURE-COMPLETE.md # Backend→server / frontend→client notes
```

## Development Commands

**Playwright E2E**

1. Install Playwright for the client:
   ```bash
   cd client
   bun add -D @playwright/test
   bun dlv @playwright/test
   ```
2. Generate a test template using the `e2e-test-writer` helper:
   ```bash
   bunx e2e-test-writer
   ```
   This will create an initial `tests` directory under `client` and scaffold a sample test file.
3. Run the tests with a watch mode:
   ```bash
   bun test:e2e
   ```
   or for a single test:
   ```bash
   bun test:e2e path/to/file.spec.ts
   ```
4. Add tests to CI by invoking the `e2e-test-writer` step in your workflow.

**Component Testing (Vitest & React Testing Library)**

1. **Writing Component Tests:**
   - Create test files matching `src/**/*.test.tsx` or `src/**/*.test.ts` (excluded from production builds in `tsconfig.app.json`).
   - For components using TanStack Query, import `renderWithQuery` from `@/test/test-utils` instead of standard `render` to wrap the component in `QueryClientProvider`.
   - Mock context hooks (like `useAuth` from `@/context/AuthContext`) and Axios requests (`vi.mock('axios')`) to isolate component rendering.
   - Configure global DOM testing setup inside `src/test/setup.ts`.
2. **Executing Component Tests:**
   - Single run: `cd client && npm run test`
   - Watch mode (hot-reloading): `cd client && npm run test:watch`
   - Visual dashboard UI: `cd client && npm run test:ui`

## Server

…

Environment setup (Bun not on PATH by default in bash):
```bash
export BUN_INSTALL="$HOME/.bun"
export PATH="$BUN_INSTALL/bin:$PATH"
```

**Server** (runs on http://localhost:3000):
```bash
cd server
cp .env.example .env
bun install
bun run dev        # bun --watch src/index.ts
```

**Client** (runs on http://localhost:5173):
```bash
cd client
cp .env.example .env
bun install
bun run dev        # vite
```

Health check: `GET http://localhost:3000/health`

## Environment Variables

**Server** (`server/.env`):
- `PORT=3000`
- `CLIENT_URL=http://localhost:5173`
- `DATABASE_URL` (PostgreSQL connection string)
- `SESSION_SECRET` (Secure random string for cookie signing)
- `ANTHROPIC_API_KEY` (API key for Claude service)
- `SMTP_*` (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`)
- `EMAIL_FROM` (Default sender email address for notifications)
- `AUTH_SECRET` (Secret used for password hashing, e.g., bcrypt salt)
- `AUTH_EXPIRE` (JWT or cookie expiration in seconds)

**Client** (`client/.env`):
- `VITE_API_URL=http://localhost:3000`
- `VITE_APP_ENV=development` (optional flag for env mode)

## Ports & URLs

- Server: `http://localhost:3000`
- Client: `http://localhost:5173`

## Implementation Progress

- **Phase 1 (Project Setup):** ✅ Complete — server/client scaffolding, Bun, TypeScript.
- **Phase 2 (Authentication):** In progress — implement DB session-based auth with httpOnly cookies, bcrypt password hashing; JWT or cookie expiry controlled by `AUTH_EXPIRE`.
- **Phase 3 (User Management):** Pending — RBAC (Admin/Agent), admin CRUD for agents.
- **Phase 4 (Ticket CRUD):** Pending.
- **Phase 5 (AI Features):** Pending — Claude classification, summaries, suggested replies, knowledge base.
- **Phase 6 (Email Integration):** Pending.
- **Phase 7 (Dashboard):** Pending.
- **Phase 8 (Polish & Deployment):** Pending.

See `implementation-plan.md` for the full task breakdown per phase. Do not modify that file unless asked.

## Domain Rules

- **Ticket statuses:** Open, Resolved, Closed.
- **Ticket categories:** General question, Technical question, Refund request.
- **User roles:** Admin (full access, creates agents), Agent (view/manage/respond to tickets).

## MCP Server — Context7

Use the **Context7 MCP server** as the FIRST choice for up-to-date documentation on any library, framework, SDK, API, CLI tool, or cloud service — including well-known ones like React, Next.js, Express, Prisma, Tailwind, PostgreSQL, etc. This includes API syntax, configuration, version migrations, setup instructions, and CLI usage. Prefer Context7 over web search for library docs (training data may be outdated). Do NOT use Context7 for refactoring, business-logic debugging, code review, or general programming concepts.

Typical flow:
1. `mcp__context7__resolve-library-id` — resolve a library name to its Context7 library ID.
2. `mcp__context7__query-docs` — query docs for that library by a specific topic.

Example topics likely needed soon: Prisma schema/migrations/seeding, Express routing, React Router, cookie/session handling with Express.

## Memory & Conventions

- Project working directory: `E:\documents\claude_course\HELPDESK` (Windows, Git Bash shell).
- Convention: client/server split (NOT backend/frontend).
- Follow the existing code style: TypeScript, ES modules, semicolons.
- Use Axios for all client-side HTTP/API requests.
- Use TanStack Query (React Query) for all frontend data fetching, mutations, and cache management.
- Use Zod schemas for all frontend form validation and backend request validation. Enforce validation on both client and server.
- Define shared Zod validation schemas inside the `core/src/schemas/` directory, and reference them relatively from both the client and server (e.g., `../../../core/src/schemas/user.js`).
- Define shared utility functions inside the `core/src/utils/` directory (e.g., `formatAgents` in `core/src/utils/formatAgents.ts` for deduplicating and standardizing user display names across client and server).