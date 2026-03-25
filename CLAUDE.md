# Sultana's Kitchen — Claude Code Instructions

## Project Overview
A full-stack application for a personal chef / catering business. Consists of a public-facing website and a Telegram-based AI agent that lets the owner manage menu, recipes, and CRM.

## Monorepo Structure
```
sultana-dining/
├── apps/
│   ├── web/          # Next.js 14 (App Router) — public site + CRM dashboard
│   └── agent/        # Telegram bot + Claude agent (Node.js service)
├── packages/
│   └── db/           # Shared Drizzle ORM schema + DB client
├── docker-compose.yml
├── CLAUDE.md
└── DEV_PROCESS.md
```

## Tech Stack
- **Runtime**: Node.js, TypeScript throughout
- **Package manager**: pnpm (workspaces)
- **Frontend**: Next.js 14 (App Router), Tailwind CSS, shadcn/ui, Embla Carousel
- **Auth**: NextAuth.js (credentials provider, session-based, protects CRM routes)
- **Database**: PostgreSQL (self-hosted via Docker), Drizzle ORM
- **Agent**: Telegram bot via `telegraf`, Claude API (`claude-sonnet-4-6`) with tool use
- **File storage**: Local filesystem (dev) / volume-mounted (prod) — no platform lock-in
- **Deployment**: Docker Compose (web + agent + postgres as a single stack)

## Key Commands
```bash
pnpm install              # install all workspace deps
pnpm dev                  # run all apps in parallel (turbo or concurrently)
pnpm --filter web dev     # run web app only
pnpm --filter agent dev   # run agent only
pnpm db:push              # push Drizzle schema to DB
pnpm db:studio            # open Drizzle Studio (DB GUI)
docker compose up -d      # start postgres container
```

## Environment Variables
All secrets live in `.env` files (never committed). See `.env.example` for the full list.

Key vars:
- `DATABASE_URL` — postgres connection string
- `ANTHROPIC_API_KEY` — Claude API key
- `TELEGRAM_BOT_TOKEN` — Telegram bot token
- `NEXTAUTH_SECRET` — NextAuth secret
- `NEXTAUTH_URL` — public URL of the web app
- `WHATSAPP_NUMBER` — phone number for WhatsApp order link
- `ADMIN_EMAIL` / `ADMIN_PASSWORD_HASH` — initial CRM login credentials

## Architecture Decisions
- **Self-hosted Postgres**: No platform lock-in. Docker Compose in dev and prod.
- **Drizzle ORM**: Lightweight, type-safe, schema-first. Schema lives in `packages/db`.
- **NextAuth credentials**: Simple email/password for the owner. No OAuth needed.
- **Agent tool use**: Claude receives structured tools (`update_menu_item`, `add_dish`, `save_recipe`, `list_orders`, `add_client`, `log_order`). Each tool maps directly to a DB operation.
- **Menu updates**: Agent writes to DB → Next.js reads on each request (no cache or revalidation needed for small scale).
- **CRM**: Protected under `/dashboard` route group in Next.js, requires active session.

## Data Model (Drizzle schema in `packages/db/schema.ts`)
```
menu_categories    id, name, display_order, active
menu_items         id, category_id, name, description, price, image_url, active
recipes            id, menu_item_id, ingredients (json), steps (text), notes
clients            id, name, phone, whatsapp, email, notes, created_at
orders             id, client_id, items (json), total, status, event_date, notes, created_at
```

## Styling & Branding
- **Brand**: Sultana's Kitchen — home-cooked cuisine, vegan/vegetarian emphasis
- **Palette**: Warm earthy tones — terracotta, warm cream, olive green, deep aubergine
- **Feel**: Intimate, artisanal, Mediterranean warmth
- **Fonts**: Serif display font for headings (e.g. Playfair Display), clean sans-serif for body
- **No emojis** in UI unless the owner adds them via the agent

## Conventions
- All files: TypeScript strict mode
- Components: Named exports, PascalCase files
- DB queries: Drizzle only — no raw SQL unless absolutely necessary
- Agent tools: Each tool is a separate function in `apps/agent/src/tools/`
- Env access: Only through a validated env module (`env.ts`) — never `process.env` directly in component files
- No `any` types
- Prefer `async/await` over `.then()` chains
