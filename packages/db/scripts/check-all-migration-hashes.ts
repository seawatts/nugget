#!/usr/bin/env bun
import postgres from 'postgres';

async function checkMigrationHashes() {
  const databaseUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error(
      'Error: POSTGRES_URL or DATABASE_URL environment variable is required',
    );
    process.exit(1);
  }

  const sql = postgres(databaseUrl);

  try {
    const migrations = await sql`
      SELECT hash, created_at
      FROM drizzle.__drizzle_migrations
      ORDER BY created_at DESC;
    `;

    console.log('All applied migration hashes:');
    console.log('=============================');
    for (const migration of migrations) {
      const date = new Date(Number(migration.created_at));
      console.log(`${migration.hash} - ${date.toISOString()}`);
    }
  } catch (error) {
    console.error('Error checking migration hashes:', error);
  } finally {
    await sql.end();
  }
}

checkMigrationHashes();
