import type { FastifyInstance } from 'fastify';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  createIngredientSchema,
  updateIngredientSchema,
  ingredientIdSchema,
  paginationSchema,
} from '../schemas/index.js';
import { NotFoundError } from '../utils/errors.js';

export default async function ingredientRoutes(fastify: FastifyInstance) {
  // Create ingredient (system-wide, but auth required)
  fastify.post('/', { preHandler: authenticate }, async (request) => {
    const data = createIngredientSchema.parse(request.body);

    const ingredient = await fastify.prisma.ingredient.create({
      data,
    });

    return ingredient;
  });

  // List ingredients with pagination and optional filtering
  fastify.get('/', { preHandler: authenticate }, async (request) => {
    const { limit, offset } = paginationSchema.parse(request.query);
    const { category, search } = request.query as {
      category?: string;
      search?: string;
    };

    const where: any = {};

    if (category) {
      where.category = category;
    }

    if (search) {
      where.name = {
        contains: search,
        mode: 'insensitive',
      };
    }

    const [ingredients, total] = await Promise.all([
      fastify.prisma.ingredient.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { name: 'asc' },
      }),
      fastify.prisma.ingredient.count({ where }),
    ]);

    return {
      ingredients,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    };
  });

  // Get single ingredient
  fastify.get('/:id', { preHandler: authenticate }, async (request) => {
    const { id } = ingredientIdSchema.parse(request.params);

    const ingredient = await fastify.prisma.ingredient.findUnique({
      where: { id },
      include: {
        dishIngredients: {
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
    });

    if (!ingredient) {
      throw new NotFoundError('Ingredient');
    }

    return ingredient;
  });

  // Update ingredient
  fastify.patch('/:id', { preHandler: authenticate }, async (request) => {
    const { id } = ingredientIdSchema.parse(request.params);
    const data = updateIngredientSchema.parse(request.body);

    const existingIngredient = await fastify.prisma.ingredient.findUnique({
      where: { id },
    });

    if (!existingIngredient) {
      throw new NotFoundError('Ingredient');
    }

    const ingredient = await fastify.prisma.ingredient.update({
      where: { id },
      data,
    });

    return ingredient;
  });

  // Delete ingredient
  fastify.delete('/:id', { preHandler: authenticate }, async (request, reply) => {
    const { id } = ingredientIdSchema.parse(request.params);

    const existingIngredient = await fastify.prisma.ingredient.findUnique({
      where: { id },
    });

    if (!existingIngredient) {
      throw new NotFoundError('Ingredient');
    }

    // Note: onDelete: Restrict will prevent deletion if used in dishes
    await fastify.prisma.ingredient.delete({
      where: { id },
    });

    return reply.code(204).send();
  });
}
