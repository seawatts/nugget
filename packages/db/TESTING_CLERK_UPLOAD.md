# Testing Clerk + Supabase File Upload Integration

## Summary

This guide helps you test the complete integration between Clerk authentication and Supabase Storage for uploading baby profile pictures.

## What We've Fixed

### 1. Environment Variables ✅
- Updated Infisical with correct Supabase credentials
- All keys now match your local Supabase instance

### 2. Storage RLS Policies ✅
- Fixed policies to use `requesting_user_id()` helper function
- Policies now properly validate Clerk JWT tokens

### 3. Supabase Configuration ✅
- Configured `config.toml` with Clerk third-party auth
- Supabase can fetch Clerk's public keys from JWKS endpoint

### 4. Supabase Client ✅
- Updated to use `accessToken()` for proper JWT handling
- Disabled local JWT validation (server-side only)

## Quick Test

### Automated Test (No Token Required)

Run this to verify the infrastructure is set up correctly:

```bash
cd packages/db
infisical run --env=dev -- bun run test:clerk-supabase
```

**Expected Results:**
- ✅ JWKS Endpoint accessible
- ✅ Supabase config correct
- ✅ `requesting_user_id()` function exists
- ⏭️  Bucket check (requires service role, not critical)
- ⏭️  JWT validation (requires Clerk token)
- ⏭️  Storage upload (requires Clerk token)

### Full Test (With Clerk Token)

To test the complete flow including JWT validation and file upload:

1. **Get a Clerk Token:**
   - Start your Next.js dev server:
     ```bash
     cd ../../apps/web-app
     infisical run --env=dev -- bun dev
     ```
   - Open your app in browser
   - Log in with your account
   - Open browser console (F12)
   - Run:
     ```javascript
     await window.Clerk.session.getToken()
     ```
   - Copy the token

2. **Run Full Test:**
   ```bash
   cd packages/db
   infisical run --env=dev -- bun run test:clerk-supabase "<paste-token-here>"
   ```

**Expected Results:**
- All tests should pass ✅
- You should see successful JWT validation
- Test file upload should work

## Manual Test in Your App

1. **Restart Your Dev Server** (to pick up new environment variables):
   ```bash
   # Stop your current dev server (Ctrl+C)
   cd apps/web-app
   infisical run --env=dev -- bun dev
   ```

2. **Test Upload:**
   - Navigate to your baby's profile page
   - Click to upload a profile picture
   - Select an image file
   - Upload should complete successfully!

## Troubleshooting

### Still Getting "RS256 algorithm" Error?

**Check:**
1. Did you restart your dev server after running the fix script?
2. Are you using the updated Supabase client code?
3. Is Supabase running? (`bunx supabase status`)

**Solution:**
```bash
cd packages/db
bash scripts/fix-clerk-supabase.sh
```

Then restart your Next.js dev server.

### "Row-level security policy" Error?

This means the user doesn't have permission to upload to that path.

**Check:**
1. Does the user have a baby record in the database?
2. Is the upload path format correct: `{babyId}/{timestamp}.jpg`?
3. Does the baby belong to the authenticated user?

**Solution:**
```bash
cd packages/db
infisical run --env=dev -- bun run scripts/create-storage-policies.ts
```

### "Bucket not found" Error?

**Solution:**
```bash
cd packages/db
infisical run --env=dev -- bun run scripts/create-storage-policies.ts
```

## Scripts Reference

### `fix-clerk-supabase.sh`
Complete fix that:
1. Restarts Supabase with updated config
2. Updates Infisical secrets
3. Runs all migrations
4. Creates storage bucket and policies

```bash
bash scripts/fix-clerk-supabase.sh
```

### `test-clerk-supabase-auth.ts`
Comprehensive test suite that validates:
- Clerk JWKS endpoint
- Supabase configuration
- Helper functions
- Storage bucket
- JWT validation (with token)
- File upload (with token)

```bash
# Without token (infrastructure only)
bun run test:clerk-supabase

# With token (full test)
bun run test:clerk-supabase "<clerk-token>"
```

