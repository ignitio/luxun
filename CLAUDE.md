# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Digital archive platform for Lu Xun's essays — a bilingual (Chinese/Portuguese) full-stack web app built as a pnpm monorepo. The backend serves essay/collection data via a versioned OpenAPI contract; the frontend renders them with scholarly annotations.

## Commands

```bash
# Development
pnpm --filter @workspace/api-server run dev       # Start backend (Express, PORT=8080)
pnpm --filter @workspace/lu-xun-essays run dev    # Start frontend (Vite)

# Build & typecheck
pnpm run build          # Typecheck + build all packages
pnpm run typecheck      # Full typecheck across all packages

# Database
pnpm --filter @workspace/db run push              # Apply schema changes
pnpm --filter @workspace/db run push-force        # Force push (destructive)

# API codegen (regenerates from openapi.yaml → Zod schemas + React Query hooks)
pnpm --filter @workspace/api-spec run codegen
```

E2E tests use Playwright (`pnpm test`). TypeScript strict mode is the primary correctness check for logic.

```bash
# E2E tests (both dev servers must be running, or let Playwright start them)
pnpm test          # Run all tests headless
pnpm test:ui       # Open Playwright UI
```

## Architecture

```
artifacts/
  api-server/       Express 5 backend (bundled via esbuild to ESM .mjs)
  lu-xun-essays/    React 19 SPA (Vite + Tailwind CSS + shadcn/ui + Wouter)
lib/
  db/               Drizzle ORM schema + PostgreSQL connection
  api-spec/         openapi.yaml — single source of truth for the API contract
  api-zod/          Auto-generated Zod schemas (from openapi.yaml via Orval)
  api-client-react/ Auto-generated TanStack React Query hooks (from openapi.yaml)
  replit-auth-web/  Replit OIDC client helper
```

**API contract flow**: Edit `lib/api-spec/openapi.yaml` → run codegen → `api-zod` and `api-client-react` regenerate automatically. Never edit generated files in those two packages directly.

**Data flow**: Frontend React Query hooks → `/api/essays|collections|admin/*` → Express routes → Drizzle ORM → PostgreSQL.

**Admin content flow**: Upload `.md` files (YAML frontmatter + `## zh-original` / `## pt` / etc. H2 sections) → `markdownParser.ts` → upsert essay → recalculate collection `essayCount`.

**Admin auth**: `POST /api/admin-login` with `{username, password}` validated against `ADMIN_USERNAME` / `ADMIN_PASSWORD` env vars. On success a session is created (stored in the `sessions` DB table) and a `sid` cookie is set. `requireAdmin` middleware checks that `req.user.id` is in `ADMIN_REPLIT_USER_IDS` — set this to the same value as `ADMIN_USERNAME`. Session cookie is `secure: false` in development and `secure: true` in production.

**Dev proxy**: `artifacts/lu-xun-essays/vite.config.ts` proxies `/api/*` to `http://localhost:${API_PORT||8080}` so both servers can run on separate ports during development.

**Production static serving**: `artifacts/api-server/src/app.ts` serves the built frontend (`artifacts/lu-xun-essays/dist/public/`) as static files when `NODE_ENV=production`, making the whole app reachable from a single origin. The SPA fallback (`*path → index.html`) is registered after all `/api` routes.

## Key Conventions

- **Bilingual fields**: Portuguese fields end in `Pt`, Chinese in `Zh` (e.g., `titlePt`, `titleZh`). Arrays follow the same pattern (`genreTagsPt[]`, `themesPt[]`).
- **Slug-based routing**: Collections use kebab-case slugs (e.g., `hua-gai-ji-xu-bian`).
- **Portuguese-filtered listing**: The essays list API only returns essays where `contentPt` is non-null/non-empty.
- **Workspace references**: TypeScript project references are used for IDE support. When adding a new `lib/` package, wire it into `tsconfig.base.json` and the consuming package's `tsconfig.json`.

## Required Environment Variables

**Backend** (`artifacts/api-server`):
- `DATABASE_URL` — PostgreSQL connection string
- `PORT` — HTTP port
- `ADMIN_USERNAME` — admin login username (default: `luojie`)
- `ADMIN_PASSWORD` — admin login password (default: `luxun`)
- `ADMIN_REPLIT_USER_IDS` — must equal `ADMIN_USERNAME` (used by `requireAdmin` to authorise the session)

**Frontend** (`artifacts/lu-xun-essays`):
- `PORT` — Vite dev server port
- `BASE_PATH` — URL base path (e.g., `/`)
