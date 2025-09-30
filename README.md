# Sultana Dinine

## 1) Overview
A mobile-first tool for chefs at a desert resort to quickly compose proposal menus with automatic cost calculations and clean, client-ready proposals.

### MVP User Story
> As a chef at a desert resort, I want to quickly create custom (but repeatable) proposal menus with automatic calculations for food costs, labor costs, and per-head pricing, so that I can efficiently prepare accurate event offers for clients.

**Acceptance Criteria**
- Select dishes from a predefined list or add custom dishes.
- Automatic food cost, labor cost, and total menu cost calculation.
- Show price-per-head for the event.
- Adjust portion sizes or pricing parameters and see updates immediately.
- Generate a proposal document (PDF/shareable).
- Save frequently used menus as templates.

**Goal**
- A **clean, sleek UI** that’s easy for a non-technical person to use.

**Non-Goals (for now)**
- Android client
- Web client
- Multi-tenant org roles/permissions beyond basic owner

---

## 2) Architecture

Monorepo with two apps:

```
/
├─ api/                 # Node.js (TypeScript) API (Heroku-ready)
├─ mobile-ios/          # iOS app (SwiftUI, iOS 17+)
├─ docs/                # Design docs, API schema snapshots
└─ README.md
```

**Tech choices**
- **API:** Node.js 20 + TypeScript, Fastify, Prisma (Postgres), Zod, Pino
- **Auth:** Google OAuth (one-tap/sign-in on iOS) → backend mints JWT (access/refresh)
- **DB:** PostgreSQL 15+ (Heroku Postgres), Prisma migrations
- **iOS:** SwiftUI + MVVM, URLSession (async/await), Keychain for token, PDFKit share/export
- **Testing:** Vitest (API), XCTest (iOS)
- **CI:** GitHub Actions (build, test, lint)
- **Deploy:** Heroku (API), TestFlight (iOS)

> If we later want cross-platform, we can swap the iOS client for React Native; API stays the same.

---

## 3) Environment & Tooling

### Prereqs
- Node 20.x, pnpm 9.x
- PostgreSQL 15+
- Xcode 15+
- (Optional) asdf for runtime management

### Env files
- `api/.env` (copy from `api/.env.example`)
- `mobile-ios/Config.xcconfig` (copy from `mobile-ios/Config.example.xcconfig`)

**`api/.env.example`**
```
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DB_NAME

# JWTs minted by backend
JWT_ACCESS_SECRET=change-me
JWT_REFRESH_SECRET=change-me
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=7d

# Google OAuth
GOOGLE_OAUTH_CLIENT_ID=ios_or_web_client_id.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_ID_IOS=ios_client_id.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=only_needed_for_web_code_flow

CORS_ORIGIN=http://localhost:5173
```

**`mobile-ios/Config.example.xcconfig`**
```
API_BASE_URL = http://localhost:3000
GOOGLE_CLIENT_ID = ios_client_id.apps.googleusercontent.com
BUILD_ENV = DEBUG
```

---

## 4) Local Development

### API
```bash
cd api
pnpm install
pnpm prisma migrate dev
pnpm dev
```

### iOS
- Open `mobile-ios/App.xcodeproj`
- Set signing team, set `GOOGLE_CLIENT_ID`
- Select a simulator and run

---

## 5) Database (PostgreSQL)

We use Prisma to model tables and run migrations.

- Schema file: `api/prisma/schema.prisma`
- Generate client: `pnpm prisma generate`
- Migrate: `pnpm prisma migrate dev -n "init"`

### Initial Models (Draft)
```prisma
model User {
  id            String   @id @default(cuid())
  email         String   @unique
  displayName   String?
  googleId      String?  @unique
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  menus         Menu[]
}

model Menu {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  title     String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  items     MenuItem[]
}

model Dish {
  id          String   @id @default(cuid())
  name        String
  foodCost    Float
  laborCost   Float
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  menuItems   MenuItem[]
}

model MenuItem {
  id        String   @id @default(cuid())
  menuId    String
  dishId    String
  menu      Menu     @relation(fields: [menuId], references: [id])
  dish      Dish     @relation(fields: [dishId], references: [id])
  portions  Int      @default(1)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

---

## 6) API Server

### Auth
- **Google OAuth flow**
  - iOS uses Google SDK to get ID token
  - API verifies ID token with Google, creates/updates user, issues JWTs

### Endpoints (Draft)

#### Auth
- `POST /auth/google`  
  - Body: `{ idToken }`  
  - 200 → `{ user, accessToken }` (+ refresh cookie)

#### Users
- `GET /me` → current user profile

#### Dishes
- `POST /dishes` → create dish
- `GET /dishes` → list dishes
- `PATCH /dishes/:id` → update dish
- `DELETE /dishes/:id` → remove dish

#### Menus
- `POST /menus` → create menu with items
- `GET /menus` → list menus
- `GET /menus/:id` → get details with calculated totals
- `PATCH /menus/:id` → update menu/items
- `DELETE /menus/:id` → remove menu

#### Proposals
- `POST /menus/:id/proposal` → generate PDF / share link

---

## 7) iOS App

### Target
- iOS 17+, SwiftUI + SwiftData, PDFKit for proposal export

### Navigation Flow
- **Unauthenticated**
  - Google Sign-in → Register display name
- **Authenticated**
  - Home: List of menus/templates
  - Create/Edit Menu: select dishes, portions
  - Proposal: preview totals, generate/share PDF
  - Profile

### UI Goals
- Minimal, clean, professional
- Simple buttons & tabs
- Dark mode support
- Accessibility labels

---

## 8) Security
- Passwordless login: Google Auth only
- JWT access/refresh with rotation
- Secure cookies for refresh token
- HTTPS-only in production

---

## 9) Deployment

### API → Heroku
- Procfile:
  ```
  web: node dist/index.js
  ```
- Release phase runs migrations

### iOS → TestFlight
- Archive in Xcode → Distribute to App Store Connect

---

## 10) License
MIT License © [YeshMeAin](https://github.com/YeshMeAin)
