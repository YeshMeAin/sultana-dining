import type { FastifyInstance } from 'fastify';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  createDishSchema,
  updateDishSchema,
  addDishIngredientSchema,
  dishIdSchema,
  ingredientIdSchema,
  paginationSchema,
} from '../schemas/index.js';
import { NotFoundError, AuthorizationError } from '../utils/errors.js';
import { calculateDishCost } from '../services/calculation.service.js';

export default async function dishRoutes(fastify: FastifyInstance) {
  // Create dish with recipe text and servings
  fastify.post('/', { preHandler: authenticate }, async (request) => {
    const data = createDishSchema.parse(request.body);

    const dish = await fastify.prisma.dish.create({
      data: {
        ...data,
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

    return dish;
  });

  // List user's dishes with pagination and cost calculation
  fastify.get('/', { preHandler: authenticate }, async (request) => {
    const { limit, offset } = paginationSchema.parse(request.query);

    const [dishes, total] = await Promise.all([
      fastify.prisma.dish.findMany({
        where: { userId: request.user!.userId },
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
        include: {
          ingredients: {
            include: {
              ingredient: true,
            },
          },
        },
      }),
      fastify.prisma.dish.count({
        where: { userId: request.user!.userId },
      }),
    ]);

    // Add cost calculations to each dish
    const dishesWithCosts = dishes.map((dish) => {
      const costCalc = calculateDishCost(dish);
      return {
        ...dish,
        costCalculation: costCalc,
      };
    });

    return {
      dishes: dishesWithCosts,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    };
  });

  // Get single dish with ingredients and cost calculation
  fastify.get('/:id', { preHandler: authenticate }, async (request) => {
    const { id } = dishIdSchema.parse(request.params);

    const dish = await fastify.prisma.dish.findUnique({
      where: { id },
      include: {
        ingredients: {
          include: {
            ingredient: true,
          },
        },
      },
    });

    if (!dish) {
      throw new NotFoundError('Dish');
    }

    // Check authorization
    if (dish.userId !== request.user!.userId) {
      throw new AuthorizationError('You can only access your own dishes');
    }

    const costCalc = calculateDishCost(dish);

    return {
      ...dish,
      costCalculation: costCalc,
    };
  });

  // Update dish
  fastify.patch('/:id', { preHandler: authenticate }, async (request) => {
    const { id } = dishIdSchema.parse(request.params);
    const data = updateDishSchema.parse(request.body);

    const existingDish = await fastify.prisma.dish.findUnique({
      where: { id },
    });

    if (!existingDish) {
      throw new NotFoundError('Dish');
    }

    if (existingDish.userId !== request.user!.userId) {
      throw new AuthorizationError('You can only update your own dishes');
    }

    const dish = await fastify.prisma.dish.update({
      where: { id },
      data,
      include: {
        ingredients: {
          include: {
            ingredient: true,
          },
        },
      },
    });

    return dish;
  });

  // Delete dish
  fastify.delete('/:id', { preHandler: authenticate }, async (request, reply) => {
    const { id } = dishIdSchema.parse(request.params);

    const existingDish = await fastify.prisma.dish.findUnique({
      where: { id },
    });

    if (!existingDish) {
      throw new NotFoundError('Dish');
    }

    if (existingDish.userId !== request.user!.userId) {
      throw new AuthorizationError('You can only delete your own dishes');
    }

    await fastify.prisma.dish.delete({
      where: { id },
    });

    return reply.code(204).send();
  });

  // Add ingredient to dish
  fastify.post('/:id/ingredients', { preHandler: authenticate }, async (request) => {
    const { id } = dishIdSchema.parse(request.params);
    const { ingredientId, quantity } = addDishIngredientSchema.parse(request.body);

    // Check dish exists and user owns it
    const dish = await fastify.prisma.dish.findUnique({
      where: { id },
    });

    if (!dish) {
      throw new NotFoundError('Dish');
    }

    if (dish.userId !== request.user!.userId) {
      throw new AuthorizationError('You can only modify your own dishes');
    }

    // Check ingredient exists
    const ingredient = await fastify.prisma.ingredient.findUnique({
      where: { id: ingredientId },
    });

    if (!ingredient) {
      throw new NotFoundError('Ingredient');
    }

    // Add ingredient to dish (or update if already exists)
    const dishIngredient = await fastify.prisma.dishIngredient.upsert({
      where: {
        dishId_ingredientId: {
          dishId: id,
          ingredientId,
        },
      },
      create: {
        dishId: id,
        ingredientId,
        quantity,
      },
      update: {
        quantity,
      },
      include: {
        ingredient: true,
      },
    });

    return dishIngredient;
  });

  // Remove ingredient from dish
  fastify.delete(
    '/:id/ingredients/:ingredientId',
    { preHandler: authenticate },
    async (request, reply) => {
      const { id } = dishIdSchema.parse(request.params);
      const { id: ingredientId } = ingredientIdSchema.parse({
        id: (request.params as any).ingredientId,
      });

      // Check dish exists and user owns it
      const dish = await fastify.prisma.dish.findUnique({
        where: { id },
      });

      if (!dish) {
        throw new NotFoundError('Dish');
      }

      if (dish.userId !== request.user!.userId) {
        throw new AuthorizationError('You can only modify your own dishes');
      }

      // Delete the dish ingredient association
      await fastify.prisma.dishIngredient.delete({
        where: {
          dishId_ingredientId: {
            dishId: id,
            ingredientId,
          },
        },
      });

      return reply.code(204).send();
    }
  );
}
