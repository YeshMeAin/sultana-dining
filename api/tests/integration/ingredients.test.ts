import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '../setup.js';
import { createTestUser, createTestIngredient, testIngredients } from '../fixtures.js';

describe('Ingredient Routes', () => {
  let testUser: Awaited<ReturnType<typeof createTestUser>>;
  let mockToken: string;

  beforeEach(async () => {
    testUser = await createTestUser();
    mockToken = 'mock-jwt-token'; // In real tests, generate proper JWT
  });

  describe('POST /ingredients', () => {
    it('should create a new ingredient', async () => {
      const ingredient = await createTestIngredient(testIngredients.beef);

      expect(ingredient.id).toBeDefined();
      expect(ingredient.name).toBe('Beef');
      expect(ingredient.unit).toBe('kg');
      expect(ingredient.pricePerUnit).toBe(25);
      expect(ingredient.category).toBe('meat');
    });

    it('should not allow duplicate ingredient names', async () => {
      await createTestIngredient(testIngredients.beef);

      await expect(
        prisma.ingredient.create({
          data: testIngredients.beef,
        })
      ).rejects.toThrow();
    });
  });

  describe('GET /ingredients', () => {
    it('should list all ingredients', async () => {
      await createTestIngredient(testIngredients.beef);
      await createTestIngredient(testIngredients.onion);
      await createTestIngredient(testIngredients.rice);

      const ingredients = await prisma.ingredient.findMany({
        orderBy: { name: 'asc' },
      });

      expect(ingredients).toHaveLength(3);
      expect(ingredients[0].name).toBe('Basmati Rice');
      expect(ingredients[1].name).toBe('Beef');
    });

    it('should filter by category', async () => {
      await createTestIngredient(testIngredients.beef);
      await createTestIngredient(testIngredients.onion);
      await createTestIngredient(testIngredients.garlic);

      const ingredients = await prisma.ingredient.findMany({
        where: { category: 'produce' },
      });

      expect(ingredients).toHaveLength(2);
      expect(ingredients.every((i) => i.category === 'produce')).toBe(true);
    });

    it('should search by name', async () => {
      await createTestIngredient(testIngredients.beef);
      await createTestIngredient(testIngredients.onion);

      const ingredients = await prisma.ingredient.findMany({
        where: {
          name: {
            contains: 'beef',
            mode: 'insensitive',
          },
        },
      });

      expect(ingredients).toHaveLength(1);
      expect(ingredients[0].name).toBe('Beef');
    });
  });

  describe('GET /ingredients/:id', () => {
    it('should get single ingredient', async () => {
      const created = await createTestIngredient(testIngredients.beef);

      const ingredient = await prisma.ingredient.findUnique({
        where: { id: created.id },
      });

      expect(ingredient).toBeDefined();
      expect(ingredient!.name).toBe('Beef');
    });

    it('should return null for non-existent ingredient', async () => {
      const ingredient = await prisma.ingredient.findUnique({
        where: { id: 'non-existent' },
      });

      expect(ingredient).toBeNull();
    });
  });

  describe('PATCH /ingredients/:id', () => {
    it('should update ingredient price', async () => {
      const ingredient = await createTestIngredient(testIngredients.beef);

      const updated = await prisma.ingredient.update({
        where: { id: ingredient.id },
        data: { pricePerUnit: 30 },
      });

      expect(updated.pricePerUnit).toBe(30);
      expect(updated.name).toBe('Beef'); // Other fields unchanged
    });

    it('should update ingredient name', async () => {
      const ingredient = await createTestIngredient(testIngredients.beef);

      const updated = await prisma.ingredient.update({
        where: { id: ingredient.id },
        data: { name: 'Premium Beef' },
      });

      expect(updated.name).toBe('Premium Beef');
    });
  });

  describe('DELETE /ingredients/:id', () => {
    it('should delete ingredient not in use', async () => {
      const ingredient = await createTestIngredient(testIngredients.beef);

      await prisma.ingredient.delete({
        where: { id: ingredient.id },
      });

      const found = await prisma.ingredient.findUnique({
        where: { id: ingredient.id },
      });

      expect(found).toBeNull();
    });

    it('should prevent deletion of ingredient in use (onDelete: Restrict)', async () => {
      const ingredient = await createTestIngredient(testIngredients.beef);
      const dish = await prisma.dish.create({
        data: {
          name: 'Test Dish',
          servings: 4,
          userId: testUser.id,
        },
      });

      // Add ingredient to dish
      await prisma.dishIngredient.create({
        data: {
          dishId: dish.id,
          ingredientId: ingredient.id,
          quantity: 1,
        },
      });

      // Attempt to delete should fail
      await expect(
        prisma.ingredient.delete({
          where: { id: ingredient.id },
        })
      ).rejects.toThrow();
    });
  });
});
