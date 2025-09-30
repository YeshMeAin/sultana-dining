import type { FastifyInstance } from 'fastify';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  createClientSchema,
  updateClientSchema,
  clientIdSchema,
  paginationSchema,
} from '../schemas/index.js';
import { NotFoundError, AuthorizationError } from '../utils/errors.js';

export default async function clientRoutes(fastify: FastifyInstance) {
  // Create client
  fastify.post('/', { preHandler: authenticate }, async (request) => {
    const data = createClientSchema.parse(request.body);

    const client = await fastify.prisma.client.create({
      data: {
        ...data,
        userId: request.user!.userId,
      },
    });

    return client;
  });

  // List user's clients with pagination
  fastify.get('/', { preHandler: authenticate }, async (request) => {
    const { limit, offset } = paginationSchema.parse(request.query);
    const { search } = request.query as { search?: string };

    const where: any = {
      userId: request.user!.userId,
    };

    if (search) {
      where.OR = [
        {
          name: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          email: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
    }

    const [clients, total] = await Promise.all([
      fastify.prisma.client.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: { events: true },
          },
        },
      }),
      fastify.prisma.client.count({ where }),
    ]);

    return {
      clients,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    };
  });

  // Get single client with events
  fastify.get('/:id', { preHandler: authenticate }, async (request) => {
    const { id } = clientIdSchema.parse(request.params);

    const client = await fastify.prisma.client.findUnique({
      where: { id },
      include: {
        events: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            eventDate: true,
            status: true,
            guestCount: true,
          },
        },
      },
    });

    if (!client) {
      throw new NotFoundError('Client');
    }

    // Check authorization
    if (client.userId !== request.user!.userId) {
      throw new AuthorizationError('You can only access your own clients');
    }

    return client;
  });

  // Update client
  fastify.patch('/:id', { preHandler: authenticate }, async (request) => {
    const { id } = clientIdSchema.parse(request.params);
    const data = updateClientSchema.parse(request.body);

    const existingClient = await fastify.prisma.client.findUnique({
      where: { id },
    });

    if (!existingClient) {
      throw new NotFoundError('Client');
    }

    if (existingClient.userId !== request.user!.userId) {
      throw new AuthorizationError('You can only update your own clients');
    }

    const client = await fastify.prisma.client.update({
      where: { id },
      data,
    });

    return client;
  });

  // Delete client
  fastify.delete('/:id', { preHandler: authenticate }, async (request, reply) => {
    const { id } = clientIdSchema.parse(request.params);

    const existingClient = await fastify.prisma.client.findUnique({
      where: { id },
    });

    if (!existingClient) {
      throw new NotFoundError('Client');
    }

    if (existingClient.userId !== request.user!.userId) {
      throw new AuthorizationError('You can only delete your own clients');
    }

    await fastify.prisma.client.delete({
      where: { id },
    });

    return reply.code(204).send();
  });
}
