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

## Entry 001 — (next entry goes here)

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
