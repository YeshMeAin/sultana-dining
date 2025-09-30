import type { FastifyInstance } from 'fastify';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  createMenuSchema,
  updateMenuSchema,
  menuIdSchema,
  paginationSchema,
} from '../schemas/index.js';
import { NotFoundError, AuthorizationError } from '../utils/errors.js';
import { calculateMenuCosts } from '../services/calculation.service.js';

export default async function menuRoutes(fastify: FastifyInstance) {
  // Create menu with items
  fastify.post('/', { preHandler: authenticate }, async (request) => {
    const { title, servingCount, notes, isTemplate, items } = createMenuSchema.parse(request.body);

    // Verify all dishes exist and belong to user, and fetch their ingredients
    const allDishIds = items.flatMap((item) => item.dishIds);
    const uniqueDishIds = [...new Set(allDishIds)];

    const dishes = await fastify.prisma.dish.findMany({
      where: {
        id: { in: uniqueDishIds },
        userId: request.user!.userId,
      },
      include: {
        ingredients: {
          include: {
            ingredient: true,
          },
        },
      },
    });

    if (dishes.length !== uniqueDishIds.length) {
      throw new NotFoundError('One or more dishes');
    }

    // Create a map of dish ingredients for easy lookup
    const dishIngredientsMap = new Map(
      dishes.map((dish) => [
        dish.id,
        dish.ingredients.map((di) => ({
          ingredientId: di.ingredientId,
          quantity: di.quantity,
        })),
      ])
    );

    // Create menu with items in a transaction
    const menu = await fastify.prisma.menu.create({
      data: {
        title,
        servingCount,
        notes,
        isTemplate,
        userId: request.user!.userId,
        items: {
          create: items.map((item) => ({
            name: item.name,
            servingQuantity: item.servingQuantity,
            dishes: {
              create: item.dishIds.map((dishId) => ({
                dishId,
                // Copy dish ingredients to MenuItemDish
                ingredients: dishIngredientsMap.get(dishId) || [],
              })),
            },
          })),
        },
      },
      include: {
        items: {
          include: {
            dishes: {
              include: {
                dish: {
                  include: {
                    ingredients: {
                      include: {
                        ingredient: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    return menu;
  });

  // List user's menus
  fastify.get('/', { preHandler: authenticate }, async (request) => {
    const { limit, offset } = paginationSchema.parse(request.query);

    const [menus, total] = await Promise.all([
      fastify.prisma.menu.findMany({
        where: { userId: request.user!.userId },
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            include: {
              dishes: {
                include: {
                  dish: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
      }),
      fastify.prisma.menu.count({
        where: { userId: request.user!.userId },
      }),
    ]);

    return {
      menus,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    };
  });

  // Get single menu with calculations
  fastify.get('/:id', { preHandler: authenticate }, async (request) => {
    const { id } = menuIdSchema.parse(request.params);

    const menu = await fastify.prisma.menu.findUnique({
      where: { id },
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

    if (!menu) {
      throw new NotFoundError('Menu');
    }

    // Check authorization
    if (menu.userId !== request.user!.userId) {
      throw new AuthorizationError('You can only access your own menus');
    }

    // Collect all ingredient IDs from all MenuItemDishes
    const allIngredientIds = new Set<string>();
    menu.items.forEach((item) => {
      item.dishes.forEach((menuItemDish) => {
        const ingredients = menuItemDish.ingredients as Array<{ ingredientId: string; quantity: number }> || [];
        ingredients.forEach((ing) => allIngredientIds.add(ing.ingredientId));
      });
    });

    // Fetch all ingredients in one query
    const ingredients = await fastify.prisma.ingredient.findMany({
      where: {
        id: { in: Array.from(allIngredientIds) },
      },
    });

    const ingredientMap = new Map(
      ingredients.map((ing) => [ing.id, ing])
    );

    // Calculate menu costs
    const calculation = calculateMenuCosts(menu, ingredientMap);

    return {
      ...menu,
      costCalculation: calculation,
    };
  });

  // Update menu
  fastify.patch('/:id', { preHandler: authenticate }, async (request) => {
    const { id } = menuIdSchema.parse(request.params);
    const data = updateMenuSchema.parse(request.body);

    // Check if menu exists and user owns it
    const existingMenu = await fastify.prisma.menu.findUnique({
      where: { id },
    });

    if (!existingMenu) {
      throw new NotFoundError('Menu');
    }

    if (existingMenu.userId !== request.user!.userId) {
      throw new AuthorizationError('You can only update your own menus');
    }

    // If items are being updated, verify dishes exist and fetch ingredients
    if (data.items) {
      const allDishIds = data.items.flatMap((item) => item.dishIds);
      const uniqueDishIds = [...new Set(allDishIds)];

      const dishes = await fastify.prisma.dish.findMany({
        where: {
          id: { in: uniqueDishIds },
          userId: request.user!.userId,
        },
        include: {
          ingredients: {
            include: {
              ingredient: true,
            },
          },
        },
      });

      if (dishes.length !== uniqueDishIds.length) {
        throw new NotFoundError('One or more dishes');
      }

      // Create a map of dish ingredients for easy lookup
      const dishIngredientsMap = new Map(
        dishes.map((dish) => [
          dish.id,
          dish.ingredients.map((di) => ({
            ingredientId: di.ingredientId,
            quantity: di.quantity,
          })),
        ])
      );

      // Update menu with items in a transaction
      const menu = await fastify.prisma.$transaction(async (tx) => {
        // Delete existing items (cascades to MenuItemDish)
        await tx.menuItem.deleteMany({
          where: { menuId: id },
        });

        // Update menu and create new items
        return tx.menu.update({
          where: { id },
          data: {
            ...(data.title && { title: data.title }),
            ...(data.servingCount && { servingCount: data.servingCount }),
            ...(data.notes !== undefined && { notes: data.notes }),
            ...(data.isTemplate !== undefined && { isTemplate: data.isTemplate }),
            items: {
              create: data.items!.map((item) => ({
                name: item.name,
                servingQuantity: item.servingQuantity,
                dishes: {
                  create: item.dishIds.map((dishId) => ({
                    dishId,
                    // Copy dish ingredients to MenuItemDish
                    ingredients: dishIngredientsMap.get(dishId) || [],
                  })),
                },
              })),
            },
          },
          include: {
            items: {
              include: {
                dishes: {
                  include: {
                    dish: {
                      include: {
                        ingredients: {
                          include: {
                            ingredient: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        });
      });

      return menu;
    }

    // Update menu fields without items
    const menu = await fastify.prisma.menu.update({
      where: { id },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.servingCount && { servingCount: data.servingCount }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.isTemplate !== undefined && { isTemplate: data.isTemplate }),
      },
      include: {
        items: {
          include: {
            dishes: {
              include: {
                dish: {
                  include: {
                    ingredients: {
                      include: {
                        ingredient: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    return menu;
  });

  // Delete menu
  fastify.delete('/:id', { preHandler: authenticate }, async (request, reply) => {
    const { id } = menuIdSchema.parse(request.params);

    // Check if menu exists and user owns it
    const existingMenu = await fastify.prisma.menu.findUnique({
      where: { id },
    });

    if (!existingMenu) {
      throw new NotFoundError('Menu');
    }

    if (existingMenu.userId !== request.user!.userId) {
      throw new AuthorizationError('You can only delete your own menus');
    }

    await fastify.prisma.menu.delete({
      where: { id },
    });

    return reply.code(204).send();
  });

  // Get MenuItemDish ingredients
  fastify.get('/item-dishes/:menuItemDishId/ingredients', { preHandler: authenticate }, async (request) => {
    const { menuItemDishId } = request.params as { menuItemDishId: string };

    const menuItemDish = await fastify.prisma.menuItemDish.findUnique({
      where: { id: menuItemDishId },
      include: {
        menuItem: {
          include: {
            menu: true,
          },
        },
      },
    });

    if (!menuItemDish) {
      throw new NotFoundError('Menu item dish');
    }

    // Check authorization
    if (menuItemDish.menuItem.menu.userId !== request.user!.userId) {
      throw new AuthorizationError('You can only access your own menus');
    }

    // Fetch ingredient details for the JSON array
    const ingredientData = menuItemDish.ingredients as Array<{ ingredientId: string; quantity: number }> || [];

    if (ingredientData.length === 0) {
      return { ingredients: [] };
    }

    const ingredients = await fastify.prisma.ingredient.findMany({
      where: {
        id: { in: ingredientData.map(i => i.ingredientId) },
      },
    });

    const ingredientMap = new Map(ingredients.map(ing => [ing.id, ing]));

    return {
      ingredients: ingredientData.map(data => ({
        ...ingredientMap.get(data.ingredientId),
        quantity: data.quantity,
      })),
    };
  });

  // Update MenuItemDish ingredients (replace all)
  fastify.put('/item-dishes/:menuItemDishId/ingredients', { preHandler: authenticate }, async (request) => {
    const { menuItemDishId } = request.params as { menuItemDishId: string };
    const { ingredients } = request.body as { ingredients: Array<{ ingredientId: string; quantity: number }> };

    const menuItemDish = await fastify.prisma.menuItemDish.findUnique({
      where: { id: menuItemDishId },
      include: {
        menuItem: {
          include: {
            menu: true,
          },
        },
      },
    });

    if (!menuItemDish) {
      throw new NotFoundError('Menu item dish');
    }

    // Check authorization
    if (menuItemDish.menuItem.menu.userId !== request.user!.userId) {
      throw new AuthorizationError('You can only modify your own menus');
    }

    // Verify all ingredients exist
    if (ingredients.length > 0) {
      const ingredientIds = ingredients.map(i => i.ingredientId);
      const foundIngredients = await fastify.prisma.ingredient.findMany({
        where: { id: { in: ingredientIds } },
      });

      if (foundIngredients.length !== ingredientIds.length) {
        throw new NotFoundError('One or more ingredients');
      }
    }

    // Update the ingredients JSON
    const updated = await fastify.prisma.menuItemDish.update({
      where: { id: menuItemDishId },
      data: {
        ingredients,
      },
    });

    return updated;
  });

  // Add single ingredient to MenuItemDish
  fastify.post('/item-dishes/:menuItemDishId/ingredients', { preHandler: authenticate }, async (request) => {
    const { menuItemDishId } = request.params as { menuItemDishId: string };
    const { ingredientId, quantity } = request.body as { ingredientId: string; quantity: number };

    const menuItemDish = await fastify.prisma.menuItemDish.findUnique({
      where: { id: menuItemDishId },
      include: {
        menuItem: {
          include: {
            menu: true,
          },
        },
      },
    });

    if (!menuItemDish) {
      throw new NotFoundError('Menu item dish');
    }

    // Check authorization
    if (menuItemDish.menuItem.menu.userId !== request.user!.userId) {
      throw new AuthorizationError('You can only modify your own menus');
    }

    // Verify ingredient exists
    const ingredient = await fastify.prisma.ingredient.findUnique({
      where: { id: ingredientId },
    });

    if (!ingredient) {
      throw new NotFoundError('Ingredient');
    }

    // Get current ingredients
    const currentIngredients = (menuItemDish.ingredients as Array<{ ingredientId: string; quantity: number }>) || [];

    // Check if ingredient already exists, update if so
    const existingIndex = currentIngredients.findIndex(i => i.ingredientId === ingredientId);

    if (existingIndex >= 0) {
      currentIngredients[existingIndex].quantity = quantity;
    } else {
      currentIngredients.push({ ingredientId, quantity });
    }

    // Update
    const updated = await fastify.prisma.menuItemDish.update({
      where: { id: menuItemDishId },
      data: {
        ingredients: currentIngredients,
      },
    });

    return updated;
  });

  // Remove ingredient from MenuItemDish
  fastify.delete('/item-dishes/:menuItemDishId/ingredients/:ingredientId', { preHandler: authenticate }, async (request, reply) => {
    const { menuItemDishId, ingredientId } = request.params as { menuItemDishId: string; ingredientId: string };

    const menuItemDish = await fastify.prisma.menuItemDish.findUnique({
      where: { id: menuItemDishId },
      include: {
        menuItem: {
          include: {
            menu: true,
          },
        },
      },
    });

    if (!menuItemDish) {
      throw new NotFoundError('Menu item dish');
    }

    // Check authorization
    if (menuItemDish.menuItem.menu.userId !== request.user!.userId) {
      throw new AuthorizationError('You can only modify your own menus');
    }

    // Get current ingredients and filter out the one to remove
    const currentIngredients = (menuItemDish.ingredients as Array<{ ingredientId: string; quantity: number }>) || [];
    const filteredIngredients = currentIngredients.filter(i => i.ingredientId !== ingredientId);

    // Update
    await fastify.prisma.menuItemDish.update({
      where: { id: menuItemDishId },
      data: {
        ingredients: filteredIngredients,
      },
    });

    return reply.code(204).send();
  });
}
