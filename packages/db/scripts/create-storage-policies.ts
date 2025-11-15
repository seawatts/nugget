import { sql } from 'drizzle-orm';
import { db } from '../src/client';

/**
 * Create storage bucket and policies for baby avatars
 * This script sets up the baby-avatars bucket with proper RLS policies
 * for the 2025 Clerk <> Supabase integration
 */

const createBabyAvatarsBucket = async () => {
  console.log('Creating baby-avatars storage bucket...');

  try {
    // Create the bucket if it doesn't exist
    await db.execute(sql`
      INSERT INTO storage.buckets (id, name, public)
      VALUES ('baby-avatars', 'baby-avatars', true)
      ON CONFLICT (id) DO UPDATE
      SET public = true;
    `);
    console.log('✓ baby-avatars bucket created/updated successfully');
  } catch (error) {
    console.error('Error creating bucket:', error);
    throw error;
  }
};

const createStoragePolicies = async () => {
  console.log('Creating storage policies for baby-avatars...');

  try {
    // Drop existing policies
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

    // Policy 1: Allow users to upload their own baby avatars
    // Path format: {babyId}/{timestamp}.jpg
    // Users can only upload to folders matching their baby IDs
    await db.execute(sql`
      CREATE POLICY "Users can upload their baby avatars"
      ON storage.objects
      FOR INSERT
      TO authenticated
      WITH CHECK (
        bucket_id = 'baby-avatars'
        AND (storage.foldername(name))[1] IN (
          SELECT id::text FROM babies
          WHERE "userId" = requesting_user_id()
        )
      );
    `);
    console.log('✓ Upload policy created');

    // Policy 2: Allow users to update their own baby avatars
    await db.execute(sql`
      CREATE POLICY "Users can update their baby avatars"
      ON storage.objects
      FOR UPDATE
      TO authenticated
      USING (
        bucket_id = 'baby-avatars'
        AND (storage.foldername(name))[1] IN (
          SELECT id::text FROM babies
          WHERE "userId" = requesting_user_id()
        )
      );
    `);
    console.log('✓ Update policy created');

    // Policy 3: Allow users to delete their own baby avatars
    await db.execute(sql`
      CREATE POLICY "Users can delete their baby avatars"
      ON storage.objects
      FOR DELETE
      TO authenticated
      USING (
        bucket_id = 'baby-avatars'
        AND (storage.foldername(name))[1] IN (
          SELECT id::text FROM babies
          WHERE "userId" = requesting_user_id()
        )
      );
    `);
    console.log('✓ Delete policy created');

    // Policy 4: Allow public read access (since bucket is public)
    await db.execute(sql`
      CREATE POLICY "Anyone can view baby avatars"
      ON storage.objects
      FOR SELECT
      TO public
      USING (bucket_id = 'baby-avatars');
    `);
    console.log('✓ Public read policy created');

    console.log('✓ All storage policies created successfully');
  } catch (error) {
    console.error('Error creating storage policies:', error);
    throw error;
  }
};

async function setupStoragePolicies() {
  try {
    console.log('Starting storage setup...\n');

    await createBabyAvatarsBucket();
    await createStoragePolicies();

    console.log('\n✓ Storage setup completed successfully!');
    console.log('\nStorage bucket structure:');
    console.log('  baby-avatars/');
    console.log('    {babyId}/');
    console.log('      {timestamp}.jpg');

    process.exit(0);
  } catch (error) {
    console.error('\n✗ Storage setup failed:', error);
    process.exit(1);
  }
}

// Run the setup
setupStoragePolicies();
