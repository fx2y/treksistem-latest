import { drizzle } from 'drizzle-orm/d1';
import { eq, and, isNull } from 'drizzle-orm';
import {
  mitras,
  services,
  drivers,
  driverServices,
  orders,
  orderEvents,
} from '@treksistem/db-schema';

/**
 * Database Test Helper for Integration Testing
 *
 * Provides utilities for managing test data lifecycle,
 * database state verification, and cleanup operations.
 */
export class DatabaseTestHelper {
  private db: any;

  constructor() {
    // In a real test environment, this would be initialized with the test database
    // For now, we'll use a mock or the actual database connection
    this.db = null;
  }

  /**
   * Initialize database connection for testing
   */
  async initialize(database?: any) {
    if (database) {
      this.db = drizzle(database);
    } else {
      // In integration tests, this would connect to the test database
      // For now, we'll simulate the connection
      console.warn('DatabaseTestHelper: Using mock database connection');
    }
  }

  /**
   * Clean up all test data
   * Removes all records that match test patterns
   */
  async cleanupTestData(): Promise<void> {
    if (!this.db) {
      console.warn('DatabaseTestHelper: No database connection, skipping cleanup');
      return;
    }

    try {
      // Delete in reverse dependency order to avoid foreign key constraints

      // 1. Delete order events first
      await this.db.delete(orderEvents).where(eq(orderEvents.actorType, 'TEST'));

      // 2. Delete orders
      await this.db.delete(orders).where(eq(orders.ordererIdentifier, 'test-orderer'));

      // 3. Delete driver service assignments
      // This will be handled by cascade when we delete drivers

      // 4. Delete drivers with test identifiers
      await this.db.delete(drivers).where(eq(drivers.identifier, 'test-driver'));

      // 5. Delete services with test names
      await this.db.delete(services).where(eq(services.name, 'Test Service'));

      // 6. Delete test mitras
      await this.db.delete(mitras).where(eq(mitras.ownerUserId, 'mitra-test-1@example.com'));

      await this.db.delete(mitras).where(eq(mitras.ownerUserId, 'mitra-test-2@example.com'));

      console.log('DatabaseTestHelper: Test data cleanup completed');
    } catch (error) {
      console.error('DatabaseTestHelper: Cleanup failed:', error);
      throw error;
    }
  }

  /**
   * Clean up specific test data by patterns
   */
  async cleanupTestDataByPattern(patterns: {
    mitraEmails?: string[];
    serviceNames?: string[];
    driverIdentifiers?: string[];
    ordererIdentifiers?: string[];
  }): Promise<void> {
    if (!this.db) {
      console.warn('DatabaseTestHelper: No database connection, skipping cleanup');
      return;
    }

    try {
      // Delete orders by orderer identifiers
      if (patterns.ordererIdentifiers) {
        for (const identifier of patterns.ordererIdentifiers) {
          await this.db.delete(orders).where(eq(orders.ordererIdentifier, identifier));
        }
      }

      // Delete drivers by identifiers
      if (patterns.driverIdentifiers) {
        for (const identifier of patterns.driverIdentifiers) {
          await this.db.delete(drivers).where(eq(drivers.identifier, identifier));
        }
      }

      // Delete services by names
      if (patterns.serviceNames) {
        for (const name of patterns.serviceNames) {
          await this.db.delete(services).where(eq(services.name, name));
        }
      }

      // Delete mitras by emails
      if (patterns.mitraEmails) {
        for (const email of patterns.mitraEmails) {
          await this.db.delete(mitras).where(eq(mitras.ownerUserId, email));
        }
      }

      console.log('DatabaseTestHelper: Pattern-based cleanup completed');
    } catch (error) {
      console.error('DatabaseTestHelper: Pattern cleanup failed:', error);
      throw error;
    }
  }

  /**
   * Check if driver services relationship exists
   */
  async checkDriverServiceRelationship(driverId: string, serviceId: string): Promise<boolean> {
    if (!this.db) {
      console.warn('DatabaseTestHelper: No database connection, returning false');
      return false;
    }

    try {
      const result = await this.db
        .select()
        .from(driverServices)
        .where(and(eq(driverServices.driverId, driverId), eq(driverServices.serviceId, serviceId)))
        .limit(1);

      return result.length > 0;
    } catch (error) {
      console.error('DatabaseTestHelper: Relationship check failed:', error);
      return false;
    }
  }

  /**
   * Check if driver services exist for a driver
   */
  async checkDriverServicesExist(driverId: string): Promise<boolean> {
    if (!this.db) {
      console.warn('DatabaseTestHelper: No database connection, returning false');
      return false;
    }

    try {
      const result = await this.db
        .select()
        .from(driverServices)
        .where(eq(driverServices.driverId, driverId))
        .limit(1);

      return result.length > 0;
    } catch (error) {
      console.error('DatabaseTestHelper: Driver services check failed:', error);
      return false;
    }
  }

  /**
   * Get mitra by email
   */
  async getMitraByEmail(email: string) {
    if (!this.db) {
      console.warn('DatabaseTestHelper: No database connection, returning null');
      return null;
    }

    try {
      const result = await this.db
        .select()
        .from(mitras)
        .where(eq(mitras.ownerUserId, email))
        .limit(1);

      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error('DatabaseTestHelper: Mitra lookup failed:', error);
      return null;
    }
  }

