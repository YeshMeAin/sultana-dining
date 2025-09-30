import type { FastifyInstance } from 'fastify';
import { authenticate } from '../middleware/auth.middleware.js';
import { updateUserSchema } from '../schemas/index.js';
import { NotFoundError } from '../utils/errors.js';

export default async function userRoutes(fastify: FastifyInstance) {
  // Get current user profile
  fastify.get('/me', { preHandler: authenticate }, async (request) => {
    const user = await fastify.prisma.user.findUnique({
      where: { id: request.user!.userId },
      select: {
        id: true,
        email: true,
        displayName: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    return user;
  });

  // Update current user profile
  fastify.patch('/me', { preHandler: authenticate }, async (request) => {
    const data = updateUserSchema.parse(request.body);

    const user = await fastify.prisma.user.update({
      where: { id: request.user!.userId },
      data,
      select: {
        id: true,
        email: true,
        displayName: true,
        updatedAt: true,
      },
    });

    return user;
  });
}
