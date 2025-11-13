# RLS Helper Functions in Drizzle Migrations

## Problem

Drizzle Kit doesn't automatically generate custom PostgreSQL functions when creating migrations. The schema uses `requesting_user_id()` and `requesting_family_id()` helper functions for Row Level Security (RLS), but these need to exist in the database before the tables are created.

## Solutions

### Option 1: Supabase Migrations (Recommended)

The RLS helper functions are now defined in:
```
packages/db/supabase/migrations/00000000000000_create_rls_functions.sql
```

This file runs **before** Drizzle migrations when you execute `bunx supabase db reset`, ensuring the functions always exist.

**Pros:**
- Functions persist across database resets
- Clean separation of concerns
- Works automatically with Supabase workflow
- No manual intervention needed

**Cons:**
- Only works if using Supabase
- Requires understanding of Supabase migration ordering

### Option 2: Automatic Prepending Script

The script `scripts/prepend-rls-functions.ts` automatically adds the functions to newly generated migrations.

**How it works:**
1. Run `bun gen-migration` (which now includes the prepend script)
2. The script finds the latest migration file
3. If functions aren't present, it prepends them
4. The migration file is ready to use

**Pros:**
- Works with or without Supabase
- Automatic - no manual editing
- Functions are always in the migration

**Cons:**
- Functions are duplicated in every migration
- Slight overhead in migration files

### Option 3: Manual Addition (Not Recommended)

You can manually add the functions to the top of each migration file, but this is error-prone and tedious.

## The Helper Functions

```sql
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
$$;

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
$$;
```

These functions extract values from the JWT claims set by Clerk:
- `requesting_user_id()`: Gets the user's ID from the `sub` claim
- `requesting_family_id()`: Gets the organization/family ID from the `org_id` claim
  - **Note**: The function is named `requesting_family_id()` to match our application terminology, but it reads from `org_id` because that's what Clerk provides in the JWT

## Usage in Schema

These functions are used as default values in the schema:

```typescript
userId: varchar('userId')
  .notNull()
  .default(requestingUserId()),

familyId: varchar('familyId')
  .notNull()
  .default(requestingFamilyId()),
```

This allows Supabase RLS policies to automatically populate these fields based on the authenticated user's JWT claims.

## Workflow

### Current Setup
With both solutions in place:

1. **For development with Supabase:**
   ```bash
   bunx supabase db reset  # Creates functions from Supabase migration
   bun gen-migration       # Functions are prepended automatically
   bun migrate            # Applies Drizzle migrations
   ```

2. **For production deployments:**
   - Supabase migration runs first (creates functions)
   - Drizzle migrations run second (use the functions)

### Testing the Migration

```bash
# Reset database
bunx supabase db reset

# Generate a new migration (functions will be prepended)
bun gen-migration

# Apply the migration
bun migrate
```

## Troubleshooting

### "type already exists" error
If you see this error, it means the database already has the types/functions. Run:
```bash
bunx supabase db reset
```

### Functions not found
Ensure the Supabase migration file exists and is numbered lower than Drizzle migrations:
```
supabase/migrations/00000000000000_create_rls_functions.sql
```

### Script doesn't run automatically
Check `package.json` - the `gen-migration` script should include:
```json
"gen-migration": "drizzle-kit generate && bun scripts/prepend-rls-functions.ts"
```

