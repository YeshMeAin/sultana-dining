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

## Entry 002 — Next.js Web App Scaffold + Local Dev Setup
**Date**: 2026-03-25
**Type**: Feature

### Summary
Full Next.js 14 (App Router) web application scaffolded: landing page with carousel, menu page reading live from DB, login page, and CRM dashboard overview. Local dev workflow established with seed script and admin hash generator.

### Changes
**apps/web:**
- `tsconfig.json` — extends base, Bundler moduleResolution for Next.js
- `next.config.mjs` — transpilePackages for @sultana/db
- `tailwind.config.ts` — custom palette: cream, terracotta, olive, aubergine, warm-brown
- `postcss.config.js`
- `src/app/globals.css` — Tailwind base styles, custom selection color
- `src/app/layout.tsx` — Playfair Display + Inter fonts, global Nav and Footer
- `src/app/page.tsx` — Landing page: hero, Carousel, About section, CTA strip
- `src/app/menu/page.tsx` — Server component, live DB query, grouped by category, WhatsApp CTA
- `src/app/login/page.tsx` — Credentials login form with NextAuth
- `src/app/dashboard/layout.tsx` — Auth-gated layout with tab nav
- `src/app/dashboard/page.tsx` — CRM overview: stats + recent orders
- `src/app/api/auth/[...nextauth]/route.ts` — NextAuth handler
- `src/components/Nav.tsx` — Fixed top nav with Order Now WhatsApp link
- `src/components/Carousel.tsx` — Embla carousel with autoplay, dot indicators, CSS gradient placeholders
- `src/lib/env.server.ts` — Validated server env
- `src/lib/auth.ts` — NextAuth config with bcrypt credentials provider
- `middleware.ts` — Protects /dashboard/* via NextAuth

**packages/db:**
- `src/client.ts` — Added singleton pattern (prevents connection exhaustion in dev hot reload)
- `src/seed.ts` — Sample Mediterranean menu (11 items across 4 categories) + placeholder client
- `package.json` — Added @types/node devDep (fixes IDE diagnostics)

**apps/agent:**
- `src/index.ts` — Stub (scaffolded in Entry 003)
- `tsconfig.json`

**Root:**
- `package.json` — Added `db:seed`, `gen:secret`, `gen:admin-hash` scripts
- `scripts/gen-admin-hash.ts` — One-time bcrypt hash generator for admin password

### Local Dev Workflow
```bash
# 1. Copy env and fill in DB + auth vars
cp .env.example .env

# 2. Generate NEXTAUTH_SECRET
pnpm gen:secret   # paste output into .env as NEXTAUTH_SECRET

# 3. Generate admin password hash
pnpm gen:admin-hash yourPassword   # paste into .env as ADMIN_PASSWORD_HASH

# 4. Start postgres
docker compose up -d

# 5. Install deps
pnpm install

# 6. Push schema to DB
pnpm db:push

# 7. Seed sample data
pnpm db:seed

# 8. Start dev servers
pnpm --filter web dev   # runs Next.js on :3000
```

### Notes
- Menu page uses `force-dynamic` so agent edits appear immediately without cache invalidation
- Carousel uses CSS gradient placeholders until real dish images are uploaded
- Dashboard orders/clients pages deferred to Entry 004 (after agent is built)
- `NEXT_PUBLIC_WHATSAPP_NUMBER` used for client-side WhatsApp links

## Entry 003 — (next entry goes here)

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
