import type { DbClient } from '@treksistem/db-schema';

// Define the environment bindings expected by the worker
export interface Env {
  TREKSISTEM_DB: D1Database;
  TREKSISTEM_R2: R2Bucket;
  WORKER_ENV?: string; // Environment variable for distinguishing dev/staging/prod
}

// Extend Hono's Context to include our typed drizzle instance and user identity
export type AppContext = {
  Variables: {
    db: DbClient;
    currentUserEmail?: string; // Populated by CF Access auth middleware
    currentMitraId?: string; // Populated after fetching Mitra profile
  };
  Bindings: Env;
}; 