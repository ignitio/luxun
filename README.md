# Arquivo Lu Xun Digital

A bilingual digital archive of Lu Xun's essays — presented in Chinese and Portuguese, with scholarly annotations, historical context, and curatorial tools for ongoing expansion.

---

## About

Lu Xun (鲁迅, 1881–1936) is widely regarded as the founder of modern Chinese literature. His essays — sharp, ironic, and deeply political — documented the turbulence of early 20th-century China and remain urgently relevant today.

This archive makes his work accessible to Portuguese-speaking readers by pairing each essay with its original Chinese text, a modern Chinese rendition, Pinyin transliteration, and a full Portuguese translation. Every essay is placed within its historical moment and annotated with scholarly notes.

The archive currently holds **17 collections** spanning Lu Xun's entire writing career (1918–1936).

---

## Features

### For Readers

- **Bilingual reader** — side-by-side original Chinese (classical and modern), Pinyin, and Portuguese translation, selectable via tabs
- **Collection browser** — all 17 collections organised chronologically, with essay counts and thematic descriptions
- **Essay search** — full-text search across Portuguese titles and content
- **Contextual sidebar** — each essay page shows publication date, venue, pseudonym used (with explanatory note), genre tags, themes, difficulty level, and translator attribution
- **Featured essays** — curated selections highlighted on the home page

### For Curators (Admin Panel)

- **Secure admin login** — username/password authentication with session management
- **Essay dashboard** — table view of all essays with language-availability badges (原 · 现 · 拼 · PT)
- **Manual essay creation** — full form for metadata and all content sections
- **Manual essay editing** — edit any field including the full bilingual text
- **Markdown upload** — upload a single `.md` file or a batch `.zip` to create or update essays in one operation; upload is transactional (all-or-nothing)
- **Collection management** — create, edit, and reorder collections; deletion is blocked while essays are linked
- **Markdown template** — downloadable `.md` template pre-filled with every supported field

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS, shadcn/ui, Wouter, TanStack Query |
| Backend | Express 5, Node.js 24 |
| Database | PostgreSQL (Neon in production) |
| ORM | Drizzle ORM |
| API contract | OpenAPI 3.0 → Orval codegen → Zod schemas + React Query hooks |
| Build | pnpm workspaces, esbuild (backend), Vite (frontend) |
| Testing | Playwright E2E |
| Deployment | Render (single web service), Neon (managed PostgreSQL) |

---

## Running Locally

### Prerequisites

- Node.js 20+ (tested on v24)
- pnpm
- Docker (for the database), or a local PostgreSQL instance

### 1. Start the database

```bash
docker run -d --name essay-archive-db \
  -p 5432:5432 \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=essay_archive \
  postgres:16
```

### 2. Create environment files

**`artifacts/api-server/.env.local`**
```
DATABASE_URL=postgresql://postgres:password@localhost:5432/essay_archive
PORT=8080
ADMIN_USERNAME=luojie
ADMIN_PASSWORD=luxun
ADMIN_REPLIT_USER_IDS=luojie
LOG_LEVEL=debug
NODE_ENV=development
```

**`artifacts/lu-xun-essays/.env.local`**
```
PORT=3000
BASE_PATH=/
NODE_ENV=development
```

### 3. Install dependencies and push the schema

```bash
pnpm install
DATABASE_URL=postgresql://postgres:password@localhost:5432/essay_archive \
  pnpm --filter @workspace/db run push
```

### 4. Start the servers

```bash
# Terminal 1 — backend (port 8080)
pnpm --filter @workspace/api-server run dev

# Terminal 2 — frontend (port 3000)
pnpm --filter @workspace/lu-xun-essays run dev
```

Open **http://localhost:3000**. The admin panel is at **http://localhost:3000/admin** (credentials: `luojie` / `luxun`).

---

## Deploying to Render

See [DEPLOY.md](./DEPLOY.md) for the full step-by-step guide. The short version:

1. Create a PostgreSQL database on [Neon](https://neon.tech)
2. Connect the repository to [Render](https://render.com) via Blueprint — it reads `render.yaml` automatically
3. Set the secret environment variables in the Render dashboard:

| Variable | Value |
|---|---|
| `DATABASE_URL` | Neon connection string |
| `ADMIN_USERNAME` | Your admin username |
| `ADMIN_PASSWORD` | A strong password |
| `ADMIN_REPLIT_USER_IDS` | Same value as `ADMIN_USERNAME` |

4. Trigger a manual deploy — the schema is applied automatically on every start

---

## Adding Content

### Via Markdown upload (recommended for full essays)

Download the template from the admin panel, fill in the YAML frontmatter and content sections, then upload:

```yaml
---
essayId: lx_YYYYMMDD_001
titleZh: 标题
titlePt: Título em Português
collectionSlug: hua-gai-ji-xu-bian
firstPublishedDate: 1926-04-01
pseudonymUsed: null
pseudonymNotePt: null
essayType: ensaio
---

## historical-context
Contexto histórico em português.

## zh-original
原文（古汉语）

## pt
Tradução em português.
```

The parser accepts single `.md` files or a `.zip` of multiple files. Uploads are transactional: if one file in a batch fails validation, the entire batch is rolled back.

### Via manual form

Use **Novo ensaio** in the admin dashboard to create an essay directly in the browser, with separate fields for every metadata value and content section.

---

## Project Structure

```
artifacts/
  api-server/         Express 5 backend → builds to ESM .mjs
  lu-xun-essays/      React 19 SPA → builds to static files served by the backend
lib/
  db/                 Drizzle schema + PostgreSQL connection
  api-spec/           openapi.yaml — single source of truth for the API contract
  api-zod/            Generated Zod schemas (do not edit directly)
  api-client-react/   Generated TanStack Query hooks (do not edit directly)
e2e/                  Playwright E2E tests
```

The API contract lives in `lib/api-spec/openapi.yaml`. After editing it, run:

```bash
pnpm --filter @workspace/api-spec run codegen
```

to regenerate the Zod schemas and React Query hooks in `lib/api-zod` and `lib/api-client-react`.
