#!/usr/bin/env bun
/**
 * TEMPORARY: Disable RLS on storage for local development
 * This allows file uploads without Clerk JWT validation
 *
 * ⚠️  DO NOT RUN THIS IN PRODUCTION!
 */

import { sql } from 'drizzle-orm';
import { db } from '../src/client';

async function disableStorageRLS() {
  console.log('⚠️  Disabling Storage RLS for local development...\n');

  try {
    // Drop restrictive policies
    await db.execute(sql`
      DROP POLICY IF EXISTS "Users can upload their baby avatars" ON storage.objects;
    `);
    await db.execute(sql`
      DROP POLICY IF EXISTS "Users can update their baby avatars" ON storage.objects;
    `);
    await db.execute(sql`
      DROP POLICY IF EXISTS "Users can delete their baby avatars" ON storage.objects;
    `);
    await db.execute(sql`
      DROP POLICY IF EXISTS "Anyone can view baby avatars" ON storage.objects;
    `);

    // Create permissive policies for local dev
    await db.execute(sql`
      CREATE POLICY "Local dev: Allow all uploads"
      ON storage.objects
      FOR INSERT
      TO public
      WITH CHECK (bucket_id = 'baby-avatars');
    `);

    await db.execute(sql`
      CREATE POLICY "Local dev: Allow all updates"
      ON storage.objects
      FOR UPDATE
      TO public
      USING (bucket_id = 'baby-avatars');
    `);

    await db.execute(sql`
      CREATE POLICY "Local dev: Allow all deletes"
      ON storage.objects
      FOR DELETE
      TO public
      USING (bucket_id = 'baby-avatars');
    `);

    await db.execute(sql`
      CREATE POLICY "Local dev: Allow all reads"
      ON storage.objects
      FOR SELECT
      TO public
      USING (bucket_id = 'baby-avatars');
    `);

    console.log('✅ Storage RLS disabled for local development');
    console.log('\n📝 Notes:');
    console.log(
      '   - All users can upload/update/delete files in baby-avatars bucket',
    );
    console.log('   - This is ONLY for local development');
    console.log('   - DO NOT use these policies in production');
    console.log('\n💡 To re-enable proper RLS policies:');
    console.log('   bun run scripts/create-storage-policies.ts');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error disabling storage RLS:', error);
    process.exit(1);
  }
}

disableStorageRLS();
