import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import { mitras } from '@treksistem/db-schema';
import { cfAccessAuth, mitraAuth } from '../middleware/auth';
import mitraServiceRoutes from './mitra.services';
import mitraDriverRoutes from './mitra.drivers';
import type { AppContext } from '../types';

const mitraRoutes = new Hono<AppContext>();

// Apply CF Access authentication to all routes
mitraRoutes.use('*', cfAccessAuth);

// Mount service routes
mitraRoutes.route('/services', mitraServiceRoutes);

// Mount driver routes
mitraRoutes.route('/drivers', mitraDriverRoutes);

// === Profile Management Routes (No Mitra Required) ===

/**
 * GET /api/mitra/profile
 * Get current user's Mitra profile information
 * Returns 404 if no Mitra profile exists for the authenticated user
 */
mitraRoutes.get('/profile', async (c) => {
  const userEmail = c.get('currentUserEmail')!;

  try {
    const db = c.get('db');

    const mitraRecord = await db
      .select()
      .from(mitras)
      .where(eq(mitras.ownerUserId, userEmail))
      .limit(1);

    if (mitraRecord.length === 0) {
      return c.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Mitra profile not found for this user.',
          },
        },
        404,
      );
    }

    const mitra = mitraRecord[0];

    return c.json({
      success: true,
      data: {
        id: mitra.id,
        ownerUserId: mitra.ownerUserId,
        name: mitra.name,
        createdAt: mitra.createdAt,
        updatedAt: mitra.updatedAt,
      },
    });
  } catch (error) {
    console.error('[Mitra Profile] Database error:', error);
    throw new Error(
      `Failed to fetch Mitra profile: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
});

/**
 * POST /api/mitra/profile
 * Create new Mitra profile for the authenticated user
 * Returns 409 if Mitra profile already exists
 */
mitraRoutes.post(
  '/profile',
  zValidator(
    'json',
    z.object({
      name: z
        .string()
        .min(3, 'Mitra name must be at least 3 characters')
        .max(100, 'Mitra name must be at most 100 characters'),
    }),
  ),
  async (c) => {
    const { name } = c.req.valid('json');
    const userEmail = c.get('currentUserEmail')!;

    try {
      const db = c.get('db');

      // Check if profile already exists for this email
      const existingMitra = await db
        .select({ id: mitras.id })
        .from(mitras)
        .where(eq(mitras.ownerUserId, userEmail))
        .limit(1);

      if (existingMitra.length > 0) {
        return c.json(
          {
            success: false,
            error: {
              code: 'CONFLICT',
              message: 'Mitra profile already exists for this user.',
            },
          },
          409,
        );
      }

      const newMitraId = createId(); // Generate CUID2
      const [createdMitra] = await db
        .insert(mitras)
        .values({
          id: newMitraId,
          ownerUserId: userEmail,
          name: name,
        })
        .returning();

      if (!createdMitra) {
        throw new Error('Failed to create Mitra profile after insert.');
      }

      return c.json(
        {
          success: true,
          data: {
            id: createdMitra.id,
            ownerUserId: createdMitra.ownerUserId,
            name: createdMitra.name,
            createdAt: createdMitra.createdAt,
            updatedAt: createdMitra.updatedAt,
          },
        },
        201,
      );
    } catch (error: any) {
      console.error('[Mitra Profile Creation] Database error:', error);

      // Handle unique constraint violation (race condition)
      if (error.message?.includes('UNIQUE constraint failed: mitras.owner_user_id')) {
        return c.json(
          {
            success: false,
            error: {
              code: 'CONFLICT',
              message: 'Mitra profile already exists (race condition or constraint failure).',
            },
          },
          409,
        );
      }

      throw new Error('Failed to create Mitra profile.');
    }
  },
);

/**
 * PUT /api/mitra/profile
 * Update current Mitra's profile information
 * Requires existing Mitra profile
 */
mitraRoutes.put(
  '/profile',
  mitraAuth, // Apply Mitra auth specifically to this route
  zValidator(
    'json',
    z.object({
      name: z
        .string()
        .min(3, 'Mitra name must be at least 3 characters')
        .max(100, 'Mitra name must be at most 100 characters'),
    }),
  ),
  async (c) => {
    const mitraId = c.get('currentMitraId')!;
    const { name } = c.req.valid('json');

    try {
      const db = c.get('db');

      const [updatedMitra] = await db
        .update(mitras)
        .set({
          name,
          updatedAt: new Date(),
        })
        .where(eq(mitras.id, mitraId))
        .returning();

      if (!updatedMitra) {
        return c.json(
          {
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'Mitra profile not found during update.',
            },
          },
          404,
        );
      }

      return c.json({
        success: true,
        data: {
          id: updatedMitra.id,
          ownerUserId: updatedMitra.ownerUserId,
          name: updatedMitra.name,
          createdAt: updatedMitra.createdAt,
          updatedAt: updatedMitra.updatedAt,
        },
      });
    } catch (error) {
      console.error('[Mitra Profile Update] Database error:', error);
      throw new Error('Failed to update Mitra profile.');
    }
  },
);

// === Routes Requiring Existing Mitra Profile ===

/**
 * GET /api/mitra/auth/test
 * Test endpoint to verify authentication and authorization
 */
mitraRoutes.get('/auth/test', mitraAuth, (c) => {
  const userEmail = c.get('currentUserEmail')!;
  const mitraId = c.get('currentMitraId')!;

  return c.json({
    success: true,
    data: {
      message: 'Cloudflare Access authentication and Mitra authorization working correctly',
      authentication: {
        userEmail,
        source: 'Cloudflare Access',
      },
      authorization: {
        mitraId,
        scope: 'Mitra Admin',
      },
      timestamp: new Date().toISOString(),
    },
  });
});

export default mitraRoutes;
