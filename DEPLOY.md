# Deployment Guide

This app deploys as a single web service on **Render**, backed by a **Neon** PostgreSQL database. The frontend (React/Vite) is served as static files from the same Express process, so everything lives under one URL with no cross-origin issues.

---

## Prerequisites

- A [GitHub](https://github.com) account with the repository pushed
- A [Render](https://render.com) account (free tier works)
- A [Neon](https://neon.tech) account (free tier works)

---

## Step 1 — Create the database (Neon)

1. Log in to [neon.tech](https://neon.tech) → **Create Project**
2. Give the project any name (e.g. `luxun`)
3. On the project dashboard, find the **Connection string** — it looks like:
   ```
   postgresql://username:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
4. Copy it. You will use it as `DATABASE_URL` in the next steps.

The database schema is applied automatically on every server start (`pnpm db push` runs before the process launches), so no manual migration step is needed.

---

## Step 2 — Deploy on Render

### 2.1 Create the service via Blueprint

1. Log in to [render.com](https://render.com)
2. Click **New +** → **Blueprint**
3. Connect your GitHub account if prompted
4. Select the **ignitio/luxun** repository
5. Render detects `render.yaml` and shows one service: `essay-archive`
6. Click **Apply** — Render creates the service but does not start a build yet

### 2.2 Set the secret environment variables

Go to the service → **Environment** tab and add the following variables (the non-secret ones like `PORT`, `NODE_ENV`, `ISSUER_URL` are already in `render.yaml`):

| Variable | Value |
|---|---|
| `DATABASE_URL` | Connection string from Step 1 |
| `ADMIN_USERNAME` | Your chosen admin username (e.g. `luojie`) |
| `ADMIN_PASSWORD` | A strong password for the admin panel |
| `ADMIN_REPLIT_USER_IDS` | Same value as `ADMIN_USERNAME` |

### 2.3 Trigger the first deploy

Click **Manual Deploy** → **Deploy latest commit**.

The build runs three stages:

```
1. npm install -g pnpm && pnpm install --frozen-lockfile
2. PORT=10000 BASE_PATH=/ pnpm --filter @workspace/lu-xun-essays run build
3. pnpm --filter @workspace/api-server run build
```

Then on start:

```
pnpm --filter @workspace/db run push   ← creates/updates DB tables
node --enable-source-maps artifacts/api-server/dist/index.mjs
```

Build time is roughly 3–5 minutes. When the health check at `/api/healthz` turns green, the service is live.

---

## Step 3 — Verify the deployment

Once the deploy succeeds, open the Render-assigned URL (e.g. `https://essay-archive.onrender.com`) and confirm:

| Check | Expected result |
|---|---|
| `/` | Home page loads with the Lu Xun hero section |
| `/collections` | Lists all 17 seeded collections |
| `/essays` | Essay search page loads |
| `/api/healthz` | `{"status":"ok"}` |
| `/api/stats` | Returns archive statistics |
| `/admin` | Login form appears |

### Accessing the admin panel

1. Go to `/admin`
2. Enter the `ADMIN_USERNAME` and `ADMIN_PASSWORD` you set in Step 2.2
3. You will be redirected to `/admin/dashboard`

---

## Updating the app

Every push to the `main` branch can be deployed by clicking **Manual Deploy** → **Deploy latest commit** in the Render dashboard, or by enabling **Auto-Deploy** in the service settings.

The DB schema push runs automatically on each start, so schema changes in `lib/db/src/schema/` are applied without any extra steps.

---

## Custom domain (optional)

In the Render dashboard go to the service → **Custom Domains** → **Add Custom Domain**. Follow the instructions to add a CNAME record in your DNS provider. Render provisions a TLS certificate automatically.

---

## Environment variable reference

| Variable | Required | Default in `render.yaml` | Description |
|---|---|---|---|
| `DATABASE_URL` | Yes | — | Neon PostgreSQL connection string |
| `PORT` | Yes | `10000` | HTTP port (set by Render) |
| `NODE_ENV` | Yes | `production` | Enables static file serving from Express |
| `ADMIN_USERNAME` | Yes | — | Admin panel login username |
| `ADMIN_PASSWORD` | Yes | — | Admin panel login password |
| `ADMIN_REPLIT_USER_IDS` | Yes | — | Must equal `ADMIN_USERNAME` |
| `LOG_LEVEL` | No | `info` | Pino log level |