### `create-storage-policies.ts`
Creates/updates storage bucket and RLS policies.

```bash
infisical run --env=dev -- bun run scripts/create-storage-policies.ts
```

## Architecture Overview

### Authentication Flow

```
┌─────────────┐
│   Browser   │
│  (Clerk UI) │
└──────┬──────┘
       │ 1. User logs in
       ▼
┌─────────────────┐
│  Clerk Service  │  Generates RS256 JWT
└────────┬────────┘  with claims: {sub, org_id, ...}
         │
         │ 2. Get token
         ▼
┌──────────────────┐
│  Next.js Client  │  session.getToken()
│   (React Hook)   │
└────────┬─────────┘
         │
         │ 3. Upload with token
         ▼
┌────────────────────────┐
│  Supabase Storage API  │
└────────┬───────────────┘
         │
         │ 4. Validate JWT
         ▼
┌───────────────────────────┐
│  Supabase (Kong)          │
│  - Fetches JWKS from      │
│    clerk.nugget.baby      │
│  - Validates RS256 sig    │
│  - Extracts claims        │
└────────┬──────────────────┘
         │
         │ 5. Check RLS policies
         ▼
┌─────────────────────────┐
│  PostgreSQL + RLS       │
│  - calling requesting_  │
│    user_id() gets 'sub' │
│  - Query babies table   │
│  - Check ownership      │
└────────┬────────────────┘
         │
         │ 6. Allow/deny
         ▼
    Upload Success!
```

### Key Components

1. **Clerk JWKS Endpoint**
   `https://clerk.nugget.baby/.well-known/jwks.json`
   Provides public keys for RS256 signature verification

2. **Supabase Third-Party Auth**
   Configured in `config.toml`:
   ```toml
   [auth.third_party.clerk]
   enabled = true
   domain = "clerk.nugget.baby"
   ```

3. **Helper Functions**
   `requesting_user_id()` and `requesting_family_id()`
   Extract claims from validated JWT:
   ```sql
   SELECT NULLIF(
     current_setting('request.jwt.claims', true)::json->>'sub',
     ''
   )::text;
   ```

4. **Storage RLS Policies**
   Allow uploads only to user's own baby folders:
   ```sql
   WITH CHECK (
     bucket_id = 'baby-avatars'
     AND (storage.foldername(name))[1] IN (
       SELECT id::text FROM babies
       WHERE "userId" = requesting_user_id()
     )
   )
   ```

## Common Issues & Solutions

### Issue: "Key for the RS256 algorithm must be one of type CryptoKey..."

**Cause:** Supabase is trying to validate Clerk's RS256 JWT using the wrong key type.

**Solution:**
1. Restart Supabase to pick up Clerk config
2. Update Infisical secrets
3. Restart Next.js dev server

**Command:**
```bash
cd packages/db && bash scripts/fix-clerk-supabase.sh
```

### Issue: "new row violates row-level security policy"

**Cause:** RLS policies are using outdated JWT claim extraction.

**Solution:**
```bash
cd packages/db
infisical run --env=dev -- bun run scripts/create-storage-policies.ts
```

### Issue: Upload works locally but fails in production

**Possible Causes:**
1. Production Supabase project not configured with Clerk third-party auth
2. Different Clerk domain in production
3. Environment variables not set correctly

**Solution:**
1. Configure Clerk integration in Supabase Dashboard (production project)
2. Verify `CLERK_DOMAIN` matches production domain
3. Run migrations in production

## Next Steps

1. ✅ Run the test script to verify everything works
2. ✅ Test upload in your app
3. ✅ Restart your dev server if you haven't already
4. 📝 Document any production-specific configuration
5. 🚀 Deploy with confidence!

## Additional Resources

- [Clerk + Supabase Integration](https://clerk.com/docs/integrations/databases/supabase)
- [Supabase Storage RLS](https://supabase.com/docs/guides/storage/security/access-control)
- [Supabase Third-Party Auth](https://supabase.com/docs/guides/auth/third-party/clerk)

