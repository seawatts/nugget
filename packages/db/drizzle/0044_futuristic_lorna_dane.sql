-- First, convert column to text temporarily to allow updates
ALTER TABLE "activities" ALTER COLUMN "type" SET DATA TYPE text;--> statement-breakpoint

-- Update all existing activities with type 'walk' to 'stroller_walk' (now that it's text)
UPDATE "activities" SET "type" = 'stroller_walk' WHERE "type" = 'walk';--> statement-breakpoint

-- Now drop and recreate the enum without 'walk', but with 'stroller_walk'
DROP TYPE "public"."activityType";--> statement-breakpoint
CREATE TYPE "public"."activityType" AS ENUM('sleep', 'feeding', 'bottle', 'nursing', 'pumping', 'diaper', 'wet', 'dirty', 'both', 'solids', 'bath', 'medicine', 'temperature', 'tummy_time', 'growth', 'potty', 'doctor_visit', 'vitamin_d', 'nail_trimming', 'stroller_walk', 'contrast_time');--> statement-breakpoint

-- Convert the column back to the enum type
ALTER TABLE "activities" ALTER COLUMN "type" SET DATA TYPE "public"."activityType" USING "type"::"public"."activityType";--> statement-breakpoint

