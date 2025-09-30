import type { FastifyInstance } from 'fastify';
import { googleAuthSchema } from '../schemas/index.js';
import { verifyGoogleToken, findOrCreateUser } from '../services/auth.service.js';
import { setRefreshTokenCookie, clearRefreshTokenCookie, parseTokenTTL } from '../utils/jwt.js';
import { AuthenticationError } from '../utils/errors.js';

export default async function authRoutes(fastify: FastifyInstance) {
  // Google OAuth login
  fastify.post('/google', async (request, reply) => {
    const { idToken } = googleAuthSchema.parse(request.body);

    const googlePayload = await verifyGoogleToken(idToken);
    const user = await findOrCreateUser(fastify.prisma, googlePayload);

    // Generate tokens
    const accessToken = fastify.jwt.sign({
      userId: user.id,
      email: user.email,
    });

    const refreshToken = fastify.signRefreshToken({
      userId: user.id,
      email: user.email,
    });

    // Set refresh token cookie
    const refreshTTL = parseTokenTTL(process.env.JWT_REFRESH_TTL || '7d');
    setRefreshTokenCookie(reply, refreshToken, refreshTTL);

    return {
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
      },
      accessToken,
    };
  });

  // Refresh access token
  fastify.post('/refresh', async (request, reply) => {
    const refreshToken = request.cookies.refreshToken;

    if (!refreshToken) {
      throw new AuthenticationError('Refresh token not found');
    }

    try {
      const decoded = await fastify.verifyRefreshToken(refreshToken);

      // Generate new access token
      const accessToken = fastify.jwt.sign({
        userId: decoded.userId,
        email: decoded.email,
      });

      // Optionally rotate refresh token
      const newRefreshToken = fastify.signRefreshToken({
        userId: decoded.userId,
        email: decoded.email,
      });

      const refreshTTL = parseTokenTTL(process.env.JWT_REFRESH_TTL || '7d');
      setRefreshTokenCookie(reply, newRefreshToken, refreshTTL);

      return { accessToken };
    } catch (error) {
      clearRefreshTokenCookie(reply);
      throw new AuthenticationError('Invalid refresh token');
    }
  });

  // Logout
  fastify.post('/logout', async (request, reply) => {
    clearRefreshTokenCookie(reply);
    return { message: 'Logged out successfully' };
  });
}
