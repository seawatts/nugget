#!/usr/bin/env bun
/**
 * Test script to verify Clerk + Supabase authentication integration
 * This script tests the full flow of authenticating with Clerk and uploading to Supabase Storage
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '../src/supabase/types';

const CLERK_DOMAIN = 'clerk.nugget.baby';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '';

console.log('🧪 Testing Clerk + Supabase Integration\n');
console.log('Configuration:');
console.log(`  Clerk Domain: ${CLERK_DOMAIN}`);
console.log(`  Supabase URL: ${SUPABASE_URL}`);
console.log(`  Anon Key: ${SUPABASE_ANON_KEY.substring(0, 20)}...`);
console.log('');

// Test 1: Verify JWKS endpoint is accessible
async function testJWKSEndpoint() {
  console.log('📡 Test 1: Checking Clerk JWKS endpoint...');
  try {
    const jwksUrl = `https://${CLERK_DOMAIN}/.well-known/jwks.json`;
    console.log(`  Fetching: ${jwksUrl}`);

    const response = await fetch(jwksUrl);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const jwks = await response.json();
    console.log('  ✅ JWKS endpoint accessible');
    console.log(`  📝 Found ${jwks.keys?.length || 0} keys`);

    if (jwks.keys && jwks.keys.length > 0) {
      console.log(`  🔑 First key: ${jwks.keys[0].kid} (${jwks.keys[0].alg})`);
    }

    return { jwks, success: true };
  } catch (error) {
    console.error('  ❌ Failed to fetch JWKS:', error);
    return { error, success: false };
  }
}

// Test 2: Check if Supabase can validate JWT
async function testSupabaseJWTValidation(clerkToken: string | null) {
  console.log('\n🔐 Test 2: Testing Supabase JWT validation...');

  if (!clerkToken) {
    console.log('  ⏭️  Skipping (no Clerk token provided)');
    console.log('  💡 To test this, pass a Clerk token as an argument:');
    console.log(
      '     bun run scripts/test-clerk-supabase-auth.ts <clerk-token>',
    );
    return { skipped: true, success: false };
  }

  try {
    // Try to create a client with the Clerk token
    const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
      global: {
        headers: {
          Authorization: `Bearer ${clerkToken}`,
        },
      },
    });

    // Try to query a table that requires authentication
    const { data, error } = await supabase.from('users').select('id').limit(1);

    if (error) {
      console.error('  ❌ Query failed:', error.message);
      return { error, success: false };
    }

    console.log('  ✅ Successfully authenticated with Clerk token');
    console.log(`  📝 Query returned ${data?.length || 0} rows`);
    return { data, success: true };
  } catch (error) {
    console.error('  ❌ Exception during JWT validation:', error);
    return { error, success: false };
  }
}

// Test 3: Check requesting_user_id() function
async function testRequestingUserIdFunction() {
  console.log('\n🔧 Test 3: Testing requesting_user_id() function...');

  try {
    const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Try to call the function
    const { data, error } = await supabase.rpc('requesting_user_id');

    if (error) {
      // This is expected if not authenticated, but the function should exist
      if (
        error.message.includes('function') &&
        error.message.includes('does not exist')
      ) {
        console.error('  ❌ Function does not exist in database');
        console.log('  💡 Run: bun migrate');
        return { error, success: false };
      }

      console.log('  ✅ Function exists (error is expected without auth)');
      return { success: true };
    }

    console.log('  ✅ Function exists and returned:', data);
    return { data, success: true };
  } catch (error) {
    console.error('  ❌ Exception:', error);
    return { error, success: false };
  }
}

// Test 4: Check storage bucket configuration
async function testStorageBucket() {
  console.log('\n🪣 Test 4: Checking storage bucket configuration...');

  try {
    const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);

    const { data, error } = await supabase.storage.listBuckets();

    if (error) {
      console.error('  ❌ Cannot list buckets:', error.message);
      console.log(
        '  💡 Run: infisical run --env=dev -- bun run scripts/create-storage-policies.ts',
      );
      return { error, success: false };
    }

    const babyAvatarsBucket = data.find(
      (b) => b.name === 'baby-avatars' || b.id === 'baby-avatars',
    );

    if (!babyAvatarsBucket) {
      console.error('  ❌ baby-avatars bucket not found');
      console.log(
        '  💡 Run: infisical run --env=dev -- bun run scripts/create-storage-policies.ts',
      );
      return { error: new Error('Bucket not found'), success: false };
    }

    console.log('  ✅ Bucket exists and is accessible');
    console.log(`  📝 Public: ${babyAvatarsBucket.public}`);
    console.log(
      `  📝 File size limit: ${babyAvatarsBucket.file_size_limit || 'N/A'}`,
    );
    return { data: babyAvatarsBucket, success: true };
  } catch (error) {
    console.error('  ❌ Exception:', error);
    return { error, success: false };
  }
}

// Test 5: Check Supabase config.toml
async function testSupabaseConfig() {
  console.log('\n⚙️  Test 5: Checking Supabase config.toml...');

  try {
    const { readFileSync } = await import('node:fs');
    const { join } = await import('node:path');

    const configPath = join(process.cwd(), 'supabase', 'config.toml');
    const config = readFileSync(configPath, 'utf-8');

    // Check for Clerk third-party auth configuration
    const hasClerkAuth = config.includes('[auth.third_party.clerk]');
    const hasClerkDomain = config.includes(`domain = "${CLERK_DOMAIN}"`);
    const isEnabled = config.includes('enabled = true');

    if (!hasClerkAuth) {
      console.error('  ❌ Clerk third-party auth not configured');
      console.log('  💡 Add to config.toml:');
      console.log('     [auth.third_party.clerk]');
      console.log('     enabled = true');
      console.log(`     domain = "${CLERK_DOMAIN}"`);
      return { success: false };
    }

    if (!hasClerkDomain) {
      console.error('  ❌ Clerk domain not set correctly');
      console.log('  💡 Update config.toml:');
      console.log(`     domain = "${CLERK_DOMAIN}"`);
      return { success: false };
    }

    if (!isEnabled) {
      console.error('  ❌ Clerk auth not enabled');
      console.log('  💡 Update config.toml:');
      console.log('     enabled = true');
      return { success: false };
    }

    console.log('  ✅ Clerk third-party auth configured correctly');
    console.log(`  📝 Domain: ${CLERK_DOMAIN}`);
    console.log('  📝 Enabled: true');

    return { success: true };
  } catch (error) {
    console.error('  ❌ Error reading config.toml:', error);
    return { error, success: false };
  }
}

// Test 6: Attempt a test upload (if token provided)
async function testStorageUpload(clerkToken: string | null) {
  console.log('\n📤 Test 6: Testing storage upload...');

  if (!clerkToken) {
    console.log('  ⏭️  Skipping (no Clerk token provided)');
    return { skipped: true, success: false };
  }

  try {
    const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
      global: {
        headers: {
          Authorization: `Bearer ${clerkToken}`,
        },
      },
    });

    // Create a test file
    const testData = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]); // PNG header
    const blob = new Blob([testData], { type: 'image/png' });

    // Try to upload to a test path
    const testPath = `test-${Date.now()}.png`;
    console.log(`  📝 Uploading test file: ${testPath}`);

    const { data, error } = await supabase.storage
      .from('baby-avatars')
      .upload(testPath, blob);

    if (error) {
      console.error('  ❌ Upload failed:', error.message);

      if (error.message.includes('row-level security')) {
        console.log(
          '  💡 RLS policy issue - you need a valid baby ID in the path',
        );
        console.log(`  💡 Example: {babyId}/${Date.now()}.png`);
      }

      return { error, success: false };
    }

    console.log('  ✅ Upload successful!');
    console.log(`  📝 Path: ${data.path}`);

    // Clean up
    await supabase.storage.from('baby-avatars').remove([data.path]);
    console.log('  🧹 Test file cleaned up');

    return { data, success: true };
  } catch (error) {
    console.error('  ❌ Exception during upload:', error);
    return { error, success: false };
  }
}

// Main test runner
async function runTests() {
  const clerkToken = process.argv[2] || null;

  if (clerkToken) {
    console.log(
      `🎫 Using provided Clerk token: ${clerkToken.substring(0, 20)}...`,
    );
  } else {
    console.log('ℹ️  No Clerk token provided - some tests will be skipped');
    console.log('   To run all tests, get a token from your app:');
    console.log('   1. Log in to your app');
    console.log('   2. Open browser console');
    console.log('   3. Run: await window.Clerk.session.getToken()');
    console.log('   4. Copy the token and pass it to this script\n');
  }

  const results = {
    bucket: await testStorageBucket(),
    config: await testSupabaseConfig(),
    function: await testRequestingUserIdFunction(),
    jwks: await testJWKSEndpoint(),
    jwt: await testSupabaseJWTValidation(clerkToken),
    upload: await testStorageUpload(clerkToken),
  };

  // Summary
  console.log(`\n${'='.repeat(60)}`);
  console.log('📊 Test Summary');
  console.log('='.repeat(60));

  const tests = [
    { name: 'JWKS Endpoint', result: results.jwks },
    { name: 'Supabase Config', result: results.config },
    { name: 'requesting_user_id()', result: results.function },
    { name: 'Storage Bucket', result: results.bucket },
    { name: 'JWT Validation', result: results.jwt },
    { name: 'Storage Upload', result: results.upload },
  ];

  for (const test of tests) {
    const status = test.result.skipped
      ? '⏭️  SKIPPED'
      : test.result.success
        ? '✅ PASSED'
        : '❌ FAILED';
    console.log(`${status}  ${test.name}`);
  }

  const passed = tests.filter((t) => t.result.success).length;
  const failed = tests.filter(
    (t) => !t.result.success && !t.result.skipped,
  ).length;
  const skipped = tests.filter((t) => t.result.skipped).length;

  console.log('='.repeat(60));
  console.log(
    `Total: ${tests.length} tests | ✅ ${passed} passed | ❌ ${failed} failed | ⏭️  ${skipped} skipped`,
  );
  console.log('='.repeat(60));

  if (failed > 0) {
    console.log('\n🔧 Recommended Actions:');

    if (!results.config.success) {
      console.log('  1. Update supabase/config.toml with Clerk configuration');
      console.log('  2. Restart Supabase: bunx supabase db reset');
    }

    if (!results.function.success) {
      console.log('  3. Run migrations: bun migrate');
    }

    if (!results.bucket.success) {
      console.log(
        '  4. Create storage policies: infisical run --env=dev -- bun run scripts/create-storage-policies.ts',
      );
    }

    if (!results.jwt.success && !results.jwt.skipped) {
      console.log(
        '  5. Restart Supabase to pick up config changes: bunx supabase stop && bunx supabase start',
      );
      console.log('  6. Verify Infisical secrets are correct');
    }
  } else if (skipped > 0) {
    console.log('\n💡 To run all tests, provide a Clerk token:');
    console.log('   bun run scripts/test-clerk-supabase-auth.ts <clerk-token>');
  } else {
    console.log(
      '\n🎉 All tests passed! Your Clerk + Supabase integration is working correctly.',
    );
  }

  process.exit(failed > 0 ? 1 : 0);
}

// Run the tests
runTests().catch((error) => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});
