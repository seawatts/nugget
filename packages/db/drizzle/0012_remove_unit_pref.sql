-- Drop the unitPref column from users table
ALTER TABLE "users" DROP COLUMN IF EXISTS "unitPref";--> statement-breakpoint

-- Drop the unitPref enum type if it exists and is no longer used
DROP TYPE IF EXISTS "public"."unitPref";


