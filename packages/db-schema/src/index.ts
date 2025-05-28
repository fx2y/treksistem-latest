import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';

export * from './schema'; // Export all schema definitions and relations

// Factory function to create Drizzle client instance
// The actual D1Database binding will be passed in the worker environment
export const getDrizzleClient = (d1: D1Database) => drizzle(d1, { schema });

// Type for the Drizzle client instance with schema
export type DbClient = ReturnType<typeof getDrizzleClient>; 