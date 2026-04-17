# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite + Tailwind CSS + shadcn/ui + wouter

## Artifacts

### lu-xun-essays (Preview: `/`)
Digital archive of Lu Xun's 16 essay collections (*zawen* 杂文), 1918–1936.
- Bilingual Chinese/Portuguese scholarly reading experience
- 17 collections in the database (including Wild Grass prose poems)
- Essay pages show: original Chinese (原文), modern Chinese (现代汉语), Pinyin, Portuguese translation
- Metadata: pseudonyms used, publication venue, historical context, genre tags, translator notes
- Full-text search and filtering by collection, type, difficulty
- Themed with ink-stained library aesthetic (Noto Serif SC + Playfair Display fonts, aged paper palette)

### api-server (Preview: `/api`)
Shared Express 5 backend with endpoints for:
- `GET /api/collections` — All 17 collections
- `GET /api/collections/:slug` — Single collection
- `GET /api/collections/:slug/essays` — Essays in a collection
- `GET /api/essays` — All essays (with search/filter)
- `GET /api/essays/featured` — Featured essays
- `GET /api/essays/:essayId` — Full essay with content
- `GET /api/stats` — Archive statistics

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally
- `pnpm --filter @workspace/lu-xun-essays run dev` — run frontend locally

## Database Schema

- `collections` table — 17 Lu Xun essay collections
- `essays` table — individual essays with full metadata and content

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
