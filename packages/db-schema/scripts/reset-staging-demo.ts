#!/usr/bin/env tsx

import { generateCleanupSQL, generateDemoDataSQL } from './seed-staging-demo';
import { writeFileSync } from 'fs';
import { join } from 'path';

/**
 * Reset Demo Data Script
 * Generates SQL to clean up and re-seed demo data for staging environment
 */
function main(): void {
  console.log('🔄 Treksistem Demo Data Reset Script\n');

  // Generate cleanup SQL
  console.log('🧹 Generating cleanup SQL...');
  const cleanupSQL = generateCleanupSQL();

  // Generate fresh demo data SQL
  console.log('📝 Generating fresh demo data SQL...');
  const demoDataSQL = generateDemoDataSQL();

  // Combine into full reset script
  const resetSQL = `-- Treksistem Demo Data Reset Script
-- Generated: ${new Date().toISOString()}
-- Environment: Staging

${cleanupSQL}

-- Insert fresh demo data
${demoDataSQL}`;

  // Write to file
  const outputPath = join(__dirname, '..', '..', '..', 'seed-demo-reset.sql');
  writeFileSync(outputPath, resetSQL, 'utf8');

  console.log(`📄 Reset SQL written to: ${outputPath}`);
  console.log('\n🚀 To apply the reset to staging:');
  console.log(
    'wrangler d1 execute TREKSISTEM_DB --env staging --remote --file=seed-demo-reset.sql',
  );

  console.log('\n⏰ For automated resets, consider setting up a cron job or GitHub Action');
  console.log('that runs this script and applies the generated SQL periodically.');

  console.log('\n✨ Demo reset script completed successfully!');
}

// Execute if run directly
if (require.main === module) {
  main();
}
