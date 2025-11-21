ALTER TABLE "users" DROP CONSTRAINT "users_lastSelectedBabyId_babies_id_fk";
--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "users_lastSelectedFamilyId_families_id_fk";
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "quickLogEnabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "quickLogFeedingUseLastAmount" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "quickLogFeedingUseTypicalDuration" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "quickLogFeedingUseLastType" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "quickLogSleepUseSuggestedDuration" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "quickLogDiaperUsePredictedType" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "quickLogPumpingUseLastVolume" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "quickLogPumpingUseTypicalDuration" boolean DEFAULT true NOT NULL;