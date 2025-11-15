# Fixing JWT/Storage Upload Errors with Clerk + Supabase

## Problems

### Error 1: "alg" (Algorithm) Header Parameter value not allowed
Getting error when uploading files to Supabase Storage.

### Error 2: Key for the RS256 algorithm must be one of type CryptoKey, KeyObject, or JSON Web Key
Getting error: `Key for the RS256 algorithm must be one of type CryptoKey, KeyObject, or JSON Web Key. Received an instance of Uint8Array`

## Root Cause

These errors occur when:
1. Supabase is not properly configured to accept Clerk's RS256 JWTs via the third-party auth integration
2. The `@supabase/ssr` client is trying to validate JWTs locally instead of sending them to the server
3. The client is using the wrong method (`accessToken` callback) which triggers local JWT validation
4. The anon key (which uses HS256) is being used to try to validate Clerk's RS256 tokens

## Solutions

### Fix 1: Update Infisical Environment Variables (Required)

The `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in Infisical must match the actual anon key from your local Supabase instance.

**Get the correct values:**
```bash
cd packages/db
npx supabase status --output env
```

**Update Infisical:**
```bash
infisical secrets set NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="<anon_key_from_supabase>" --env=dev
infisical secrets set SUPABASE_JWT_SECRET="<jwt_secret_from_supabase>" --env=dev
infisical secrets set SUPABASE_SERVICE_ROLE_KEY="<service_role_key_from_supabase>" --env=dev
```

**Restart your dev server** to pick up the new environment variables.

### Fix 2: Update Supabase Client Configuration (Required)

The `@supabase/ssr` client's `accessToken` callback triggers local JWT validation, which fails with Clerk's RS256 tokens. Instead, we need to:
1. Disable local JWT validation
2. Pass the token as a global Authorization header synchronously

**Updated client configuration** (already applied in `packages/db/src/supabase/client.ts`):

```typescript
export const useClient = () => {
  const { session } = useSession();
  const [token, setToken] = useState<string | null>(null);

  // Get token when session changes
  useEffect(() => {
    if (session) {
      session.getToken().then(setToken).catch(console.error);
    } else {
      setToken(null);
    }
  }, [session]);

  const client = useMemo(() => {
    return createBrowserClient<Database>(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      {
        auth: {
          // Don't try to validate JWTs locally - let the server handle it
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
        global: {
          headers: token
            ? { Authorization: `Bearer ${token}` }
            : {},
        },
        realtime: {
          params: { eventsPerSecond: 10 },
        },
      },
    );
  }, [token]);

  return client;
};
```

**Key Changes:**
- ❌ Don't use `accessToken` callback (triggers local JWT validation)
- ✅ Use `global.headers` with synchronous token
- ✅ Disable `persistSession`, `autoRefreshToken`, and `detectSessionInUrl`
- ✅ Fetch token in useEffect and store in state

### Fix 3: Update Storage RLS Policies (Required for File Uploads)

Storage RLS policies must use the `requesting_user_id()` helper function instead of manually extracting JWT claims.

**Updated storage policies** (already applied in `packages/db/scripts/create-storage-policies.ts`):

```sql
CREATE POLICY "Users can upload their baby avatars"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'baby-avatars'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM babies
    WHERE "userId" = requesting_user_id()  -- ✅ Uses helper function
  )
);
```

**Run the script to update policies:**
```bash
cd packages/db
infisical run --env=dev -- bun run scripts/create-storage-policies.ts
```

### Fix 4: Configure Supabase Third-Party Auth (2025 Integration)

### Step 1: Verify Clerk Configuration
1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Navigate to **Integrations** → **Databases** → **Supabase**
3. Ensure the integration is **enabled**
4. Copy your Clerk domain (e.g., `magnificent-javelin-57.clerk.accounts.dev`)

### Step 2: Configure Supabase to Accept Clerk JWTs

#### Option A: Via Supabase Dashboard (Recommended)
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to **Authentication** → **Providers** → **Third-Party Auth**
3. Click **"Add Provider"**
4. Select **"Clerk"**
5. Enter your Clerk domain: `magnificent-javelin-57.clerk.accounts.dev`
6. **Important**: Make sure to click **"Enable"** or **"Save"**
7. Wait a few minutes for the configuration to propagate

#### Option B: Via Supabase API (If Dashboard method doesn't work)

You may need to configure this via the Management API if the UI isn't working properly:

```bash
# Get your Supabase project reference (from dashboard URL)
PROJECT_REF="your-project-ref"

