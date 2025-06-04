import { Context, Next } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { eq } from 'drizzle-orm';
import { mitras } from '@treksistem/db-schema';
import type { AppContext } from '../types';

/**
 * Cloudflare Access Authentication Middleware
 * Extracts authenticated user email from CF Access headers
 * and sets it in the context for downstream middleware/handlers
 */
export const cfAccessAuth = async (c: Context<AppContext>, next: Next) => {
  const userEmailFromHeader = c.req.header('Cf-Access-Authenticated-User-Email');

  if (userEmailFromHeader) {
    c.set('currentUserEmail', userEmailFromHeader);
    console.log(`[CF Access] Authenticated user: ${userEmailFromHeader}`);
  } else if (c.env.WORKER_ENV === 'development') {
    // For local development, allow mock authentication
    const mockEmail = c.req.header('X-Mock-User-Email') || 'dev-admin@example.com';
    c.set('currentUserEmail', mockEmail);
    console.log(`[CF Access Mock] Using mock user: ${mockEmail}`);
  } else {
    // In production/staging, missing CF Access header indicates misconfiguration
    console.error(
      '[CF Access] CRITICAL: Missing Cf-Access-Authenticated-User-Email header in non-dev environment',
    );
    throw new HTTPException(401, {
      message: 'Authentication required. Please ensure Cloudflare Access is properly configured.',
    });
  }

  await next();
};

/**
 * Mitra Authorization Middleware
 * Validates that the authenticated user has access to a Mitra account
 * and sets the currentMitraId in context
 */
export const mitraAuth = async (c: Context<AppContext>, next: Next) => {
  const userEmail = c.get('currentUserEmail');

  if (!userEmail) {
    console.error('[Mitra Auth] No authenticated user email found in context');
    throw new HTTPException(401, {
      message: 'Authentication required.',
    });
  }

  try {
    const db = c.get('db');

    // Find Mitra record by owner_user_id (which stores the authenticated email)
    const mitraRecord = await db
      .select()
      .from(mitras)
      .where(eq(mitras.ownerUserId, userEmail))
      .limit(1);

    if (mitraRecord.length === 0) {
      console.warn(`[Mitra Auth] No Mitra found for user: ${userEmail}`);
      throw new HTTPException(403, {
        message: 'Access denied. No Mitra account associated with this user.',
      });
    }

    const mitra = mitraRecord[0];
    c.set('currentMitraId', mitra.id);

    console.log(
      `[Mitra Auth] Authorized Mitra: ${mitra.id} (${mitra.name}) for user: ${userEmail}`,
    );
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }

    console.error('[Mitra Auth] Database error during authorization:', error);
    throw new HTTPException(500, {
      message: 'Authorization check failed due to internal error.',
    });
  }

  await next();
};

/**
 * Combined CF Access + Mitra Authorization Middleware
 * Convenience middleware that applies both authentication and authorization
 */
export const requireMitraAuth = async (c: Context<AppContext>, next: Next) => {
  await cfAccessAuth(c, next);
  await mitraAuth(c, next);
};

/**
 * Development-only middleware to bypass authentication
 * Should only be used for testing endpoints in development
 */
export const devBypassAuth = async (c: Context<AppContext>, next: Next) => {
  if (c.env.WORKER_ENV !== 'development') {
    throw new HTTPException(403, {
      message: 'Development bypass not allowed in production.',
    });
  }

  // Set mock values for development
  c.set('currentUserEmail', 'dev-admin@example.com');
  c.set('currentMitraId', 'dev-mitra-id');

  console.log('[Dev Bypass] Using development authentication bypass');

  await next();
};
