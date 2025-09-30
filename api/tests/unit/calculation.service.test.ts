import { describe, it, expect } from 'vitest';
import {
  calculateDishCost,
  calculateMenuCosts,
  calculateEventProposal,
} from '../../src/services/calculation.service.js';

describe('Calculation Service', () => {
  describe('calculateDishCost', () => {
    it('should calculate dish cost with ingredients', () => {
      const dish = {
        id: 'dish-1',
        name: 'Beef Stew',
        servings: 4,
        laborCost: 50,
        ingredients: [
          {
            ingredient: {
              id: 'ing-1',
              name: 'Beef',
              unit: 'kg',
              pricePerUnit: 25,
            },
            quantity: 2,
          },
          {
            ingredient: {
              id: 'ing-2',
              name: 'Onion',
              unit: 'kg',
              pricePerUnit: 2,
            },
            quantity: 0.5,
          },
        ],
      };

      const result = calculateDishCost(dish);

      expect(result.dishId).toBe('dish-1');
      expect(result.dishName).toBe('Beef Stew');
      expect(result.servings).toBe(4);
      expect(result.laborCost).toBe(50);
      expect(result.totalFoodCost).toBe(51); // (2 * 25) + (0.5 * 2)
      expect(result.totalCost).toBe(101); // 51 + 50
      expect(result.costPerServing).toBe(25.25); // 101 / 4
      expect(result.ingredients).toHaveLength(2);
    });

    it('should handle dish with no ingredients', () => {
      const dish = {
        id: 'dish-1',
        name: 'Simple Dish',
        servings: 2,
        laborCost: 20,
        ingredients: [],
      };

      const result = calculateDishCost(dish);

      expect(result.totalFoodCost).toBe(0);
      expect(result.totalCost).toBe(20);
      expect(result.costPerServing).toBe(10);
    });

    it('should handle zero labor cost', () => {
      const dish = {
        id: 'dish-1',
        name: 'No Labor Dish',
        servings: 1,
        laborCost: 0,
        ingredients: [
          {
            ingredient: {
              id: 'ing-1',
              name: 'Rice',
              unit: 'kg',
              pricePerUnit: 5,
            },
            quantity: 1,
          },
        ],
      };

      const result = calculateDishCost(dish);

      expect(result.totalFoodCost).toBe(5);
      expect(result.laborCost).toBe(0);
      expect(result.totalCost).toBe(5);
    });
  });

  describe('calculateMenuCosts', () => {
    it('should calculate menu costs from menu item dishes', () => {
      const ingredientMap = new Map([
        ['ing-1', { id: 'ing-1', name: 'Beef', unit: 'kg', pricePerUnit: 25 }],
        ['ing-2', { id: 'ing-2', name: 'Rice', unit: 'kg', pricePerUnit: 5 }],
      ]);

      const menu = {
        id: 'menu-1',
        title: 'Wedding Menu',
        servingCount: 100,
        items: [
          {
            id: 'item-1',
            name: 'Main Course',
            servingQuantity: 1,
            dishes: [
              {
                id: 'mid-1',
                ingredients: [
                  { ingredientId: 'ing-1', quantity: 2 },
                  { ingredientId: 'ing-2', quantity: 0.5 },
                ],
                dish: {
                  id: 'dish-1',
                  name: 'Beef with Rice',
                  servings: 4,
                  laborCost: 50,
                },
              },
            ],
          },
        ],
      };

      const result = calculateMenuCosts(menu, ingredientMap);

      expect(result.menuId).toBe('menu-1');
      expect(result.menuTitle).toBe('Wedding Menu');
      expect(result.servingCount).toBe(100);
      expect(result.totalFoodCost).toBe(52.5); // (2*25) + (0.5*5)
      expect(result.totalLaborCost).toBe(50);
      expect(result.totalCost).toBe(102.5);
      expect(result.costPerServing).toBe(1.025); // 102.5 / 100
      expect(result.items).toHaveLength(1);
    });

    it('should handle multiple dishes in one menu item', () => {
      const ingredientMap = new Map([
        ['ing-1', { id: 'ing-1', name: 'Beef', unit: 'kg', pricePerUnit: 25 }],
        ['ing-2', { id: 'ing-2', name: 'Rice', unit: 'kg', pricePerUnit: 5 }],
      ]);

      const menu = {
        id: 'menu-1',
        title: 'Dinner',
        servingCount: 50,
        items: [
          {
            id: 'item-1',
            name: 'Main Course',
            servingQuantity: 1,
            dishes: [
              {
                id: 'mid-1',
                ingredients: [{ ingredientId: 'ing-1', quantity: 2 }],
                dish: {
                  id: 'dish-1',
                  name: 'Beef Stew',
                  servings: 4,
                  laborCost: 30,
                },
              },
              {
                id: 'mid-2',
                ingredients: [{ ingredientId: 'ing-2', quantity: 1 }],
                dish: {
                  id: 'dish-2',
                  name: 'Rice',
                  servings: 4,
                  laborCost: 10,
                },
              },
            ],
          },
        ],
      };

      const result = calculateMenuCosts(menu, ingredientMap);

      expect(result.totalFoodCost).toBe(55); // (2*25) + (1*5)
      expect(result.totalLaborCost).toBe(40); // 30 + 10
      expect(result.totalCost).toBe(95);
    });

    it('should handle serving quantity multiplier', () => {
      const ingredientMap = new Map([
        ['ing-1', { id: 'ing-1', name: 'Rice', unit: 'kg', pricePerUnit: 5 }],
      ]);

      const menu = {
        id: 'menu-1',
        title: 'Party Menu',
        servingCount: 100,
        items: [
          {
            id: 'item-1',
            name: 'Side Dish',
            servingQuantity: 2, // Serve 2x
            dishes: [
              {
                id: 'mid-1',
                ingredients: [{ ingredientId: 'ing-1', quantity: 1 }],
                dish: {
                  id: 'dish-1',
                  name: 'Rice',
                  servings: 4,
                  laborCost: 10,
                },
              },
            ],
          },
        ],
      };

      const result = calculateMenuCosts(menu, ingredientMap);

      expect(result.totalFoodCost).toBe(10); // 5 * 2 (servingQuantity)
      expect(result.totalLaborCost).toBe(20); // 10 * 2
      expect(result.totalCost).toBe(30);
    });

    it('should handle missing ingredients gracefully', () => {
      const ingredientMap = new Map([
        ['ing-1', { id: 'ing-1', name: 'Beef', unit: 'kg', pricePerUnit: 25 }],
      ]);

      const menu = {
        id: 'menu-1',
        title: 'Test Menu',
        servingCount: 10,
        items: [
          {
            id: 'item-1',
            name: 'Main',
            servingQuantity: 1,
            dishes: [
              {
                id: 'mid-1',
                ingredients: [
                  { ingredientId: 'ing-1', quantity: 1 },
                  { ingredientId: 'ing-missing', quantity: 1 }, // Missing
                ],
                dish: {
                  id: 'dish-1',
                  name: 'Test Dish',
                  servings: 4,
                  laborCost: 10,
                },
              },
            ],
          },
        ],
      };

      const result = calculateMenuCosts(menu, ingredientMap);

      // Should only count the ingredient that exists
      expect(result.totalFoodCost).toBe(25);
      expect(result.totalCost).toBe(35);
    });
  });

  describe('calculateEventProposal', () => {
    it('should scale menu cost to guest count', () => {
      const ingredientMap = new Map([
        ['ing-1', { id: 'ing-1', name: 'Beef', unit: 'kg', pricePerUnit: 25 }],
      ]);

      const event = {
        id: 'event-1',
        title: 'Wedding',
        guestCount: 150,
        additionalCosts: {
          cleaning: 500,
          bar: 1000,
        },
        menu: {
          id: 'menu-1',
          title: 'Wedding Menu',
          servingCount: 100,
          items: [
            {
              id: 'item-1',
              name: 'Main',
              servingQuantity: 1,
              dishes: [
                {
                  id: 'mid-1',
                  ingredients: [{ ingredientId: 'ing-1', quantity: 4 }],
                  dish: {
                    id: 'dish-1',
                    name: 'Beef',
                    servings: 4,
                    laborCost: 50,
                  },
                },
              ],
            },
          ],
        },
      };

      const result = calculateEventProposal(event, ingredientMap);

      expect(result.eventId).toBe('event-1');
      expect(result.guestCount).toBe(150);

      // Menu cost: (4kg * 25) + 50 = 150 for 100 servings
      // Cost per serving: 150 / 100 = 1.5
      // For 150 guests: 1.5 * 150 = 225
      expect(result.menu.totalCost).toBe(150);
      expect(result.menuCostForEvent).toBe(225);

      expect(result.totalAdditionalCosts).toBe(1500);
      expect(result.totalCost).toBe(1725); // 225 + 1500
      expect(result.costPerGuest).toBe(11.5); // 1725 / 150
    });

    it('should handle no additional costs', () => {
      const ingredientMap = new Map([
        ['ing-1', { id: 'ing-1', name: 'Rice', unit: 'kg', pricePerUnit: 5 }],
      ]);

      const event = {
        id: 'event-1',
        title: 'Simple Event',
        guestCount: 50,
        additionalCosts: null,
        menu: {
          id: 'menu-1',
          title: 'Simple Menu',
          servingCount: 50,
          items: [
            {
              id: 'item-1',
              name: 'Main',
              servingQuantity: 1,
              dishes: [
                {
                  id: 'mid-1',
                  ingredients: [{ ingredientId: 'ing-1', quantity: 2 }],
                  dish: {
                    id: 'dish-1',
                    name: 'Rice',
                    servings: 4,
                    laborCost: 20,
                  },
                },
              ],
            },
          ],
        },
      };

      const result = calculateEventProposal(event, ingredientMap);

      expect(result.totalAdditionalCosts).toBe(0);
      expect(result.totalCost).toBe(30); // (2*5) + 20
      expect(result.costPerGuest).toBe(0.6);
    });
  });
});
