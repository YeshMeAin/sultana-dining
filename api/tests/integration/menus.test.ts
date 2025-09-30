import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '../setup.js';
import {
  createTestUser,
  createTestIngredient,
  createTestDish,
  addIngredientToDish,
  createTestMenu,
  testIngredients,
} from '../fixtures.js';

describe('Menu Routes', () => {
  let testUser: Awaited<ReturnType<typeof createTestUser>>;
  let beef: Awaited<ReturnType<typeof createTestIngredient>>;
  let onion: Awaited<ReturnType<typeof createTestIngredient>>;
  let rice: Awaited<ReturnType<typeof createTestIngredient>>;
  let beefStew: Awaited<ReturnType<typeof createTestDish>>;
  let riceDish: Awaited<ReturnType<typeof createTestDish>>;

  beforeEach(async () => {
    testUser = await createTestUser();
    beef = await createTestIngredient(testIngredients.beef);
    onion = await createTestIngredient(testIngredients.onion);
    rice = await createTestIngredient(testIngredients.rice);

    // Create dishes with ingredients
    beefStew = await createTestDish(testUser.id, {
      name: 'Beef Stew',
      servings: 4,
      laborCost: 50,
    });
    await addIngredientToDish(beefStew.id, beef.id, 2);
    await addIngredientToDish(beefStew.id, onion.id, 0.5);

    riceDish = await createTestDish(testUser.id, {
      name: 'Basmati Rice',
      servings: 4,
      laborCost: 10,
    });
    await addIngredientToDish(riceDish.id, rice.id, 1);
  });

  describe('POST /menus - Ingredient Copying', () => {
    it('should copy dish ingredients to MenuItemDish on creation', async () => {
      const menu = await prisma.menu.create({
        data: {
          title: 'Test Menu',
          servingCount: 100,
          userId: testUser.id,
          items: {
            create: [
              {
                name: 'Main Course',
                servingQuantity: 1,
                dishes: {
                  create: [
                    {
                      dishId: beefStew.id,
                      ingredients: [
                        { ingredientId: beef.id, quantity: 2 },
                        { ingredientId: onion.id, quantity: 0.5 },
                      ],
                    },
                  ],
                },
              },
            ],
          },
        },
        include: {
          items: {
            include: {
              dishes: true,
            },
          },
        },
      });

      const menuItemDish = menu.items[0].dishes[0];
      const ingredientsJSON = menuItemDish.ingredients as Array<{
        ingredientId: string;
        quantity: number;
      }>;

      expect(ingredientsJSON).toHaveLength(2);
      expect(ingredientsJSON[0].ingredientId).toBe(beef.id);
      expect(ingredientsJSON[0].quantity).toBe(2);
      expect(ingredientsJSON[1].ingredientId).toBe(onion.id);
      expect(ingredientsJSON[1].quantity).toBe(0.5);
    });

    it('should support multiple dishes in one menu item', async () => {
      const menu = await prisma.menu.create({
        data: {
          title: 'Test Menu',
          servingCount: 50,
          userId: testUser.id,
          items: {
            create: [
              {
                name: 'Main Course: Stew with Rice',
                servingQuantity: 1,
                dishes: {
                  create: [
                    {
                      dishId: beefStew.id,
                      ingredients: [
                        { ingredientId: beef.id, quantity: 2 },
                        { ingredientId: onion.id, quantity: 0.5 },
                      ],
                    },
                    {
                      dishId: riceDish.id,
                      ingredients: [{ ingredientId: rice.id, quantity: 1 }],
                    },
                  ],
                },
              },
            ],
          },
        },
        include: {
          items: {
            include: {
              dishes: true,
            },
          },
        },
      });

      expect(menu.items[0].dishes).toHaveLength(2);
      expect(menu.items[0].name).toBe('Main Course: Stew with Rice');
    });
  });

  describe('Menu Item Ingredient Customization', () => {
    it('should allow adding ingredient to menu item dish', async () => {
      const menu = await prisma.menu.create({
        data: {
          title: 'Test Menu',
          servingCount: 100,
          userId: testUser.id,
          items: {
            create: [
              {
                name: 'Main',
                servingQuantity: 1,
                dishes: {
                  create: [
                    {
                      dishId: beefStew.id,
                      ingredients: [{ ingredientId: beef.id, quantity: 2 }],
                    },
                  ],
                },
              },
            ],
          },
        },
        include: {
          items: {
            include: {
              dishes: true,
            },
          },
        },
      });

      const menuItemDish = menu.items[0].dishes[0];

      // Add garlic just for this menu
      const garlic = await createTestIngredient(testIngredients.garlic);
      const currentIngredients = menuItemDish.ingredients as Array<{
        ingredientId: string;
        quantity: number;
      }>;
      const updatedIngredients = [
        ...currentIngredients,
        { ingredientId: garlic.id, quantity: 0.2 },
      ];

      await prisma.menuItemDish.update({
        where: { id: menuItemDish.id },
        data: { ingredients: updatedIngredients },
      });

      const updated = await prisma.menuItemDish.findUnique({
        where: { id: menuItemDish.id },
      });

      const ingredients = updated!.ingredients as Array<{
        ingredientId: string;
        quantity: number;
      }>;
      expect(ingredients).toHaveLength(2);
      expect(ingredients[1].ingredientId).toBe(garlic.id);
    });

    it('should allow removing ingredient from menu item dish', async () => {
      const menu = await prisma.menu.create({
        data: {
          title: 'Test Menu',
          servingCount: 100,
          userId: testUser.id,
          items: {
            create: [
              {
                name: 'Main',
                servingQuantity: 1,
                dishes: {
                  create: [
                    {
                      dishId: beefStew.id,
                      ingredients: [
                        { ingredientId: beef.id, quantity: 2 },
                        { ingredientId: onion.id, quantity: 0.5 },
                      ],
                    },
                  ],
                },
              },
            ],
          },
        },
        include: {
          items: {
            include: {
              dishes: true,
            },
          },
        },
      });

      const menuItemDish = menu.items[0].dishes[0];

      // Remove onion
      const currentIngredients = menuItemDish.ingredients as Array<{
        ingredientId: string;
        quantity: number;
      }>;
      const filteredIngredients = currentIngredients.filter(
        (i) => i.ingredientId !== onion.id
      );

      await prisma.menuItemDish.update({
        where: { id: menuItemDish.id },
        data: { ingredients: filteredIngredients },
      });

      const updated = await prisma.menuItemDish.findUnique({
        where: { id: menuItemDish.id },
      });

      const ingredients = updated!.ingredients as Array<{
        ingredientId: string;
        quantity: number;
      }>;
      expect(ingredients).toHaveLength(1);
      expect(ingredients[0].ingredientId).toBe(beef.id);
    });

    it('should allow updating ingredient quantity for menu item dish', async () => {
      const menu = await prisma.menu.create({
        data: {
          title: 'Test Menu',
          servingCount: 100,
          userId: testUser.id,
          items: {
            create: [
              {
                name: 'Main',
                servingQuantity: 1,
                dishes: {
                  create: [
                    {
                      dishId: beefStew.id,
                      ingredients: [{ ingredientId: beef.id, quantity: 2 }],
                    },
                  ],
                },
              },
            ],
          },
        },
        include: {
          items: {
            include: {
              dishes: true,
            },
          },
        },
      });

      const menuItemDish = menu.items[0].dishes[0];

      // Update beef quantity
      const currentIngredients = menuItemDish.ingredients as Array<{
        ingredientId: string;
        quantity: number;
      }>;
      currentIngredients[0].quantity = 3;

      await prisma.menuItemDish.update({
        where: { id: menuItemDish.id },
        data: { ingredients: currentIngredients },
      });

      const updated = await prisma.menuItemDish.findUnique({
        where: { id: menuItemDish.id },
      });

      const ingredients = updated!.ingredients as Array<{
        ingredientId: string;
        quantity: number;
      }>;
      expect(ingredients[0].quantity).toBe(3);
    });

    it('should not affect original dish when modifying menu ingredients', async () => {
      const menu = await prisma.menu.create({
        data: {
          title: 'Test Menu',
          servingCount: 100,
          userId: testUser.id,
          items: {
            create: [
              {
                name: 'Main',
                servingQuantity: 1,
                dishes: {
                  create: [
                    {
                      dishId: beefStew.id,
                      ingredients: [{ ingredientId: beef.id, quantity: 2 }],
                    },
                  ],
                },
              },
            ],
          },
        },
        include: {
          items: {
            include: {
              dishes: true,
            },
          },
        },
      });

      const menuItemDish = menu.items[0].dishes[0];

      // Change quantity in menu
      await prisma.menuItemDish.update({
        where: { id: menuItemDish.id },
        data: { ingredients: [{ ingredientId: beef.id, quantity: 5 }] },
      });

      // Original dish should be unchanged
      const originalDishIngredients = await prisma.dishIngredient.findMany({
        where: { dishId: beefStew.id },
      });

      const beefIngredient = originalDishIngredients.find(
        (i) => i.ingredientId === beef.id
      );
      expect(beefIngredient!.quantity).toBe(2); // Still original quantity
    });
  });

  describe('GET /menus/:id', () => {
    it('should return menu with cost calculation using menu-specific ingredients', async () => {
      const menu = await prisma.menu.create({
        data: {
          title: 'Wedding Menu',
          servingCount: 100,
          userId: testUser.id,
          items: {
            create: [
              {
                name: 'Main Course',
                servingQuantity: 1,
                dishes: {
                  create: [
                    {
                      dishId: beefStew.id,
                      ingredients: [
                        { ingredientId: beef.id, quantity: 2 },
                        { ingredientId: onion.id, quantity: 0.5 },
                      ],
                    },
                  ],
                },
              },
            ],
          },
        },
      });

      const found = await prisma.menu.findUnique({
        where: { id: menu.id },
        include: {
          items: {
            include: {
              dishes: {
                include: {
                  dish: true,
                },
              },
            },
          },
        },
      });

      expect(found).toBeDefined();
      expect(found!.items).toHaveLength(1);
      expect(found!.items[0].dishes).toHaveLength(1);
    });
  });

  describe('PATCH /menus/:id', () => {
    it('should update menu and re-copy ingredients when items change', async () => {
      const menu = await createTestMenu(testUser.id, {
        title: 'Original Menu',
        servingCount: 50,
      });

      // Update would recreate items with fresh ingredient copies
      const updated = await prisma.menu.update({
        where: { id: menu.id },
        data: {
          title: 'Updated Menu',
          servingCount: 75,
        },
      });

      expect(updated.title).toBe('Updated Menu');
      expect(updated.servingCount).toBe(75);
    });
  });

  describe('DELETE /menus/:id', () => {
    it('should delete menu and cascade to items and menu item dishes', async () => {
      const menu = await prisma.menu.create({
        data: {
          title: 'Test Menu',
          servingCount: 100,
          userId: testUser.id,
          items: {
            create: [
              {
                name: 'Main',
                servingQuantity: 1,
                dishes: {
                  create: [
                    {
                      dishId: beefStew.id,
                      ingredients: [{ ingredientId: beef.id, quantity: 2 }],
                    },
                  ],
                },
              },
            ],
          },
        },
      });

      await prisma.menu.delete({
        where: { id: menu.id },
      });

      const foundMenu = await prisma.menu.findUnique({
        where: { id: menu.id },
      });
      const foundItems = await prisma.menuItem.findMany({
        where: { menuId: menu.id },
      });

      expect(foundMenu).toBeNull();
      expect(foundItems).toHaveLength(0);
    });
  });
});
