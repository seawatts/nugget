# Supabase Storage Setup

## Overview

This document describes the storage bucket and RLS policies for the baby profile picture feature using the 2025 Clerk ↔ Supabase integration.

## Storage Bucket: `baby-avatars`

### Configuration
- **Bucket Name**: `baby-avatars`
- **Public Access**: Yes (read-only)
- **File Size Limit**: 5MB
- **Allowed Types**: PNG, JPEG, JPG, WebP
- **Path Structure**: `{babyId}/{timestamp}.jpg`

### Configuration Files

#### 1. Supabase Config (`packages/db/supabase/config.toml`)
```toml
[storage.buckets.baby-avatars]
public = true
file_size_limit = "5MiB"
allowed_mime_types = ["image/png", "image/jpeg", "image/jpg", "image/webp"]
objects_path = "./storage/baby-avatars"
```

#### 2. Storage Policies Script (`packages/db/scripts/create-storage-policies.ts`)
Automatically creates the bucket and sets up RLS policies.

## Row Level Security Policies

### 1. Upload Policy
**Name**: "Users can upload their baby avatars"
- **Operation**: INSERT
- **Who**: Authenticated users
- **Rule**: Users can only upload to folders matching their own baby IDs

```sql
WITH CHECK (
  bucket_id = 'baby-avatars'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM babies
    WHERE "userId" = requesting_user_id()
  )
)
```

### 2. Update Policy
**Name**: "Users can update their baby avatars"
- **Operation**: UPDATE
- **Who**: Authenticated users
- **Rule**: Users can only update files in folders matching their baby IDs

### 3. Delete Policy
**Name**: "Users can delete their baby avatars"
- **Operation**: DELETE
- **Who**: Authenticated users
- **Rule**: Users can only delete files in folders matching their baby IDs

### 4. Read Policy
**Name**: "Anyone can view baby avatars"
- **Operation**: SELECT
- **Who**: Public (anyone)
- **Rule**: All files in the baby-avatars bucket are publicly readable

## Authentication Flow (2025 Integration)

### How It Works

1. **User authenticates with Clerk**
   - Clerk generates a session token
   - Token includes JWT claims: `sub` (user ID), `org_id` (family ID), etc.

2. **Frontend uploads file**
   ```typescript
   const authToken = await session?.getToken(); // No template needed!
   const supabase = useClient(); // Uses Clerk token automatically

   await supabase.storage
     .from('baby-avatars')
     .upload(`${babyId}/${timestamp}.jpg`, blob);
   ```

3. **Supabase validates request**
   - Validates Clerk JWT using third-party auth integration
   - Extracts `sub` claim (user ID) from JWT
   - Checks RLS policies against user's baby records
   - Allows/denies based on policy rules

### Why This Works Without JWT Templates

- **No shared secret**: Clerk and Supabase don't share signing keys
- **Third-party validation**: Supabase validates Clerk's JWTs directly via JWKS (from `https://clerk.nugget.baby/.well-known/jwks.json`)
- **Native integration**: Configured in both dashboards, no code changes needed
- **Standard claims**: Uses Clerk's native JWT claims (`sub`, `org_id`, etc.)
- **Helper functions**: The `requesting_user_id()` and `requesting_family_id()` functions extract claims from the validated JWT

## Setup Instructions

### 1. Run Database Scripts
```bash
cd packages/db

# Create/update storage bucket and policies
bun create-storage-policies

# Or run full migration (includes storage setup)
bun migrate
```

### 2. Configure Clerk Dashboard
1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Select your application
3. Navigate to **Integrations** → **Databases** → **Supabase**
4. Click **"Activate Supabase integration"**
5. Copy your Clerk domain (e.g., `your-app.clerk.accounts.dev`)

### 3. Configure Supabase Dashboard
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Auth** → **Sign in / up**
4. Click **"Add provider"** → Select **"Clerk"**
5. Paste your Clerk domain
6. Save

### 4. Verify Environment Variables
Ensure these are set in your environment (Infisical):
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

## File Path Structure

```
baby-avatars/
├── {babyId1}/
│   ├── 1234567890.jpg
│   └── 1234567891.jpg
└── {babyId2}/
    └── 1234567892.jpg
```

Each baby's photos are stored in their own folder (identified by baby ID), with timestamps as filenames to prevent conflicts.

## Security Notes

### What's Protected
- ✅ Users can only upload/update/delete photos for their own babies
- ✅ Baby ownership is validated against the `babies` table
- ✅ User ID comes from verified Clerk JWT claims
- ✅ No way to manipulate user ID client-side

### What's Public
- ⚠️ Photos are publicly readable (anyone with URL can view)
- ⚠️ This is intentional - allows sharing and viewing without auth
- ⚠️ URLs are not guessable (UUID-based baby IDs + timestamps)

### Recommendations
- Consider implementing signed URLs for private photos
- Monitor storage usage per user/family
- Set up automated cleanup for deleted baby records
- Implement rate limiting on uploads

## Troubleshooting

### "No JWT template exists with name: supabase"
**Solution**: Remove any `template: 'supabase'` parameters from `getToken()` calls. Use native integration instead.

### "Bucket already exists"
**Solution**: The script handles this with `ON CONFLICT`. It's safe to run multiple times.

### "new row violates row-level security policy" or "Permission denied for storage"
**Solution**:
1. Verify Clerk ↔ Supabase integration is enabled in both dashboards
2. Ensure Infisical secrets are up to date (especially `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`)
3. Run `infisical run --env=dev -- bun run scripts/create-storage-policies.ts` to recreate policies
4. Check that user has babies in the database
5. Restart your Next.js dev server to pick up the new environment variables
6. Verify the `requesting_user_id()` function exists in your database

### "Upload succeeds but can't read file"
**Solution**: Ensure the public read policy is created. Run the storage policies script again.

## Scripts

- `bun create-storage-policies` - Set up storage bucket and policies
- `bun migrate` - Full migration including storage setup
- `bun push` - Push schema changes including storage setup

## References

- [Clerk ↔ Supabase Integration (2025)](https://clerk.com/docs/integrations/databases/supabase)
- [Supabase Storage RLS](https://supabase.com/docs/guides/storage/security/access-control)
- [Supabase Third-Party Auth](https://supabase.com/docs/guides/auth/third-party/clerk)

