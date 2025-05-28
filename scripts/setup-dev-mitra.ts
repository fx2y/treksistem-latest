#!/usr/bin/env tsx

/**
 * Development Script: Setup Test Mitra Records
 * 
 * This script creates test Mitra records in the local D1 database
 * for testing Cloudflare Access authentication and authorization.
 * 
 * Usage:
 *   pnpm tsx scripts/setup-dev-mitra.ts
 */

interface MitraRecord {
  id: string;
  owner_user_id: string;
  name: string;
  created_at: number;
  updated_at: number;
}

// Simple ID generator for development (replace with actual CUIDs in production)
function generateDevId(): string {
  return 'dev_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

const testMitras: Omit<MitraRecord, 'id' | 'created_at' | 'updated_at'>[] = [
  {
    owner_user_id: 'dev-admin@example.com',
    name: 'Development Test Mitra',
  },
  {
    owner_user_id: 'admin@treksistem.com',
    name: 'Treksistem Admin Mitra',
  },
  {
    owner_user_id: 'test@example.com',
    name: 'Test Mitra Account',
  },
];

async function setupDevMitras() {
  console.log('🚀 Setting up development Mitra records...\n');

  const timestamp = Date.now();
  
  const mitrasToInsert: MitraRecord[] = testMitras.map(mitra => ({
    ...mitra,
    id: generateDevId(),
    created_at: timestamp,
    updated_at: timestamp,
  }));

  console.log('📋 Mitra records to create:');
  mitrasToInsert.forEach((mitra, index) => {
    console.log(`${index + 1}. ${mitra.name}`);
    console.log(`   ID: ${mitra.id}`);
    console.log(`   Owner: ${mitra.owner_user_id}`);
    console.log('');
  });

  console.log('💡 To insert these records into your local D1 database, run:');
  console.log('');
  
  mitrasToInsert.forEach(mitra => {
    const sql = `INSERT INTO mitras (id, owner_user_id, name, created_at, updated_at) VALUES ('${mitra.id}', '${mitra.owner_user_id}', '${mitra.name}', ${mitra.created_at}, ${mitra.updated_at});`;
    console.log(sql);
  });

  console.log('');
  console.log('🔧 Or use wrangler d1 execute:');
  console.log('');
  
  mitrasToInsert.forEach(mitra => {
    const sql = `INSERT INTO mitras (id, owner_user_id, name, created_at, updated_at) VALUES ('${mitra.id}', '${mitra.owner_user_id}', '${mitra.name}', ${mitra.created_at}, ${mitra.updated_at});`;
    console.log(`wrangler d1 execute TREKSISTEM_DB --local --command "${sql}"`);
  });

  console.log('');
  console.log('✅ Development setup complete!');
  console.log('');
  console.log('🧪 Test authentication with:');
  console.log('curl -H "X-Mock-User-Email: dev-admin@example.com" http://localhost:8787/api/mitra/auth/test');
  console.log('');
}

if (require.main === module) {
  setupDevMitras().catch(console.error);
}

export { setupDevMitras, testMitras }; 