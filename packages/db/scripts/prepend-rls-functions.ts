#!/usr/bin/env bun

/**
 * Prepends RLS helper functions to the latest Drizzle migration file
 * Run this script after generating migrations with drizzle-kit
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
    .sort()
    .reverse(); // Get latest first

  const latestMigration = sqlFiles[0];
  if (!latestMigration) {
    console.log('No migration files found');
    return;
  }

  const migrationPath = path.join(drizzleDir, latestMigration);

  // Read the migration file
  const content = await readFile(migrationPath, 'utf-8');

  // Check if functions already exist
  if (content.includes('CREATE OR REPLACE FUNCTION requesting_user_id()')) {
    console.log(`✓ RLS functions already exist in ${latestMigration}`);
    return;
  }

  // Prepend the functions
  const newContent = RLS_FUNCTIONS + content;

  // Write back to file
  await writeFile(migrationPath, newContent, 'utf-8');

  console.log(`✓ Added RLS functions to ${latestMigration}`);
}

prependRlsFunctions().catch(console.error);
