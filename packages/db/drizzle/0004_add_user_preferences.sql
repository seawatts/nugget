-- Create Supabase RLS functions for requesting_user_id and requesting_family_id
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

-- Create new enum types for user preferences
DO $$ BEGIN
 CREATE TYPE "public"."measurementUnit" AS ENUM('imperial', 'metric');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."temperatureUnit" AS ENUM('fahrenheit', 'celsius');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."timeFormat" AS ENUM('12h', '24h');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Add new columns to users table
ALTER TABLE "public"."users" ADD COLUMN "measurementUnit" "measurementUnit" DEFAULT 'imperial' NOT NULL;--> statement-breakpoint
ALTER TABLE "public"."users" ADD COLUMN "temperatureUnit" "temperatureUnit" DEFAULT 'fahrenheit' NOT NULL;--> statement-breakpoint
ALTER TABLE "public"."users" ADD COLUMN "timeFormat" "timeFormat" DEFAULT '12h' NOT NULL;

