import type { VercelRequest } from '@vercel/node';
import { createClerkClient } from '@clerk/backend';

/**
 * Vercel serverless authentication helper using Clerk
 * Based on: https://clerk.com/docs/reference/backend/authenticate-request
 */

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY!,
  publishableKey: process.env.VITE_CLERK_PUBLISHABLE_KEY!,
});

export interface AuthResult {
  userId: string | null;
  sessionId: string | null;
  isAuthenticated: boolean;
}

/**
 * Authenticates a Vercel request using Clerk's authenticateRequest method
 * This is a networkless operation if JWKS are cached
 */
export async function authenticateRequest(req: VercelRequest): Promise<AuthResult> {
  try {
    // Convert Vercel request to standard Request object format
    const url = `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}${req.url}`;
    const headers = new Headers(req.headers as HeadersInit);

    // Create a Request object for Clerk
    const request = new Request(url, {
      method: req.method,
      headers,
    });

    // Authenticate the request with Clerk
    const authState = await clerkClient.authenticateRequest(request, {
      // Optional: Specify authorized parties for enhanced security
      // authorizedParties: [process.env.VERCEL_URL],
    });

    if (!authState.isSignedIn) {
      return {
        userId: null,
        sessionId: null,
        isAuthenticated: false,
      };
    }

    return {
      userId: authState.toAuth().userId,
      sessionId: authState.toAuth().sessionId,
      isAuthenticated: true,
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return {
      userId: null,
      sessionId: null,
      isAuthenticated: false,
    };
  }
}

/**
 * Require authentication for an API route
 * Returns the userId or throws an error
 */
export async function requireAuth(req: VercelRequest): Promise<string> {
  const auth = await authenticateRequest(req);

  if (!auth.isAuthenticated || !auth.userId) {
    throw new Error('Unauthorized');
  }

  return auth.userId;
}
