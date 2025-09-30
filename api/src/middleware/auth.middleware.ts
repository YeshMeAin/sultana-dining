import type { FastifyRequest, FastifyReply } from 'fastify';
import type { JWTPayload } from '../utils/jwt.js';

declare module 'fastify' {
  interface FastifyRequest {
    user?: JWTPayload;
  }
}

export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const decoded = await request.jwtVerify<JWTPayload>();
    request.user = decoded;
  } catch (error) {
    return reply.code(401).send({
      error: 'Unauthorized',
      message: 'Invalid or missing authentication token',
    });
  }
}
