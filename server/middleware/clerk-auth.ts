import { createClerkClient } from '@clerk/backend';
import type { Request, Response, NextFunction } from 'express';

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

// Extend Express Request to include Clerk auth
declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string;
        sessionId: string;
        claims: Record<string, any>;
      };
    }
  }
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const sessionToken = req.headers.authorization?.replace('Bearer ', '') ||
                        req.cookies?.['__session'];

    if (!sessionToken) {
      res.status(401).json({
        message: 'Unauthorized',
        code: 'MISSING_SESSION_TOKEN'
      });
      return;
    }

    // Verify session with Clerk
    const session = await clerkClient.sessions.verifySession(
      req.headers['x-clerk-session-id'] as string,
      sessionToken
    );

    if (!session || session.status !== 'active') {
      res.status(401).json({
        message: 'Unauthorized',
        code: 'INVALID_SESSION'
      });
      return;
    }

    // Attach user info to request
    req.auth = {
      userId: session.userId,
      sessionId: session.id,
      claims: session as any,
    };

    next();
  } catch (error: any) {
    console.error('Auth error:', error);
    res.status(401).json({
      message: 'Unauthorized',
      code: 'AUTH_ERROR',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

export async function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const sessionToken = req.headers.authorization?.replace('Bearer ', '') ||
                        req.cookies?.['__session'];

    if (sessionToken) {
      const session = await clerkClient.sessions.verifySession(
        req.headers['x-clerk-session-id'] as string,
        sessionToken
      );

      if (session && session.status === 'active') {
        req.auth = {
          userId: session.userId,
          sessionId: session.id,
          claims: session as any,
        };
      }
    }

    next();
  } catch (error) {
    // For optional auth, continue even if verification fails
    next();
  }
}

// Webhook signature verification for Clerk events
export async function verifyClerkWebhook(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

    if (!webhookSecret) {
      throw new Error('CLERK_WEBHOOK_SECRET not configured');
    }

    const svix_id = req.headers['svix-id'] as string;
    const svix_timestamp = req.headers['svix-timestamp'] as string;
    const svix_signature = req.headers['svix-signature'] as string;

    if (!svix_id || !svix_timestamp || !svix_signature) {
      res.status(400).json({ message: 'Missing Svix headers' });
      return;
    }

    // Verify webhook signature using Svix
    const { Webhook } = await import('svix');
    const wh = new Webhook(webhookSecret);

    try {
      wh.verify(JSON.stringify(req.body), {
        'svix-id': svix_id,
        'svix-timestamp': svix_timestamp,
        'svix-signature': svix_signature,
      });

      next();
    } catch (err) {
      res.status(400).json({ message: 'Webhook verification failed' });
    }
  } catch (error: any) {
    console.error('Webhook verification error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
