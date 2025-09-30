import type { FastifyInstance } from 'fastify';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  createEventSchema,
  updateEventSchema,
  eventIdSchema,
  paginationSchema,
} from '../schemas/index.js';
import { NotFoundError, AuthorizationError } from '../utils/errors.js';
import { calculateEventProposal } from '../services/calculation.service.js';

export default async function eventRoutes(fastify: FastifyInstance) {
  // Create event
  fastify.post('/', { preHandler: authenticate }, async (request) => {
    const data = createEventSchema.parse(request.body);

    // Verify client exists if provided
    if (data.clientId) {
      const client = await fastify.prisma.client.findUnique({
        where: { id: data.clientId },
      });

      if (!client || client.userId !== request.user!.userId) {
        throw new NotFoundError('Client');
      }
    }

    // Verify menu exists if provided
    if (data.menuId) {
      const menu = await fastify.prisma.menu.findUnique({
        where: { id: data.menuId },
      });

      if (!menu || menu.userId !== request.user!.userId) {
        throw new NotFoundError('Menu');
      }
    }

    const event = await fastify.prisma.event.create({
      data: {
        ...data,
        userId: request.user!.userId,
        eventDate: data.eventDate ? new Date(data.eventDate) : null,
      },
      include: {
        client: true,
        menu: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return event;
  });

  // List user's events with pagination and filtering
  fastify.get('/', { preHandler: authenticate }, async (request) => {
    const { limit, offset } = paginationSchema.parse(request.query);
    const { status, clientId } = request.query as {
      status?: string;
      clientId?: string;
    };

    const where: any = {
      userId: request.user!.userId,
    };

    if (status) {
      where.status = status;
    }

    if (clientId) {
      where.clientId = clientId;
    }

    const [events, total] = await Promise.all([
      fastify.prisma.event.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
        include: {
          client: {
            select: {
              id: true,
              name: true,
            },
          },
          menu: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      }),
      fastify.prisma.event.count({ where }),
    ]);

    return {
      events,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    };
  });

  // Get single event with full details
  fastify.get('/:id', { preHandler: authenticate }, async (request) => {
    const { id } = eventIdSchema.parse(request.params);

    const event = await fastify.prisma.event.findUnique({
      where: { id },
      include: {
        client: true,
        menu: {
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
        },
      },
    });

    if (!event) {
      throw new NotFoundError('Event');
    }

    // Check authorization
    if (event.userId !== request.user!.userId) {
      throw new AuthorizationError('You can only access your own events');
    }

    return event;
  });

  // Get event proposal with full cost calculation
  fastify.get('/:id/proposal', { preHandler: authenticate }, async (request) => {
    const { id } = eventIdSchema.parse(request.params);

    const event = await fastify.prisma.event.findUnique({
      where: { id },
      include: {
        client: true,
        menu: {
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
        },
      },
    });

    if (!event) {
      throw new NotFoundError('Event');
    }

    if (event.userId !== request.user!.userId) {
      throw new AuthorizationError('You can only access your own events');
    }

    if (!event.menu) {
      throw new Error('Event must have a menu to generate proposal');
    }

    if (!event.guestCount) {
      throw new Error('Event must have a guest count to generate proposal');
    }

    // Collect all ingredient IDs from all MenuItemDishes
    const allIngredientIds = new Set<string>();
    event.menu.items.forEach((item) => {
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

    // Calculate proposal
    const proposal = calculateEventProposal({
      id: event.id,
      title: event.title,
      guestCount: event.guestCount,
      additionalCosts: (event.additionalCosts as Record<string, number>) || {},
      menu: event.menu,
    }, ingredientMap);

    return {
      event: {
        id: event.id,
        title: event.title,
        eventDate: event.eventDate,
        status: event.status,
        notes: event.notes,
      },
      client: event.client,
      proposal,
    };
  });

  // Update event
  fastify.patch('/:id', { preHandler: authenticate }, async (request) => {
    const { id } = eventIdSchema.parse(request.params);
    const data = updateEventSchema.parse(request.body);

    const existingEvent = await fastify.prisma.event.findUnique({
      where: { id },
    });

    if (!existingEvent) {
      throw new NotFoundError('Event');
    }

    if (existingEvent.userId !== request.user!.userId) {
      throw new AuthorizationError('You can only update your own events');
    }

    // Verify client exists if being updated
    if (data.clientId !== undefined && data.clientId !== null) {
      const client = await fastify.prisma.client.findUnique({
        where: { id: data.clientId },
      });

      if (!client || client.userId !== request.user!.userId) {
        throw new NotFoundError('Client');
      }
    }

    // Verify menu exists if being updated
    if (data.menuId !== undefined && data.menuId !== null) {
      const menu = await fastify.prisma.menu.findUnique({
        where: { id: data.menuId },
      });

      if (!menu || menu.userId !== request.user!.userId) {
        throw new NotFoundError('Menu');
      }
    }

    const event = await fastify.prisma.event.update({
      where: { id },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.clientId !== undefined && { clientId: data.clientId }),
        ...(data.menuId !== undefined && { menuId: data.menuId }),
        ...(data.eventDate !== undefined && {
          eventDate: data.eventDate ? new Date(data.eventDate) : null,
        }),
        ...(data.guestCount !== undefined && { guestCount: data.guestCount }),
        ...(data.additionalCosts !== undefined && {
          additionalCosts: data.additionalCosts,
        }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.status && { status: data.status }),
      },
      include: {
        client: true,
        menu: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return event;
  });

  // Delete event
  fastify.delete('/:id', { preHandler: authenticate }, async (request, reply) => {
    const { id } = eventIdSchema.parse(request.params);

    const existingEvent = await fastify.prisma.event.findUnique({
      where: { id },
    });

    if (!existingEvent) {
      throw new NotFoundError('Event');
    }

    if (existingEvent.userId !== request.user!.userId) {
      throw new AuthorizationError('You can only delete your own events');
    }

    await fastify.prisma.event.delete({
      where: { id },
    });

    return reply.code(204).send();
  });
}
