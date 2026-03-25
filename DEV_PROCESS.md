# Sultana's Kitchen — Development Process Log

This document tracks every meaningful development change in structured entries.
Each entry is a phase or logical unit of work — not necessarily a single commit.

---

## Entry 000 — Project Definition
**Date**: 2026-03-25
**Type**: Architecture Decision

### Summary
Defined the full project scope and architecture for Sultana's Kitchen.

### Decisions Made
- **Monorepo** with pnpm workspaces: `apps/web`, `apps/agent`, `packages/db`
- **Next.js 14** (App Router) for the website
- **Self-hosted PostgreSQL** via Docker — no platform lock-in
- **Drizzle ORM** for type-safe schema-first DB access
- **NextAuth.js** (credentials) for CRM auth — protects `/dashboard` routes
- **Telegram bot** (`telegraf`) + **Claude API** (`claude-sonnet-4-6`) for the Sultana agent
- **Docker Compose** as the unified deployment unit (postgres + web + agent)
- TypeScript throughout, pnpm workspaces, strict mode

### Scope Confirmed
1. Public landing page — carousel, branding, hero section
2. Menu page — reads from DB, WhatsApp order link (number in ENV)
3. CRM dashboard — orders, clients, protected by login
4. Sultana agent — Telegram chat → Claude → DB tools (menu, recipes, CRM)

### Files Created
- `CLAUDE.md` — persistent instructions for Claude Code
- `DEV_PROCESS.md` — this file

---

## Entry 001 — Monorepo Skeleton
**Date**: 2026-03-25
**Type**: Config

### Summary
Scaffolded the full monorepo structure with pnpm workspaces, shared DB package with Drizzle ORM schema, Docker Compose for Postgres, and app stubs for web and agent. No app logic yet — this establishes the foundation everything else builds on.

### Changes
- `pnpm-workspace.yaml` — workspace definition
- `package.json` — root scripts (`dev`, `build`, `db:push`, `db:studio`)
- `tsconfig.base.json` — strict TS config shared across all packages
- `.gitignore` — ignores node_modules, .env, .next, dist, drizzle/
- `.env.example` — all required env vars documented with placeholders
- `docker-compose.yml` — postgres service (always on) + web/agent (prod profile only)
- `packages/db/package.json` — drizzle-orm, postgres driver, drizzle-kit
- `packages/db/tsconfig.json`
- `packages/db/drizzle.config.ts`
- `packages/db/src/schema.ts` — full Drizzle schema: menu_categories, menu_items, recipes, clients, orders + all relations
- `packages/db/src/client.ts` — postgres.js + drizzle client, exported as `db`
- `packages/db/src/index.ts` — barrel export
- `apps/web/package.json` — Next.js 14, NextAuth, Embla Carousel, Tailwind stubs
- `apps/agent/package.json` — Anthropic SDK, Telegraf, tsx for dev

### Notes
- Docker Compose uses `profiles: [prod]` for web/agent so `docker compose up` in dev only starts postgres
- `packages/db` uses `"type": "module"` with `.js` extensions in imports for ESM compatibility
- App Dockerfiles not yet written — deferred to when apps are scaffolded

## Entry 002 — (next entry goes here)

---

<!-- TEMPLATE FOR NEW ENTRIES:
## Entry NNN — <Title>
**Date**: YYYY-MM-DD
**Type**: Feature | Fix | Refactor | Config | Architecture Decision

### Summary
One paragraph describing what was done and why.

### Changes
- List of files created / modified / deleted

### Notes
- Anything worth remembering: gotchas, deferred decisions, known issues
-->
