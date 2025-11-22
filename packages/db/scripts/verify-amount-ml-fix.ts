#!/usr/bin/env bun
import postgres from 'postgres';

async function verifyFix() {
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
    const result = await sql`
      SELECT data_type
      FROM information_schema.columns
      WHERE table_name = 'activities'
      AND column_name = 'amountMl'
      AND table_schema = 'public';
    `;

    console.log(`\n${env.toUpperCase()} Database - amountMl column:`);
    console.log('================================');
    console.log(`Type: ${result[0]?.data_type}`);

    if (
      result[0]?.data_type === 'real' ||
      result[0]?.data_type === 'double precision'
    ) {
      console.log('✅ Column type is correct (real/double precision)');
    } else {
      console.log(
        `❌ Column type is incorrect (expected real, got ${result[0]?.data_type})`,
      );
    }
  } catch (error) {
    console.error('Error verifying fix:', error);
  } finally {
    await sql.end();
  }
}

verifyFix();
