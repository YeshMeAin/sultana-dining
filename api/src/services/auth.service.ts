import { OAuth2Client } from 'google-auth-library';
import type { PrismaClient } from '@prisma/client';

const client = new OAuth2Client();

export interface GoogleTokenPayload {
  email: string;
  name?: string;
  sub: string; // Google user ID
}

export async function verifyGoogleToken(
  idToken: string
): Promise<GoogleTokenPayload> {
  const clientIds = [
    process.env.GOOGLE_OAUTH_CLIENT_ID,
    process.env.GOOGLE_OAUTH_CLIENT_ID_IOS,
  ].filter(Boolean) as string[];

  if (clientIds.length === 0) {
    throw new Error('No Google OAuth client IDs configured');
  }

  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: clientIds,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email || !payload.sub) {
      throw new Error('Invalid token payload');
    }

    return {
      email: payload.email,
      name: payload.name,
      sub: payload.sub,
    };
  } catch (error) {
    throw new Error('Invalid Google ID token');
  }
}

export async function findOrCreateUser(
  prisma: PrismaClient,
  googlePayload: GoogleTokenPayload
) {
  const existingUser = await prisma.user.findUnique({
    where: { googleId: googlePayload.sub },
  });

  if (existingUser) {
    return existingUser;
  }

  // Check if email exists (user might have signed up differently before)
  const userByEmail = await prisma.user.findUnique({
    where: { email: googlePayload.email },
  });

  if (userByEmail) {
    // Link Google account to existing user
    return prisma.user.update({
      where: { id: userByEmail.id },
      data: {
        googleId: googlePayload.sub,
        displayName: userByEmail.displayName || googlePayload.name,
      },
    });
  }

  // Create new user
  return prisma.user.create({
    data: {
      email: googlePayload.email,
      googleId: googlePayload.sub,
      displayName: googlePayload.name,
    },
  });
}
