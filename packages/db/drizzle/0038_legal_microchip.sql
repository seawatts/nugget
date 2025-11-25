ALTER TYPE "public"."activityType" ADD VALUE 'nail_trimming';--> statement-breakpoint
ALTER TABLE "babies" ADD COLUMN "showNailTrimmingCard" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "babies" ADD COLUMN "showBathCard" boolean DEFAULT true NOT NULL;