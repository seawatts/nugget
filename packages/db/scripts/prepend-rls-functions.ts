#!/usr/bin/env bun

/**
 * Prepends RLS helper functions to the FIRST Drizzle migration file (0000-...)
 * Run this script after generating migrations with drizzle-kit
 *
 * This ensures the RLS functions are only added once to the initial migration,
 * not to every new migration.
 */

import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const RLS_FUNCTIONS = `-- Create Supabase RLS functions for requesting_user_id and requesting_family_id
CREATE OR REPLACE FUNCTION requesting_user_id()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT NULLIF(
    current_setting('request.jwt.claims', true)::json->>'sub',
    ''
  )::text;
$$;--> statement-breakpoint

CREATE OR REPLACE FUNCTION requesting_family_id()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT NULLIF(
    current_setting('request.jwt.claims', true)::json->>'org_id',
    ''
  )::text;
$$;--> statement-breakpoint

`;

async function prependRlsFunctions() {
  const drizzleDir = path.join(import.meta.dir, '../drizzle');

  // Get all SQL migration files
  const files = await readdir(drizzleDir);
  const sqlFiles = files
    .filter((file) => file.endsWith('.sql') && file !== 'meta')
    .sort(); // Sort to get files in order (0000, 0001, 0002, etc.)

  // Get the FIRST migration file (0000-...)
  const firstMigration = sqlFiles.find((file) => file.startsWith('0000'));

  if (!firstMigration) {
    console.log('No first migration file (0000-...) found');
    return;
  }

  const migrationPath = path.join(drizzleDir, firstMigration);

  // Read the migration file
  const content = await readFile(migrationPath, 'utf-8');

  // Check if functions already exist
  if (content.includes('CREATE OR REPLACE FUNCTION requesting_user_id()')) {
    console.log(`✓ RLS functions already exist in ${firstMigration}`);
    return;
  }

  // Prepend the functions
  const newContent = RLS_FUNCTIONS + content;

  // Write back to file
  await writeFile(migrationPath, newContent, 'utf-8');

  console.log(`✓ Added RLS functions to ${firstMigration}`);
}

prependRlsFunctions().catch(console.error);
