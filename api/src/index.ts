import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import jwt from '@fastify/jwt';
import { ZodError } from 'zod';
import { connectDB, disconnectDB, prisma } from './utils/db.js';
import { AppError } from './utils/errors.js';
import { parseTokenTTL } from './utils/jwt.js';

// Routes
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import ingredientRoutes from './routes/ingredient.routes.js';
import dishRoutes from './routes/dish.routes.js';
import menuRoutes from './routes/menu.routes.js';
import clientRoutes from './routes/client.routes.js';
import eventRoutes from './routes/event.routes.js';

const fastify = Fastify({
  logger: {
    transport:
      process.env.NODE_ENV === 'development'
        ? {
            target: 'pino-pretty',
            options: {
              translateTime: 'HH:MM:ss Z',
              ignore: 'pid,hostname',
            },
          }
        : undefined,
  },
});

// Plugins
await fastify.register(cors, {
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
});

await fastify.register(cookie);

await fastify.register(jwt, {
  secret: process.env.JWT_ACCESS_SECRET || 'default-secret-change-me',
  sign: {
    expiresIn: process.env.JWT_ACCESS_TTL || '15m',
  },
});

// Decorator to add JWT utilities
fastify.decorate('signRefreshToken', function (payload: any) {
  const secret = process.env.JWT_REFRESH_SECRET || 'default-refresh-secret';
  const ttl = process.env.JWT_REFRESH_TTL || '7d';
  return this.jwt.sign(payload, { secret, expiresIn: ttl });
});

fastify.decorate('verifyRefreshToken', async function (token: string) {
  const secret = process.env.JWT_REFRESH_SECRET || 'default-refresh-secret';
  return this.jwt.verify(token, { secret });
});

declare module 'fastify' {
  interface FastifyInstance {
    signRefreshToken(payload: any): string;
    verifyRefreshToken(token: string): Promise<any>;
  }
}

// Make Prisma available to routes
fastify.decorate('prisma', prisma);

declare module 'fastify' {
  interface FastifyInstance {
    prisma: typeof prisma;
  }
}

// Health check
fastify.get('/', async () => {
  return {
    name: 'Sultana Dining API',
    version: '1.0.0',
    status: 'healthy',
  };
});

fastify.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Routes
await fastify.register(authRoutes, { prefix: '/auth' });
await fastify.register(userRoutes, { prefix: '/users' });
await fastify.register(ingredientRoutes, { prefix: '/ingredients' });
await fastify.register(dishRoutes, { prefix: '/dishes' });
await fastify.register(menuRoutes, { prefix: '/menus' });
await fastify.register(clientRoutes, { prefix: '/clients' });
await fastify.register(eventRoutes, { prefix: '/events' });

// Error handler
fastify.setErrorHandler((error, request, reply) => {
  // Zod validation errors
  if (error instanceof ZodError) {
    return reply.code(400).send({
      error: 'Validation Error',
      message: 'Invalid request data',
      details: error.errors,
    });
  }

  // App errors
  if (error instanceof AppError) {
    return reply.code(error.statusCode).send({
      error: error.name,
      message: error.message,
    });
  }

  // Log unexpected errors
  request.log.error(error);

  // Default error
  return reply.code(500).send({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
  });
});

// Graceful shutdown
const signals = ['SIGINT', 'SIGTERM'];
signals.forEach((signal) => {
  process.on(signal, async () => {
    console.log(`\n${signal} received, closing server...`);
    await fastify.close();
    await disconnectDB();
    process.exit(0);
  });
});

// Start server
const start = async () => {
  try {
    await connectDB();

    const port = parseInt(process.env.PORT || '3000', 10);
    const host = process.env.HOST || '0.0.0.0';

    await fastify.listen({ port, host });
    console.log(`🚀 Server running at http://${host}:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