# Get your Supabase service role key
SERVICE_ROLE_KEY="your-service-role-key"

# Configure third-party auth
curl -X POST "https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth/third-party-providers" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "clerk",
    "domain": "magnificent-javelin-57.clerk.accounts.dev",
    "enabled": true
  }'
```

### Step 3: Verify JWT Algorithm Settings

1. In Supabase Dashboard → **Settings** → **API** → **JWT Settings**
2. You should see:
   - **JWT Secret**: (This is for the old anon key - not used with third-party auth)
   - **Third-Party Auth**: Should show Clerk as enabled

### Step 4: Test the Configuration

Run this command to test if Supabase can validate Clerk tokens:

```bash
# In your app
infisical run -- bun create-storage-policies
```

Or manually test an upload from the baby settings page.

## Common Issues

### Issue 1: Third-Party Auth Not Enabled
**Symptom**: Algorithm error persists
**Fix**: Make sure you clicked "Enable" in the Supabase dashboard after adding Clerk

### Issue 2: Wrong Clerk Domain
**Symptom**: "Invalid token" or "alg not allowed"
**Fix**: Use the FULL domain including `.clerk.accounts.dev` or your custom domain

### Issue 3: Configuration Not Propagated
**Symptom**: Works in dashboard but not in app
**Fix**: Wait 5-10 minutes for configuration to propagate, then restart your dev server

### Issue 4: Still Using JWT Template
**Symptom**: Getting template errors
**Fix**: We already removed the template parameter - verify with:

```bash
grep -r "template.*supabase" apps/web-app/src
```

Should return no results (we already fixed this).

## Verification Checklist

- [ ] Clerk integration enabled in Clerk dashboard
- [ ] Clerk domain copied correctly (e.g., `your-app.clerk.accounts.dev`)
- [ ] Third-party auth configured in Supabase dashboard
- [ ] Clerk provider is **enabled** in Supabase
- [ ] Waited 5-10 minutes for propagation
- [ ] Restarted dev server
- [ ] No `template: 'supabase'` in code
- [ ] Using `session?.getToken()` without template parameter

## Debug Steps

### 1. Check Token in Browser Console
```javascript
// In browser console on your app
const session = await window.Clerk.session;
const token = await session.getToken();
console.log(token);

// Decode at https://jwt.io to verify:
// - alg: RS256 (not HS256)
// - sub: your clerk user ID
// - iss: https://your-app.clerk.accounts.dev
```

### 2. Verify Supabase Configuration
```bash
# Use Supabase CLI
cd packages/db
supabase status

# Check JWT settings in local config
cat supabase/config.toml | grep -A 10 "auth"
```

### 3. Check Network Request
In browser DevTools → Network tab:
- Look for the storage upload request
- Check the Authorization header
- Should start with `Bearer eyJ...`
- The token should be Clerk's RS256 token

## If Nothing Works

Try disabling and re-enabling the integration:

1. In Supabase Dashboard, **disable** the Clerk third-party provider
2. Wait 2 minutes
3. Re-enable it with the correct domain
4. Wait 5 minutes for propagation
5. Restart your dev server
6. Try uploading again

## Contact Support

If the issue persists after all these steps:

1. **Clerk Support**: https://clerk.com/support
   - Mention: "Third-party Supabase integration, RS256 JWT algorithm"
   - Provide: Your Clerk domain

2. **Supabase Support**: https://supabase.com/dashboard/support
   - Mention: "Third-party Clerk auth provider, alg parameter error"
   - Provide: Your project reference

