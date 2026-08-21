# Deploying HELPDESK to Railway 🚀

This repository is fully configured for deployment on [Railway](https://railway.app) as a unified monorepo application (Express + React + PostgreSQL).

---

## Quick Start (Deploy via Railway Dashboard)

### 1. Create a New Project on Railway
1. Go to [railway.app/new](https://railway.app/new).
2. Select **Deploy from GitHub repo** and pick your `HELPDESK` repository.
3. Railway will automatically detect `railway.json` and use **Nixpacks** to build the application.

---

### 2. Add PostgreSQL Database Service
1. In your Railway Project canvas, click **+ New** -> **Database** -> **Add PostgreSQL**.
2. Railway will deploy a managed PostgreSQL database and generate a `DATABASE_URL` variable.

---

### 3. Configure Environment Variables
In your Web Service under **Variables**, set the following environment variables:

| Variable | Recommended / Example Value | Description |
|---|---|---|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` | Connects Railway Web Service to Railway Postgres |
| `NODE_ENV` | `production` | Enables production mode & static asset serving |
| `PORT` | `${{PORT}}` | (Auto-populated by Railway) |
| `BETTER_AUTH_SECRET` | *(Generate a 32-char random string)* | Auth secret for cookie signing & token security |
| `BETTER_AUTH_URL` | `https://${{RAILWAY_PUBLIC_DOMAIN}}` | Base domain URL of your deployed Railway app |
| `CLIENT_URL` | `https://${{RAILWAY_PUBLIC_DOMAIN}}` | Client domain allowed by CORS |
| `ANTHROPIC_API_KEY` | `sk-ant-api03-...` | Your Anthropic Claude API Key for AI features |
| `SENTRY_DSN` | *(Optional)* | Your Sentry DSN for server error tracking |

---

## Deploying via Railway CLI (Alternative)

If you prefer using the command line:

```bash
# 1. Install Railway CLI
npm i -g @railway/cli

# 2. Login to Railway
railway login

# 3. Link your project or create a new one
cd HELPDESK
railway init

# 4. Provision PostgreSQL
railway add -d postgres

# 5. Deploy the application
railway up
```

---

## Architecture Overview

- **Unified Build**:
  - The build script (`bun run build`) compiles the Vite React frontend into `client/dist` and generates Prisma client models.
  - The start script (`bun run start`) runs `prisma db push` to synchronize PostgreSQL database schemas and starts the Express server.
- **Static Asset Serving**:
  - In production, Express automatically serves built frontend assets from `client/dist` and handles single-page app (SPA) routing fallbacks while exposing `/api/*` and `/health`.
- **Health Check**:
  - Railway monitors application health via `GET /health`.
