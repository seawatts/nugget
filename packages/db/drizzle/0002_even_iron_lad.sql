ALTER TABLE "activities" DROP CONSTRAINT "activities_familyMemberId_familyMembers_id_fk";
--> statement-breakpoint
ALTER TABLE "supplyTransactions" DROP CONSTRAINT "supplyTransactions_familyMemberId_familyMembers_id_fk";
--> statement-breakpoint
ALTER TABLE "activities" DROP COLUMN "familyMemberId";--> statement-breakpoint
ALTER TABLE "supplyTransactions" DROP COLUMN "familyMemberId";