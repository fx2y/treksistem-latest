import type { Config } from 'drizzle-kit';
import 'dotenv/config';

export default {
  schema: './src/schema.ts',
  out: './migrations',
  dialect: 'sqlite',
  driver: 'd1',
  dbCredentials: {
    wranglerConfigPath: '../../wrangler.jsonc',
    dbName: 'TREKSISTEM_DB',
  },
  verbose: true,
  strict: true,
} satisfies Config; 