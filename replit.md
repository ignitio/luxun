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
- `users` + `sessions` tables — Replit Auth session/user storage (mandatory)

## Painel administrativo

A rota `/admin` exibe um painel de curadoria protegido por Replit Auth.

### Como conceder acesso
Defina o secret `ADMIN_REPLIT_USER_IDS` com a lista (CSV) de IDs Replit
autorizados — por exemplo `ADMIN_REPLIT_USER_IDS=abc123,def456`. Apenas usuários
logados cujo `id` esteja nessa lista veem o dashboard; os demais recebem
"Acesso negado".

### Fluxos suportados
- Listar todos os ensaios com badges 原 / 现 / 拼 / PT indicando quais versões
  linguísticas existem.
- Enviar arquivo `.md` para criar um novo ensaio ou completar versões de um
  ensaio existente (upsert por `essayId`).
- Pré-visualizar o parse antes de confirmar a publicação.
- Editar metadados de um ensaio sem upload (`/admin/essays/:essayId/edit`).
- Excluir um ensaio (recalcula `essayCount` da coleção).
- Baixar um modelo Markdown comentado (`GET /api/admin/template.md`).

### Formato Markdown aceito
Frontmatter YAML obrigatório + seções H2 com slugs fixos. Apenas
`essayId` é sempre obrigatório; para criar um ensaio novo são também exigidos
`titlePt`, `titleZh` e `collectionSlug`. Para complementar um ensaio existente
basta `essayId` + as seções/campos desejados — campos ausentes não sobrescrevem
valores já gravados.

```markdown
---
essayId: lx_19260401_001
titleZh: 记念刘和珍君
titlePt: Em Memória da Senhorita Liu Hezhen
titlePinyin: Jì Niàn Liú Hé Zhēn Jūn
collectionSlug: hua-gai-ji-xu-bian
firstPublishedDate: 1926-04-01
firstPublishedVenuePt: Yusi (Fio de Linguagem)
pseudonymUsed: null
essayType: ensaio
genreTagsPt: [memória, crítica política, luto]
themesPt: [violência estatal, coragem feminina]
difficultyLevel: advanced
isFeatured: true
translatorName: Arquivo Lu Xun Digital
sourceTextEdition: 鲁迅全集 (2005版), Vol. 3
---

## historical-context
...

## zh-original
...

## zh-modern
...

## pinyin
...

## pt
...

## translation-notes
...
```

`wordCountPt`, `wordCountZh` e `estimatedReadingTime` são calculados
automaticamente a partir das seções presentes.

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
