#!/usr/bin/env bun
import postgres from 'postgres';

async function applyFix() {
  const databaseUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  const env = process.env.INFISICAL_ENVIRONMENT || 'dev';

  if (!databaseUrl) {
    console.error(
      'Error: POSTGRES_URL or DATABASE_URL environment variable is required',
    );
    process.exit(1);
  }

  const sql = postgres(databaseUrl);

  try {
    console.log(`\n🔄 Applying amountMl type fix to ${env} database...`);

    // Check current type
    const before = await sql`
      SELECT data_type
      FROM information_schema.columns
      WHERE table_name = 'activities'
      AND column_name = 'amountMl'
      AND table_schema = 'public';
    `;

    console.log(`   Current type: ${before[0]?.data_type}`);

    // Apply the fix
    await sql`ALTER TABLE "activities" ALTER COLUMN "amountMl" SET DATA TYPE real;`;

    // Verify the change
    const after = await sql`
      SELECT data_type
      FROM information_schema.columns
      WHERE table_name = 'activities'
      AND column_name = 'amountMl'
      AND table_schema = 'public';
    `;

    console.log(`   New type: ${after[0]?.data_type}`);
    console.log(
      `\n✅ Successfully updated amountMl column type to real in ${env} database`,
    );
  } catch (error) {
    console.error(`\n❌ Error applying fix to ${env} database:`, error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

applyFix();
