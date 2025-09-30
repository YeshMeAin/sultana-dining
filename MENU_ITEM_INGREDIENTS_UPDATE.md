# Menu-Specific Ingredient Customization - Implementation Complete ✅

## Overview

Updated the architecture to support **menu-specific ingredient customization**. Each dish assignment in a menu can now have its own ingredient list, allowing chefs to customize ingredients per menu without affecting the original dish.

## Key Changes

### 1. Schema Update

**MenuItemDish** now has an `ingredients` JSON field:

```prisma
model MenuItemDish {
  id          String   @id @default(cuid())
  menuItemId  String
  dishId      String
  menuItem    MenuItem @relation(...)
  dish        Dish     @relation(...)
  ingredients Json?    // [{ ingredientId, quantity }]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

**Data stored as**: `[{ "ingredientId": "abc", "quantity": 2.5 }, ...]`

### 2. Ingredient Copying Flow

When a dish is added to a menu:

1. **Fetch dish** with its default ingredients
2. **Copy ingredients** from `DishIngredient` table to `MenuItemDish.ingredients` JSON
3. **Store as JSON** for easy per-menu customization

### 3. New Endpoints

#### Get MenuItemDish Ingredients
```
GET /menus/item-dishes/:menuItemDishId/ingredients
```
Returns ingredients with full details fetched from the Ingredient table.

#### Replace All Ingredients
```
PUT /menus/item-dishes/:menuItemDishId/ingredients
Body: { ingredients: [{ ingredientId, quantity }, ...] }
```
Completely replaces the ingredient list for this menu item dish.

#### Add/Update Single Ingredient
```
POST /menus/item-dishes/:menuItemDishId/ingredients
Body: { ingredientId, quantity }
```
Adds a new ingredient or updates quantity if it already exists.

#### Remove Ingredient
```
DELETE /menus/item-dishes/:menuItemDishId/ingredients/:ingredientId
```
Removes an ingredient from this menu item dish.

### 4. Calculation Updates

**`calculateMenuCosts(menu, ingredientMap)`**
- Now takes an `ingredientMap` parameter (Map<ingredientId, ingredientDetails>)
- Reads ingredients from `MenuItemDish.ingredients` JSON instead of `Dish.ingredients`
- Fetches all required ingredients in **one query** for efficiency

**`calculateEventProposal(event, ingredientMap)`**
- Also updated to pass `ingredientMap` through to menu calculation

### 5. Route Updates

**POST /menus** and **PATCH /menus**
- Automatically copy dish ingredients to MenuItemDish on creation/update
- Creates ingredient map from fetched dishes
- Stores as JSON in `MenuItemDish.ingredients`

**GET /menus/:id**
- Collects all ingredient IDs from all MenuItemDishes
- Fetches ingredients in one query
- Builds ingredient map
- Passes to calculation service

**GET /events/:id/proposal**
- Same pattern as menu GET

## Usage Example

### 1. Create a dish with default ingredients

```http
POST /dishes
{
  "name": "Beef Stew",
  "recipeText": "Traditional beef stew...",
  "servings": 4,
  "laborCost": 50
}

POST /dishes/:dishId/ingredients
{ "ingredientId": "beef-id", "quantity": 1.5 }

POST /dishes/:dishId/ingredients
{ "ingredientId": "onion-id", "quantity": 0.5 }
```

### 2. Add dish to menu (ingredients auto-copied)

```http
POST /menus
{
  "title": "Wedding Menu",
  "servingCount": 100,
  "items": [
    {
      "name": "Main Course",
      "servingQuantity": 1,
      "dishIds": ["beef-stew-id"]
    }
  ]
}
```

Behind the scenes:
- Fetches "Beef Stew" with ingredients
- Creates MenuItemDish with: `ingredients: [{ "ingredientId": "beef-id", "quantity": 1.5 }, { "ingredientId": "onion-id", "quantity": 0.5 }]`

### 3. Customize ingredients for this menu

```http
# Get the MenuItemDish ID from the menu response
GET /menus/:menuId
# Response includes items[].dishes[].id (this is MenuItemDish ID)

# Add extra garlic just for this menu
POST /menus/item-dishes/:menuItemDishId/ingredients
{ "ingredientId": "garlic-id", "quantity": 0.2 }

# Reduce beef quantity
POST /menus/item-dishes/:menuItemDishId/ingredients
{ "ingredientId": "beef-id", "quantity": 1.0 }
```

### 4. Cost calculation uses menu-specific ingredients

```http
GET /menus/:menuId
# Returns costCalculation based on the customized ingredients
```

## Benefits

✅ **Original dish preserved**: Changes to menu don't affect the base dish
✅ **Menu-specific customization**: Each menu can have different ingredient quantities
✅ **Flexible**: Add ingredients not in the original dish
✅ **Simple**: JSON storage, no extra tables
✅ **Efficient**: Single query to fetch all ingredients for calculation

## Trade-offs

❌ **No foreign key constraints** on JSON ingredients (but we validate on write)
❌ **Can't query by ingredient** (but we don't need to)
❌ **JSON manipulation** in code (but TypeScript makes it safe)

## Data Flow

```
1. Dish.ingredients (DishIngredient table)
   ↓ (copy on menu creation)
2. MenuItemDish.ingredients (JSON field)
   ↓ (customizable per menu)
3. Calculation Service
   ↓ (uses MenuItemDish.ingredients)
4. Cost Breakdown
```

## Migration Required

Run this to add the `ingredients` JSON field:

```bash
cd api
pnpm prisma migrate dev --name add_menu_item_dish_ingredients
```

## Testing

Test the full flow:
1. ✅ Create dish with ingredients
2. ✅ Create menu (verifies ingredients copied)
3. ✅ Get menu (verifies cost calculation works)
4. ✅ Add ingredient to MenuItemDish
5. ✅ Get menu again (verifies costs updated)
6. ✅ Remove ingredient from MenuItemDish
7. ✅ Replace all ingredients
8. ✅ Create event and get proposal (verifies event calc works)

All done! 🎉
