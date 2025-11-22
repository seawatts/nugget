#!/usr/bin/env bun
import postgres from 'postgres';

interface Migration {
  hash?: string;
  created_at?: Date;
}

async function checkMigrationStatus() {
  const databaseUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error(
      'Error: POSTGRES_URL or DATABASE_URL environment variable is required',
    );
    process.exit(1);
  }

  const sql = postgres(databaseUrl);

  try {
    // Check if the drizzle migrations table exists
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'drizzle'
        AND table_name = '__drizzle_migrations'
      );
    `;

    if (!tableExists[0]?.exists) {
      console.log('No drizzle migration tracking table found');
      await sql.end();
      return;
    }

    // Get all applied migrations
    const migrations = await sql`
      SELECT * FROM drizzle.__drizzle_migrations
      ORDER BY created_at DESC
      LIMIT 10;
    `;

    console.log('Last 10 applied migrations:');
    console.log('============================');
    for (const migration of migrations) {
      console.log(`${migration.hash} - ${migration.created_at}`);
    }

    // Check specifically for 0031
    const migration0031 = migrations.find((m: Migration) =>
      m.hash?.includes('0031'),
    );

    console.log('\nMigration 0031 status:');
    console.log('======================');
    if (migration0031) {
      console.log('✅ Migration 0031 has been applied');
      console.log(migration0031);
    } else {
      console.log('❌ Migration 0031 has NOT been applied');
    }
  } catch (error) {
    console.error('Error checking migration status:', error);
  } finally {
    await sql.end();
  }
}

checkMigrationStatus();
