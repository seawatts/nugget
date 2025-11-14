ALTER TABLE "babies" ADD COLUMN "journeyStage" "journeyStage";--> statement-breakpoint
ALTER TABLE "babies" ADD COLUMN "ttcMethod" "ttcMethod";--> statement-breakpoint
ALTER TABLE "familyMembers" DROP COLUMN "journeyStage";--> statement-breakpoint
ALTER TABLE "familyMembers" DROP COLUMN "ttcMethod";