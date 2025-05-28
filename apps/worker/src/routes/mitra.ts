import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { mitras, services, drivers } from '@treksistem/db-schema';
import { requireMitraAuth } from '../middleware/auth';
import type { AppContext } from '../types';

const mitraRoutes = new Hono<AppContext>();

// Apply Mitra authentication to all routes in this module
mitraRoutes.use('*', requireMitraAuth);

/**
 * GET /api/mitra/profile
 * Get current Mitra's profile information
 */
mitraRoutes.get('/profile', async (c) => {
  const mitraId = c.get('currentMitraId')!; // Safe to use ! since requireMitraAuth ensures this exists
  const userEmail = c.get('currentUserEmail')!;
  
  try {
    const db = c.get('db');
    
    const mitraRecord = await db
      .select()
      .from(mitras)
      .where(eq(mitras.id, mitraId))
      .limit(1);

    if (mitraRecord.length === 0) {
      return c.json({
        success: false,
        error: {
          code: 'MITRA_NOT_FOUND',
          message: 'Mitra profile not found.',
        },
      }, 404);
    }

    const mitra = mitraRecord[0];

    return c.json({
      success: true,
      data: {
        mitra: {
          id: mitra.id,
          name: mitra.name,
          ownerUserId: mitra.ownerUserId,
          createdAt: mitra.createdAt,
          updatedAt: mitra.updatedAt,
        },
        currentUser: {
          email: userEmail,
        },
      },
    });
  } catch (error) {
    console.error('[Mitra Profile] Database error:', error);
    return c.json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to retrieve Mitra profile.',
      },
    }, 500);
  }
});

/**
 * GET /api/mitra/services
 * Get all services for the current Mitra
 */
mitraRoutes.get('/services', async (c) => {
  const mitraId = c.get('currentMitraId')!;
  
  try {
    const db = c.get('db');
    
    const serviceRecords = await db
      .select()
      .from(services)
      .where(eq(services.mitraId, mitraId));

    return c.json({
      success: true,
      data: {
        services: serviceRecords.map(service => ({
          id: service.id,
          name: service.name,
          serviceTypeKey: service.serviceTypeKey,
          configJson: service.configJson,
          isActive: service.isActive,
          createdAt: service.createdAt,
          updatedAt: service.updatedAt,
        })),
        total: serviceRecords.length,
      },
    });
  } catch (error) {
    console.error('[Mitra Services] Database error:', error);
    return c.json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to retrieve services.',
      },
    }, 500);
  }
});

/**
 * GET /api/mitra/drivers
 * Get all drivers for the current Mitra
 */
mitraRoutes.get('/drivers', async (c) => {
  const mitraId = c.get('currentMitraId')!;
  
  try {
    const db = c.get('db');
    
    const driverRecords = await db
      .select()
      .from(drivers)
      .where(eq(drivers.mitraId, mitraId));

    return c.json({
      success: true,
      data: {
        drivers: driverRecords.map(driver => ({
          id: driver.id,
          identifier: driver.identifier,
          name: driver.name,
          configJson: driver.configJson,
          isActive: driver.isActive,
          createdAt: driver.createdAt,
          updatedAt: driver.updatedAt,
        })),
        total: driverRecords.length,
      },
    });
  } catch (error) {
    console.error('[Mitra Drivers] Database error:', error);
    return c.json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to retrieve drivers.',
      },
    }, 500);
  }
});

/**
 * PUT /api/mitra/profile
 * Update current Mitra's profile information
 */
mitraRoutes.put('/profile', 
  zValidator('json', z.object({
    name: z.string().min(1, 'Mitra name is required').max(255),
  })),
  async (c) => {
    const mitraId = c.get('currentMitraId')!;
    const { name } = c.req.valid('json');
    
    try {
      const db = c.get('db');
      
      const updatedMitra = await db
        .update(mitras)
        .set({ 
          name,
          updatedAt: new Date(),
        })
        .where(eq(mitras.id, mitraId))
        .returning();

      if (updatedMitra.length === 0) {
        return c.json({
          success: false,
          error: {
            code: 'MITRA_NOT_FOUND',
            message: 'Mitra not found or update failed.',
          },
        }, 404);
      }

      return c.json({
        success: true,
        data: {
          mitra: {
            id: updatedMitra[0].id,
            name: updatedMitra[0].name,
            ownerUserId: updatedMitra[0].ownerUserId,
            createdAt: updatedMitra[0].createdAt,
            updatedAt: updatedMitra[0].updatedAt,
          },
        },
      });
    } catch (error) {
      console.error('[Mitra Profile Update] Database error:', error);
      return c.json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to update Mitra profile.',
        },
      }, 500);
    }
  }
);

/**
 * GET /api/mitra/auth/test
 * Test endpoint to verify authentication and authorization
 */
mitraRoutes.get('/auth/test', (c) => {
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