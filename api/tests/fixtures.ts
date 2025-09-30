import { prisma } from './setup.js';

let userCounter = 0;

export async function createTestUser(email?: string) {
  userCounter++;
  const uniqueEmail = email || `test-${Date.now()}-${userCounter}-${Math.random().toString(36).substring(7)}@example.com`;
  return prisma.user.create({
    data: {
      email: uniqueEmail,
      displayName: 'Test User',
      googleId: `google-${Date.now()}-${userCounter}-${Math.random().toString(36).substring(7)}`,
    },
  });
}

export async function createTestIngredient(data: {
  name: string;
  unit: string;
  pricePerUnit: number;
  category?: string;
}) {
  return prisma.ingredient.create({
    data,
  });
}

export async function createTestDish(
  userId: string,
  data: {
    name: string;
    servings: number;
    laborCost?: number;
    recipeText?: string;
  }
) {
  return prisma.dish.create({
    data: {
      ...data,
      userId,
      laborCost: data.laborCost || 0,
    },
  });
}

export async function addIngredientToDish(
  dishId: string,
  ingredientId: string,
  quantity: number
) {
  return prisma.dishIngredient.create({
    data: {
      dishId,
      ingredientId,
      quantity,
    },
  });
}

export async function createTestMenu(
  userId: string,
  data: {
    title: string;
    servingCount: number;
    notes?: string;
    isTemplate?: boolean;
  }
) {
  return prisma.menu.create({
    data: {
      ...data,
      userId,
    },
  });
}

export async function createTestClient(
  userId: string,
  data: {
    name: string;
    email?: string;
    phone?: string;
  }
) {
  return prisma.client.create({
    data: {
      ...data,
      userId,
    },
  });
}

export const testIngredients = {
  beef: {
    name: 'Beef',
    unit: 'kg',
    pricePerUnit: 25,
    category: 'meat',
  },
  onion: {
    name: 'Onion',
    unit: 'kg',
    pricePerUnit: 2,
    category: 'produce',
  },
  garlic: {
    name: 'Garlic',
    unit: 'kg',
    pricePerUnit: 8,
    category: 'produce',
  },
  rice: {
    name: 'Basmati Rice',
    unit: 'kg',
    pricePerUnit: 5,
    category: 'grains',
  },
};
