import type { FastifyReply } from 'fastify';

export interface JWTPayload {
  userId: string;
  email: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export function parseTokenTTL(ttl: string): number {
  const match = ttl.match(/^(\d+)([smhd])$/);
  if (!match) throw new Error(`Invalid TTL format: ${ttl}`);

  const value = parseInt(match[1], 10);
  const unit = match[2];

  const multipliers: Record<string, number> = {
    s: 1,
    m: 60,
    h: 60 * 60,
    d: 60 * 60 * 24,
  };

  return value * multipliers[unit];
}

export function setRefreshTokenCookie(
  reply: FastifyReply,
  refreshToken: string,
  maxAge: number
): void {
  reply.setCookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge,
    path: '/',
  });
}

export function clearRefreshTokenCookie(reply: FastifyReply): void {
  reply.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
  });
}
