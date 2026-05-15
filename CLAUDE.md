# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project

**Sultana Dining** — a Rails 8 app for a private chef & catering business. Two faces:
- **Public site** — home page with hero, image carousel, services, story, and a shop/deli with cart
- **Admin** (future) — manage items, categories, orders

Built for the user's wife's home-cooking business. Personally invested, not a commercial client project.

Stack: **Ruby 3.2.2, Rails 8.1, PostgreSQL, Tailwind CSS v4, Hotwire (Turbo + Stimulus), Importmap.** No Node build step.

## Commands

```bash
./bin/dev                         # Rails + Tailwind watcher via Foreman (port 3000 by default)
PORT=3001 ./bin/dev               # If 3000 is taken
bin/rails tailwindcss:build       # One-off Tailwind build
bin/rails db:create db:migrate    # Set up databases
bin/rails console                 # REPL
```

The sibling `sultana` project also runs on port 3000, so use `PORT=3001` if both are running.

## Design system

All design tokens live in `app/assets/tailwind/application.css` via Tailwind v4's `@theme` directive.

**Palette** — desert-inspired:
- `sand-*` — warm neutrals, page backgrounds, surfaces
- `clay-*` — terracotta accents, primary buttons, highlights
- `succulent-*` — dusty sage greens, decorative foliage

**Type** — `font-display` (Fraunces serif) for headings, `font-sans` (Inter) for body.

**Reusable component classes** (defined in `@layer components`):
- `.btn-primary` / `.btn-secondary` / `.btn-ghost` — pill buttons
- `.chip` / `.chip-active` — filter pill style
- `.card` — rounded surface with subtle ring
- `.section` — page container (max-w-7xl, responsive padding)
- `.eyebrow` — small uppercase label above headings

**Tailwind v4 gotcha:** `@apply` cannot reference custom (non-Tailwind) classes. To share styles across variants, list them with a comma and `@apply` the shared utilities once, then add variant-specific utilities in separate rules. See `.btn-*` in `application.css` for the pattern.

## Succulent decorations

`app/views/shared/_succulent.html.erb` is a reusable SVG partial with three variants:

```erb
<%= render "shared/succulent", variant: :rosette, class: "h-10 w-10 text-succulent-400" %>
<%= render "shared/succulent", variant: :sprig,   class: "h-20 w-20 text-succulent-300" %>
<%= render "shared/succulent", variant: :prickly, class: "h-24 w-24 text-succulent-400/60" %>
```

All variants use `currentColor`, so set the color via a wrapper `text-*` class or pass it in `class:`. Use them as decorative accents — sprinkle in corners, behind hero text, in section dividers. Lower opacity (`/30`, `/50`) keeps them subtle.

## Layout

`app/views/layouts/application.html.erb` renders:
- `shared/navbar` (transparent, absolute over hero)
- `<main>` with `yield`
- `shared/footer` (sand-100, two decorative succulents at the top edge)

Google Fonts (Fraunces + Inter) are loaded from the layout.

## Carousel

`app/javascript/controllers/carousel_controller.js` — Stimulus controller for the hero image carousel.

- Targets: `slide` (each panel), `dot` (pagination dot)
- Values: `index` (current slide, default 0), `interval` (ms, default 5000)
- Actions: `next`, `prev`, `goTo` (reads `data-index` on the clicked dot)
- Auto-advances; pauses on `mouseenter`, resumes on `mouseleave`

The home page currently uses **CSS gradient placeholders** inside each slide so the carousel works before real photos exist. Swap each slide's inner content with `<img>` tags when photos are ready.

## Phase plan

We are building the app in phases:

**Phase 1 — DONE** ✅
- Design system, navbar, footer
- Home page: hero, carousel, services, story, CTA

**Phase 2 — Shop foundation** (next)
- `Category` and `Item` models
- Active Storage for item images
- Shop grid page at `/shop` with category filter chips
- Responsive grid (device-adjustable)

Pending decisions for Phase 2 (the user should confirm before starting):
1. `Item` fields beyond name/description/price/category/available — proposed: `unit` (e.g. "9×13 pan", "dozen", "per person") and `serves` (Integer).
2. Confirm `Category` as a dedicated model (admin-editable later) vs. enum/string. Recommendation: dedicated model.
3. Confirm Active Storage for images. Recommendation: yes.
4. Confirm `/shop` as the path. Alternatives: `/deli`, `/menu`.

**Phase 3 — Cart**
- Session-based cart (no auth yet)
- Add/remove/update, cart drawer with Turbo Frames

## Conventions

- Tailwind utilities first; reach for shared component classes (`.btn-primary` etc.) only when a pattern repeats meaningfully
- Use the `.section` class on top-level content containers for consistent horizontal rhythm
- Decorative SVGs should be `aria-hidden="true"` and use opacity + `pointer-events-none` so they never block interaction
- Stimulus controllers are auto-loaded from `app/javascript/controllers/` — no manual registration needed
- Occam's razor: prefer the simplest solution that works
