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

ALTER TABLE "activities" DROP CONSTRAINT "activities_familyMemberId_familyMembers_id_fk";
--> statement-breakpoint
ALTER TABLE "supplyTransactions" DROP CONSTRAINT "supplyTransactions_familyMemberId_familyMembers_id_fk";
--> statement-breakpoint
ALTER TABLE "activities" DROP COLUMN "familyMemberId";--> statement-breakpoint
ALTER TABLE "supplyTransactions" DROP COLUMN "familyMemberId";