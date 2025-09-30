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
- Migrate: `pnpm prisma migrate dev -n "migration_name"`

### Data Model Architecture

The system follows this flow: **Ingredients → Dishes → Menu Items → Menus → Events → Clients**

#### Core Models

```prisma
model User {
  id            String   @id @default(cuid())
  email         String   @unique
  displayName   String?
  googleId      String?  @unique
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  dishes        Dish[]
  menus         Menu[]
  events        Event[]
  clients       Client[]
}

model Ingredient {
  id            String   @id @default(cuid())
  name          String   @unique
  unit          String   // e.g., "kg", "L", "units", "grams"
  pricePerUnit  Float    // Current price per unit
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  dishIngredients DishIngredient[]
}

model Dish {
  id            String   @id @default(cuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id])
  name          String
  recipeText    String?  @db.Text  // Original recipe text
  servings      Int      // How many people this dish serves
  laborCost     Float    @default(0)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  ingredients   DishIngredient[]
  menuItemDishes MenuItemDish[]
}

model DishIngredient {
  id            String   @id @default(cuid())
  dishId        String
  ingredientId  String
  quantity      Float    // Quantity needed for the dish
  dish          Dish     @relation(fields: [dishId], references: [id], onDelete: Cascade)
  ingredient    Ingredient @relation(fields: [ingredientId], references: [id])
  createdAt     DateTime @default(now())

  @@unique([dishId, ingredientId])
}

model Menu {
  id            String   @id @default(cuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id])
  title         String
  servingCount  Int      // General number of people this menu serves
  notes         String?  @db.Text
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  items         MenuItem[]
  events        Event[]
}

model MenuItem {
  id              String   @id @default(cuid())
  menuId          String
  menu            Menu     @relation(fields: [menuId], references: [id], onDelete: Cascade)
  name            String   // Display name for this menu item (e.g., "Main Course: Stew with Rice")
  servingQuantity Int      @default(1)  // How many servings of this item
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  dishes          MenuItemDish[]
}

model MenuItemDish {
  id          String   @id @default(cuid())
  menuItemId  String
  dishId      String
  menuItem    MenuItem @relation(fields: [menuItemId], references: [id], onDelete: Cascade)
  dish        Dish     @relation(fields: [dishId], references: [id])
  createdAt   DateTime @default(now())

  @@unique([menuItemId, dishId])
}

model Client {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  name        String
  email       String?
  phone       String?
  notes       String?  @db.Text
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  events      Event[]
}

model Event {
  id              String   @id @default(cuid())
  userId          String
  clientId        String?
  menuId          String?
  user            User     @relation(fields: [userId], references: [id])
  client          Client?  @relation(fields: [clientId], references: [id])
  menu            Menu?    @relation(fields: [menuId], references: [id])
  title           String
  eventDate       DateTime?
  guestCount      Int?
  additionalCosts Json?    // { "cleaning": 500, "bar": 1000, "equipment": 300, ... }
  notes           String?  @db.Text
  status          String   @default("draft")  // "draft", "proposal_sent", "confirmed", "completed"
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

### Key Design Decisions

1. **Ingredients are foundational**: Food costs are calculated dynamically by joining dish ingredients with current ingredient prices
2. **Dishes have recipes**: Free-text recipes stored for LLM parsing, with structured ingredients in join table
3. **Menu items can have multiple dishes**: A single menu item (e.g., "Main Course") can include multiple dishes (stew + rice)
4. **Menus track serving count**: Overall people count at menu level, with per-item serving quantities
5. **Events are the final proposal**: Tie together menu, client, and additional costs (cleaning, bar, etc.) stored as JSON
6. **Flexible additional costs**: JSON column allows arbitrary cost categories without schema changes

---

## 6) API Server

### Auth
- **Google OAuth flow**
  - iOS uses Google SDK to get ID token
  - API verifies ID token with Google, creates/updates user, issues JWTs

### API Endpoints

#### Auth
- `POST /auth/google` - Login with Google ID token
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Logout and clear refresh token

#### Users
- `GET /users/me` - Get current user profile
- `PATCH /users/me` - Update user profile

#### Ingredients
- `POST /ingredients` - Create ingredient
- `GET /ingredients` - List all ingredients (paginated)
- `GET /ingredients/:id` - Get single ingredient
- `PATCH /ingredients/:id` - Update ingredient (name, unit, price)
- `DELETE /ingredients/:id` - Delete ingredient

#### Dishes
- `POST /dishes` - Create dish from recipe text
  - Body: `{ name, recipeText, servings, laborCost? }`
  - Recipe text stored as-is for future LLM parsing
  - Initially creates dish without ingredients
- `POST /dishes/:id/parse-recipe` - Parse recipe with LLM (future)
  - Extracts ingredients, matches or creates them
  - Updates dish with ingredient associations
- `POST /dishes/:id/ingredients` - Manually add ingredient to dish
  - Body: `{ ingredientId, quantity }`
- `GET /dishes` - List dishes with calculated food costs
- `GET /dishes/:id` - Get dish with ingredients and total cost
- `PATCH /dishes/:id` - Update dish details
- `DELETE /dishes/:id` - Delete dish
- `DELETE /dishes/:id/ingredients/:ingredientId` - Remove ingredient from dish

#### Menus
- `POST /menus` - Create menu
  - Body: `{ title, servingCount, notes?, items: [{ name, servingQuantity, dishIds: [] }] }`
- `GET /menus` - List user's menus
- `GET /menus/:id` - Get menu with items, dishes, and cost breakdown
- `PATCH /menus/:id` - Update menu
- `DELETE /menus/:id` - Delete menu

#### Clients
- `POST /clients` - Create client
- `GET /clients` - List user's clients
- `GET /clients/:id` - Get client details
- `PATCH /clients/:id` - Update client
- `DELETE /clients/:id` - Delete client

#### Events
- `POST /events` - Create event/proposal
  - Body: `{ title, clientId?, menuId?, eventDate?, guestCount?, additionalCosts?, notes?, status? }`
- `GET /events` - List user's events
- `GET /events/:id` - Get event with full cost breakdown
- `GET /events/:id/proposal` - Generate proposal calculation
  - Returns: menu costs × guest count + additional costs
- `PATCH /events/:id` - Update event
- `DELETE /events/:id` - Delete event

### User Flows

#### 1. Creating a Dish
1. User inputs free-text recipe and serving count
2. API stores recipe text as-is in `Dish.recipeText`
3. (Future) LLM parses recipe, matches/creates ingredients
4. Ingredients linked via `DishIngredient` join table
5. Food cost calculated dynamically: `SUM(ingredient.pricePerUnit × dishIngredient.quantity)`

#### 2. Creating a Menu
1. User creates menu with serving count and notes
2. For each menu item (e.g., "Main Course"):
   - Assign a display name
   - Set serving quantity
   - Link one or more dishes
3. Cost calculated by aggregating all dish costs × quantities

#### 3. Creating an Event
1. User creates event and associates with client
2. Links menu to event
3. Sets guest count
4. Adds additional costs (cleaning, bar, etc.) as JSON
5. Final proposal: `(menu total ÷ menu.servingCount × event.guestCount) + additionalCosts`

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