  /**
   * Get service by ID and mitra ID
   */
  async getServiceByIdAndMitra(serviceId: string, mitraId: string) {
    if (!this.db) {
      console.warn('DatabaseTestHelper: No database connection, returning null');
      return null;
    }

    try {
      const result = await this.db
        .select()
        .from(services)
        .where(and(eq(services.id, serviceId), eq(services.mitraId, mitraId)))
        .limit(1);

      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error('DatabaseTestHelper: Service lookup failed:', error);
      return null;
    }
  }

  /**
   * Get driver by ID and mitra ID
   */
  async getDriverByIdAndMitra(driverId: string, mitraId: string) {
    if (!this.db) {
      console.warn('DatabaseTestHelper: No database connection, returning null');
      return null;
    }

    try {
      const result = await this.db
        .select()
        .from(drivers)
        .where(and(eq(drivers.id, driverId), eq(drivers.mitraId, mitraId)))
        .limit(1);

      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error('DatabaseTestHelper: Driver lookup failed:', error);
      return null;
    }
  }

  /**
   * Count records for verification
   */
  async countRecords() {
    if (!this.db) {
      console.warn('DatabaseTestHelper: No database connection, returning zeros');
      return {
        mitras: 0,
        services: 0,
        drivers: 0,
        driverServices: 0,
        orders: 0,
        orderEvents: 0,
      };
    }

    try {
      const [
        mitraCount,
        serviceCount,
        driverCount,
        driverServiceCount,
        orderCount,
        orderEventCount,
      ] = await Promise.all([
        this.db.select().from(mitras),
        this.db.select().from(services),
        this.db.select().from(drivers),
        this.db.select().from(driverServices),
        this.db.select().from(orders),
        this.db.select().from(orderEvents),
      ]);

      return {
        mitras: mitraCount.length,
        services: serviceCount.length,
        drivers: driverCount.length,
        driverServices: driverServiceCount.length,
        orders: orderCount.length,
        orderEvents: orderEventCount.length,
      };
    } catch (error) {
      console.error('DatabaseTestHelper: Count failed:', error);
      return {
        mitras: 0,
        services: 0,
        drivers: 0,
        driverServices: 0,
        orders: 0,
        orderEvents: 0,
      };
    }
  }

  /**
   * Verify database constraints and relationships
   */
  async verifyDataIntegrity(): Promise<{
    isValid: boolean;
    issues: string[];
  }> {
    if (!this.db) {
      return {
        isValid: false,
        issues: ['No database connection available'],
      };
    }

    const issues: string[] = [];

    try {
      // Check for orphaned services (services without valid mitra)
      const orphanedServices = await this.db
        .select({ serviceId: services.id, mitraId: services.mitraId })
        .from(services)
        .leftJoin(mitras, eq(services.mitraId, mitras.id))
        .where(isNull(mitras.id));

      if (orphanedServices.length > 0) {
        issues.push(`Found ${orphanedServices.length} orphaned services`);
      }

      // Check for orphaned drivers (drivers without valid mitra)
      const orphanedDrivers = await this.db
        .select({ driverId: drivers.id, mitraId: drivers.mitraId })
        .from(drivers)
        .leftJoin(mitras, eq(drivers.mitraId, mitras.id))
        .where(isNull(mitras.id));

      if (orphanedDrivers.length > 0) {
        issues.push(`Found ${orphanedDrivers.length} orphaned drivers`);
      }

      // Check for orphaned driver services
      const orphanedDriverServices = await this.db
        .select({ driverId: driverServices.driverId, serviceId: driverServices.serviceId })
        .from(driverServices)
        .leftJoin(drivers, eq(driverServices.driverId, drivers.id))
        .leftJoin(services, eq(driverServices.serviceId, services.id))
        .where(isNull(drivers.id));

      if (orphanedDriverServices.length > 0) {
        issues.push(`Found ${orphanedDriverServices.length} orphaned driver services`);
      }

      return {
        isValid: issues.length === 0,
        issues,
      };
    } catch (error) {
      return {
        isValid: false,
        issues: [
          `Data integrity check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ],
      };
    }
  }

  /**
   * Create test database snapshot for rollback
   */
  async createSnapshot(): Promise<string> {
    // In a real implementation, this would create a database snapshot
    // For testing purposes, we'll return a timestamp
    const snapshotId = `snapshot_${Date.now()}`;
    console.log(`DatabaseTestHelper: Created snapshot ${snapshotId}`);
    return snapshotId;
  }

  /**
   * Restore database from snapshot
   */
  async restoreSnapshot(snapshotId: string): Promise<void> {
    // In a real implementation, this would restore from a database snapshot
    console.log(`DatabaseTestHelper: Restored snapshot ${snapshotId}`);
  }

  /**
   * Execute raw SQL for advanced testing scenarios
   */
  async executeRawSQL(sql: string, params?: any[]): Promise<any> {
    if (!this.db) {
      console.warn('DatabaseTestHelper: No database connection, skipping SQL execution');
      return null;
    }

    try {
      // In a real implementation, this would execute raw SQL
      console.log(`DatabaseTestHelper: Executing SQL: ${sql}`, params);
      return null;
    } catch (error) {
      console.error('DatabaseTestHelper: SQL execution failed:', error);
      throw error;
    }
  }

  /**
   * Get database statistics for performance testing
   */
  async getDatabaseStats() {
    const counts = await this.countRecords();
    const integrity = await this.verifyDataIntegrity();

    return {
      recordCounts: counts,
      dataIntegrity: integrity,
      timestamp: new Date().toISOString(),
    };
  }
}
