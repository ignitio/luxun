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

There are no test or lint scripts — TypeScript strict mode is the primary correctness check.

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

**Auth**: Replit OIDC (openid-client). Session cookie + `requireAdmin` middleware gates all `/api/admin/*` routes. Admin users are identified by `ADMIN_REPLIT_USER_IDS` (CSV env var of Replit user IDs).

## Key Conventions

- **Bilingual fields**: Portuguese fields end in `Pt`, Chinese in `Zh` (e.g., `titlePt`, `titleZh`). Arrays follow the same pattern (`genreTagsPt[]`, `themesPt[]`).
- **Slug-based routing**: Collections use kebab-case slugs (e.g., `hua-gai-ji-xu-bian`).
- **Portuguese-filtered listing**: The essays list API only returns essays where `contentPt` is non-null/non-empty.
- **Workspace references**: TypeScript project references are used for IDE support. When adding a new `lib/` package, wire it into `tsconfig.base.json` and the consuming package's `tsconfig.json`.

## Required Environment Variables

**Backend** (`artifacts/api-server`):
- `DATABASE_URL` — PostgreSQL connection string
- `PORT` — HTTP port
- `REPL_ID` — Replit OIDC client ID
- `ISSUER_URL` — Replit OIDC issuer (default: `https://replit.com/oidc`)
- `ADMIN_REPLIT_USER_IDS` — CSV of admin Replit user IDs

**Frontend** (`artifacts/lu-xun-essays`):
- `PORT` — Vite dev server port
- `BASE_PATH` — URL base path (e.g., `/`)
