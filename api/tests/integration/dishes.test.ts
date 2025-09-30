import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '../setup.js';
import {
  createTestUser,
  createTestIngredient,
  createTestDish,
  addIngredientToDish,
  testIngredients,
} from '../fixtures.js';
import { calculateDishCost } from '../../src/services/calculation.service.js';

describe('Dish Routes', () => {
  let testUser: Awaited<ReturnType<typeof createTestUser>>;
  let beef: Awaited<ReturnType<typeof createTestIngredient>>;
  let onion: Awaited<ReturnType<typeof createTestIngredient>>;

  beforeEach(async () => {
    testUser = await createTestUser();
    beef = await createTestIngredient(testIngredients.beef);
    onion = await createTestIngredient(testIngredients.onion);
  });

  describe('POST /dishes', () => {
    it('should create dish with recipe text', async () => {
      const dish = await createTestDish(testUser.id, {
        name: 'Beef Stew',
        servings: 4,
        laborCost: 50,
        recipeText: 'Brown beef, add onions, simmer for 2 hours',
      });

      expect(dish.id).toBeDefined();
      expect(dish.name).toBe('Beef Stew');
      expect(dish.servings).toBe(4);
      expect(dish.laborCost).toBe(50);
      expect(dish.recipeText).toBe('Brown beef, add onions, simmer for 2 hours');
      expect(dish.userId).toBe(testUser.id);
    });

    it('should create dish without recipe text', async () => {
      const dish = await createTestDish(testUser.id, {
        name: 'Simple Dish',
        servings: 2,
      });

      expect(dish.recipeText).toBeNull();
      expect(dish.laborCost).toBe(0);
    });
  });

  describe('POST /dishes/:id/ingredients', () => {
    it('should add ingredient to dish', async () => {
      const dish = await createTestDish(testUser.id, {
        name: 'Beef Stew',
        servings: 4,
      });

      const dishIngredient = await addIngredientToDish(dish.id, beef.id, 2);

      expect(dishIngredient.dishId).toBe(dish.id);
      expect(dishIngredient.ingredientId).toBe(beef.id);
      expect(dishIngredient.quantity).toBe(2);
    });

    it('should update ingredient quantity if already exists', async () => {
      const dish = await createTestDish(testUser.id, {
        name: 'Test Dish',
        servings: 4,
      });

      await addIngredientToDish(dish.id, beef.id, 1);

      // Update quantity
      const updated = await prisma.dishIngredient.update({
        where: {
          dishId_ingredientId: {
            dishId: dish.id,
            ingredientId: beef.id,
          },
        },
        data: { quantity: 3 },
      });

      expect(updated.quantity).toBe(3);
    });

    it('should add multiple ingredients to dish', async () => {
      const dish = await createTestDish(testUser.id, {
        name: 'Complex Dish',
        servings: 4,
      });

      await addIngredientToDish(dish.id, beef.id, 2);
      await addIngredientToDish(dish.id, onion.id, 0.5);

      const ingredients = await prisma.dishIngredient.findMany({
        where: { dishId: dish.id },
      });

      expect(ingredients).toHaveLength(2);
    });
  });

  describe('GET /dishes', () => {
    it('should list user dishes with cost calculation', async () => {
      const dish = await createTestDish(testUser.id, {
        name: 'Beef Stew',
        servings: 4,
        laborCost: 50,
      });

      await addIngredientToDish(dish.id, beef.id, 2);
      await addIngredientToDish(dish.id, onion.id, 0.5);

      const dishWithIngredients = await prisma.dish.findUnique({
        where: { id: dish.id },
        include: {
          ingredients: {
            include: {
              ingredient: true,
            },
          },
        },
      });

      const costCalc = calculateDishCost(dishWithIngredients!);

      expect(costCalc.totalFoodCost).toBe(51); // (2*25) + (0.5*2)
      expect(costCalc.laborCost).toBe(50);
      expect(costCalc.totalCost).toBe(101);
      expect(costCalc.costPerServing).toBe(25.25);
    });

    it('should only return user own dishes', async () => {
      const user2 = await createTestUser('user2@example.com');

      await createTestDish(testUser.id, { name: 'Dish 1', servings: 4 });
      await createTestDish(user2.id, { name: 'Dish 2', servings: 4 });

      const dishes = await prisma.dish.findMany({
        where: { userId: testUser.id },
      });

      expect(dishes).toHaveLength(1);
      expect(dishes[0].name).toBe('Dish 1');
    });
  });

  describe('GET /dishes/:id', () => {
    it('should get dish with ingredients and cost', async () => {
      const dish = await createTestDish(testUser.id, {
        name: 'Beef Stew',
        servings: 4,
        laborCost: 50,
      });

      await addIngredientToDish(dish.id, beef.id, 2);

      const found = await prisma.dish.findUnique({
        where: { id: dish.id },
        include: {
          ingredients: {
            include: {
              ingredient: true,
            },
          },
        },
      });

      expect(found).toBeDefined();
      expect(found!.ingredients).toHaveLength(1);
      expect(found!.ingredients[0].ingredient.name).toBe('Beef');
      expect(found!.ingredients[0].quantity).toBe(2);
    });
  });

  describe('PATCH /dishes/:id', () => {
    it('should update dish details', async () => {
      const dish = await createTestDish(testUser.id, {
        name: 'Original Name',
        servings: 4,
        laborCost: 50,
      });

      const updated = await prisma.dish.update({
        where: { id: dish.id },
        data: {
          name: 'Updated Name',
          servings: 6,
          laborCost: 75,
        },
      });

      expect(updated.name).toBe('Updated Name');
      expect(updated.servings).toBe(6);
      expect(updated.laborCost).toBe(75);
    });
  });

  describe('DELETE /dishes/:id/ingredients/:ingredientId', () => {
    it('should remove ingredient from dish', async () => {
      const dish = await createTestDish(testUser.id, {
        name: 'Test Dish',
        servings: 4,
      });

      await addIngredientToDish(dish.id, beef.id, 2);
      await addIngredientToDish(dish.id, onion.id, 0.5);

      // Remove beef
      await prisma.dishIngredient.delete({
        where: {
          dishId_ingredientId: {
            dishId: dish.id,
            ingredientId: beef.id,
          },
        },
      });

      const remaining = await prisma.dishIngredient.findMany({
        where: { dishId: dish.id },
      });

      expect(remaining).toHaveLength(1);
      expect(remaining[0].ingredientId).toBe(onion.id);
    });
  });

  describe('DELETE /dishes/:id', () => {
    it('should delete dish and cascade ingredients', async () => {
      const dish = await createTestDish(testUser.id, {
        name: 'Test Dish',
        servings: 4,
      });

      await addIngredientToDish(dish.id, beef.id, 2);

      await prisma.dish.delete({
        where: { id: dish.id },
      });

      const foundDish = await prisma.dish.findUnique({
        where: { id: dish.id },
      });

      const foundIngredients = await prisma.dishIngredient.findMany({
        where: { dishId: dish.id },
      });

      expect(foundDish).toBeNull();
      expect(foundIngredients).toHaveLength(0); // Cascaded delete
    });
  });
});
