ALTER TYPE "public"."achievementCategory" ADD VALUE 'daily-achievements';--> statement-breakpoint
ALTER TABLE "achievements" DROP CONSTRAINT "achievements_babyId_achievementId_unique";--> statement-breakpoint
ALTER TABLE "achievements" ADD COLUMN "completedDate" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "achievements_babyId_achievementId_completedDate_idx" ON "achievements" USING btree ("babyId","achievementId","completedDate");--> statement-breakpoint
CREATE INDEX "achievements_completedDate_idx" ON "achievements" USING btree ("completedDate");--> statement-breakpoint
ALTER TABLE "achievements" ADD CONSTRAINT "achievements_babyId_achievementId_completedDate_unique" UNIQUE("babyId","achievementId","completedDate");