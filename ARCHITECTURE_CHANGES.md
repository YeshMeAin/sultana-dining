# Architecture Changes Summary

## Overview
Updated data model to support ingredient-based costing, recipe parsing, multi-dish menu items, and event management.

## Key Changes from Original Design

### 1. Ingredients System
**Before**: Dishes had hardcoded `foodCost` and `laborCost` fields.

**After**:
- New `Ingredient` table with `name`, `unit`, `pricePerUnit`
- `DishIngredient` join table linking dishes to ingredients with quantities
- Food costs calculated dynamically from current ingredient prices
- Supports price updates without touching dishes

**Benefits**:
- Real-time cost updates when ingredient prices change
- Better inventory management
- More accurate costing

### 2. Dish Creation Flow
**Before**: Create dish with name and costs.

**After**:
- Store free-text recipe (`recipeText` field)
- Store serving count
- Keep `laborCost` as manual input
- LLM parsing endpoint (future) to extract and match ingredients
- Manual ingredient addition supported

**Benefits**:
- Natural recipe input for chefs
- Preserves original recipe for reference
- Flexible ingredient management

### 3. Menu Structure
**Before**: Menu → MenuItems → Dish (1:1 relationship)

**After**: Menu → MenuItems → MenuItemDish → Dish (many-to-many)

- Menu has `servingCount` (total people) and `notes`
- MenuItem has `name` (display name like "Main Course")
- MenuItem has `servingQuantity`
- MenuItem can link to multiple dishes via `MenuItemDish`

**Example**:
```
Menu: "Wedding Dinner" (serves 100)
  └─ MenuItem: "Main Course" (quantity: 1)
      ├─ Dish: "Beef Stew"
      └─ Dish: "Basmati Rice"
```

**Benefits**:
- Matches real-world menu structure
- One menu item can combine multiple dishes
- Clear serving quantities

### 4. Client Management
**New**: `Client` table with:
- name, email, phone
- notes for client preferences/history
- Links to events

**Benefits**:
- Client relationship tracking
- Historical data for repeat clients
- Better proposal management

### 5. Events & Proposals
**New**: `Event` table as the final proposal entity

- Links menu, client, and costs
- `guestCount` for scaling menu costs
- `additionalCosts` JSON field for flexible cost categories
  - Examples: cleaning, bar, equipment, staff, transportation
- `eventDate` for scheduling
- `status` field: "draft", "proposal_sent", "confirmed", "completed"

**Cost Calculation**:
```
Total = (Menu Cost ÷ Menu Serving Count × Event Guest Count) + Additional Costs
```

**Benefits**:
- Complete proposal system
- Flexible cost categories
- Status tracking for workflow
- Historical event data

## Data Flow

```
1. Create Ingredients
   ↓
2. Create Dish (with recipe text + servings)
   ↓
3. Add Ingredients to Dish (manual or LLM-parsed)
   ↓
4. Create Menu Items (group dishes together)
   ↓
5. Create Menu (combine menu items + serving count)
   ↓
6. Create Client (optional but recommended)
   ↓
7. Create Event (menu + client + guests + additional costs)
   ↓
8. Generate Proposal (automatic cost calculation)
```

## Migration Strategy

### Phase 1 (Current Implementation)
- ✅ Basic CRUD already exists
- ❌ Uses old schema (needs replacement)

### Phase 2 (New Implementation)
1. Update Prisma schema with new models
2. Create migration (will require data migration strategy for existing data)
3. Update all routes to new schema
4. Implement new endpoints (ingredients, clients, events)
5. Update calculation service for new cost model

### Phase 3 (Future - LLM Integration)
1. Add LLM service for recipe parsing
2. Implement `POST /dishes/:id/parse-recipe` endpoint
3. Add ingredient matching/creation logic
4. UI for reviewing/confirming parsed ingredients

## API Changes Required

### New Routes Needed
- `/ingredients` - Full CRUD
- `/dishes/:id/ingredients` - Add/remove ingredients from dish
- `/clients` - Full CRUD
- `/events` - Full CRUD
- `/events/:id/proposal` - Generate proposal calculation

### Updated Routes
- `/dishes` - Add recipe text and servings, remove hardcoded costs
- `/menus` - Update to support new structure with serving count and notes

### Deprecated
- Old cost calculation logic based on hardcoded dish costs
- Direct dish-to-menu-item relationship

## Questions & Suggestions

### Suggestions
1. **Ingredient categories**: Add `category` field to Ingredient (produce, meat, dairy, spices, etc.) for better organization
2. **Price history**: Consider `IngredientPriceHistory` table to track price changes over time
3. **Units standardization**: Enforce unit types (weight, volume, count) to prevent mixing incompatible units
4. **Menu templates**: Add `isTemplate` boolean to Menu for saving frequently used menus
5. **Event deposits**: Add `deposit` and `balance` fields to Event for payment tracking
6. **Status transitions**: Consider adding `statusHistory` JSON to track who/when changed status

### Questions for Clarification
1. Should ingredients be user-specific or shared across all users?
   - **Suggestion**: Start shared (simpler), add user-specific later if needed
2. Should there be a base ingredient library that users can't edit?
   - **Suggestion**: Admin-managed ingredient library + user overrides
3. How to handle seasonal/variable pricing?
   - **Suggestion**: Manual updates for now, automated pricing later
4. Should events have revision history for proposals?
   - **Suggestion**: Add `version` field and `EventRevision` table if needed

## Next Steps

1. Review and approve architecture changes
2. Update Prisma schema
3. Plan data migration for existing data (if any)
4. Implement new routes in priority order:
   - Ingredients (foundational)
   - Updated Dishes (core functionality)
   - Updated Menus (core functionality)
   - Clients (nice to have)
   - Events (complete proposal system)
