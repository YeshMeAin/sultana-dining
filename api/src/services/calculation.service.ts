// Dish cost calculation
export interface DishCostCalculation {
  dishId: string;
  dishName: string;
  servings: number;
  ingredients: Array<{
    ingredientId: string;
    ingredientName: string;
    quantity: number;
    unit: string;
    pricePerUnit: number;
    totalCost: number;
  }>;
  totalFoodCost: number;
  laborCost: number;
  totalCost: number;
  costPerServing: number;
}

export function calculateDishCost(dish: {
  id: string;
  name: string;
  servings: number;
  laborCost: number;
  ingredients: Array<{
    ingredient: {
      id: string;
      name: string;
      unit: string;
      pricePerUnit: number;
    };
    quantity: number;
  }>;
}): DishCostCalculation {
  const ingredientCosts = dish.ingredients.map((di) => ({
    ingredientId: di.ingredient.id,
    ingredientName: di.ingredient.name,
    quantity: di.quantity,
    unit: di.ingredient.unit,
    pricePerUnit: di.ingredient.pricePerUnit,
    totalCost: di.quantity * di.ingredient.pricePerUnit,
  }));

  const totalFoodCost = ingredientCosts.reduce(
    (sum, ing) => sum + ing.totalCost,
    0
  );
  const totalCost = totalFoodCost + dish.laborCost;
  const costPerServing = totalCost / dish.servings;

  return {
    dishId: dish.id,
    dishName: dish.name,
    servings: dish.servings,
    ingredients: ingredientCosts,
    totalFoodCost,
    laborCost: dish.laborCost,
    totalCost,
    costPerServing,
  };
}

// Menu calculation
export interface MenuItemCalculation {
  menuItemId: string;
  menuItemName: string;
  servingQuantity: number;
  dishes: DishCostCalculation[];
  totalFoodCost: number;
  totalLaborCost: number;
  totalCost: number;
}

export interface MenuCalculation {
  menuId: string;
  menuTitle: string;
  servingCount: number;
  items: MenuItemCalculation[];
  totalFoodCost: number;
  totalLaborCost: number;
  totalCost: number;
  costPerServing: number;
}

export function calculateMenuCosts(
  menu: {
    id: string;
    title: string;
    servingCount: number;
    items: Array<{
      id: string;
      name: string;
      servingQuantity: number;
      dishes: Array<{
        id: string;
        ingredients: any; // JSON field: Array<{ ingredientId, quantity }>
        dish: {
          id: string;
          name: string;
          servings: number;
          laborCost: number;
        };
      }>;
    }>;
  },
  ingredientMap: Map<string, { id: string; name: string; unit: string; pricePerUnit: number }>
): MenuCalculation {
  const itemCalculations: MenuItemCalculation[] = menu.items.map((item) => {
    const dishCalculations = item.dishes.map((menuItemDish) => {
      // Use MenuItemDish.ingredients (JSON) instead of Dish.ingredients
      const ingredientsData = (menuItemDish.ingredients as Array<{ ingredientId: string; quantity: number }>) || [];

      // Convert JSON ingredients to the format expected by calculateDishCost
      const ingredientsWithDetails = ingredientsData
        .map((ing) => {
          const ingredient = ingredientMap.get(ing.ingredientId);
          if (!ingredient) return null;
          return {
            ingredient,
            quantity: ing.quantity,
          };
        })
        .filter(Boolean) as Array<{
          ingredient: { id: string; name: string; unit: string; pricePerUnit: number };
          quantity: number;
        }>;

      return calculateDishCost({
        id: menuItemDish.dish.id,
        name: menuItemDish.dish.name,
        servings: menuItemDish.dish.servings,
        laborCost: menuItemDish.dish.laborCost,
        ingredients: ingredientsWithDetails,
      });
    });

    const totalFoodCost =
      dishCalculations.reduce((sum, dish) => sum + dish.totalFoodCost, 0) *
      item.servingQuantity;
    const totalLaborCost =
      dishCalculations.reduce((sum, dish) => sum + dish.laborCost, 0) *
      item.servingQuantity;
    const totalCost = totalFoodCost + totalLaborCost;

    return {
      menuItemId: item.id,
      menuItemName: item.name,
      servingQuantity: item.servingQuantity,
      dishes: dishCalculations,
      totalFoodCost,
      totalLaborCost,
      totalCost,
    };
  });

  const totalFoodCost = itemCalculations.reduce(
    (sum, item) => sum + item.totalFoodCost,
    0
  );
  const totalLaborCost = itemCalculations.reduce(
    (sum, item) => sum + item.totalLaborCost,
    0
  );
  const totalCost = totalFoodCost + totalLaborCost;
  const costPerServing = totalCost / menu.servingCount;

  return {
    menuId: menu.id,
    menuTitle: menu.title,
    servingCount: menu.servingCount,
    items: itemCalculations,
    totalFoodCost,
    totalLaborCost,
    totalCost,
    costPerServing,
  };
}

// Event/Proposal calculation
export interface EventProposalCalculation {
  eventId: string;
  eventTitle: string;
  guestCount: number;
  menu: MenuCalculation;
  menuCostForEvent: number; // Scaled to guest count
  additionalCosts: Record<string, number>;
  totalAdditionalCosts: number;
  totalCost: number;
  costPerGuest: number;
}

export function calculateEventProposal(
  event: {
    id: string;
    title: string;
    guestCount: number;
    additionalCosts: Record<string, number> | null;
    menu: {
      id: string;
      title: string;
      servingCount: number;
      items: Array<{
        id: string;
        name: string;
        servingQuantity: number;
        dishes: Array<{
          id: string;
          ingredients: any; // JSON field
          dish: {
            id: string;
            name: string;
            servings: number;
            laborCost: number;
          };
        }>;
      }>;
    };
  },
  ingredientMap: Map<string, { id: string; name: string; unit: string; pricePerUnit: number }>
): EventProposalCalculation {
  const menuCalculation = calculateMenuCosts(event.menu, ingredientMap);

  // Scale menu cost to event guest count
  const menuCostForEvent =
    (menuCalculation.totalCost / menuCalculation.servingCount) *
    event.guestCount;

  const additionalCosts = event.additionalCosts || {};
  const totalAdditionalCosts = Object.values(additionalCosts).reduce(
    (sum, cost) => sum + cost,
    0
  );

  const totalCost = menuCostForEvent + totalAdditionalCosts;
  const costPerGuest = totalCost / event.guestCount;

  return {
    eventId: event.id,
    eventTitle: event.title,
    guestCount: event.guestCount,
    menu: menuCalculation,
    menuCostForEvent,
    additionalCosts,
    totalAdditionalCosts,
    totalCost,
    costPerGuest,
  };
}
