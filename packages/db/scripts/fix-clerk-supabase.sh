#!/bin/bash
set -e

echo "🔧 Fixing Clerk + Supabase Integration"
echo "========================================"
echo ""

# Step 1: Stop Supabase
echo "1️⃣  Stopping Supabase..."
bunx supabase stop

# Step 2: Start Supabase (this will pick up config.toml changes)
echo ""
echo "2️⃣  Starting Supabase with updated config..."
bunx supabase start

# Step 3: Get the new Supabase credentials
echo ""
echo "3️⃣  Getting new Supabase credentials..."
bunx supabase status --output env > .supabase-env.tmp

# Step 4: Extract the values
ANON_KEY=$(grep "^ANON_KEY=" .supabase-env.tmp | cut -d= -f2- | tr -d '"')
JWT_SECRET=$(grep "^JWT_SECRET=" .supabase-env.tmp | cut -d= -f2- | tr -d '"')
SERVICE_ROLE_KEY=$(grep "^SERVICE_ROLE_KEY=" .supabase-env.tmp | cut -d= -f2- | tr -d '"')

# Clean up temp file
rm .supabase-env.tmp

echo ""
echo "4️⃣  Updating Infisical secrets..."

# Step 5: Update Infisical
infisical secrets set NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="$ANON_KEY" --env=dev --silent
infisical secrets set SUPABASE_JWT_SECRET="$JWT_SECRET" --env=dev --silent
infisical secrets set SUPABASE_SERVICE_ROLE_KEY="$SERVICE_ROLE_KEY" --env=dev --silent

echo "   ✅ Infisical secrets updated"

# Step 6: Run migrations
echo ""
echo "5️⃣  Running migrations..."
infisical run --env=dev -- bun migrate

echo ""
echo "✅ Fix completed successfully!"
echo ""
echo "📝 Next steps:"
echo "   1. Restart your Next.js dev server to pick up new environment variables"
echo "   2. Test the integration with: bun run test:clerk-supabase <clerk-token>"
echo ""
echo "To get a Clerk token:"
echo "   1. Log in to your app"
echo "   2. Open browser console"
echo "   3. Run: await window.Clerk.session.getToken()"
echo "   4. Copy the token"
echo ""

