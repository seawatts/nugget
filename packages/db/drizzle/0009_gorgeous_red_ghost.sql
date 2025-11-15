ALTER TABLE "contentCache" DROP CONSTRAINT "contentCache_familyId_key_unique";--> statement-breakpoint
DROP INDEX "contentCache_familyId_key_idx";--> statement-breakpoint
-- Add columns as nullable first
ALTER TABLE "activities" ADD COLUMN "familyId" varchar(128);--> statement-breakpoint
ALTER TABLE "contentCache" ADD COLUMN "babyId" varchar(128);--> statement-breakpoint
ALTER TABLE "contentCache" ADD COLUMN "userId" varchar(128);--> statement-breakpoint
-- Note: contentCache.familyId already exists, just updating constraints later
ALTER TABLE "growthRecords" ADD COLUMN "familyId" varchar(128);--> statement-breakpoint
ALTER TABLE "medicalRecords" ADD COLUMN "familyId" varchar(128);--> statement-breakpoint
ALTER TABLE "milestones" ADD COLUMN "familyId" varchar(128);--> statement-breakpoint
ALTER TABLE "supplyInventory" ADD COLUMN "familyId" varchar(128);--> statement-breakpoint
ALTER TABLE "supplyTransactions" ADD COLUMN "familyId" varchar(128);--> statement-breakpoint
-- Populate familyId from baby relationship for existing rows
UPDATE "activities" SET "familyId" = b."familyId" FROM "babies" b WHERE "activities"."babyId" = b."id" AND "activities"."familyId" IS NULL;--> statement-breakpoint
UPDATE "growthRecords" SET "familyId" = b."familyId" FROM "babies" b WHERE "growthRecords"."babyId" = b."id" AND "growthRecords"."familyId" IS NULL;--> statement-breakpoint
UPDATE "medicalRecords" SET "familyId" = b."familyId" FROM "babies" b WHERE "medicalRecords"."babyId" = b."id" AND "medicalRecords"."familyId" IS NULL;--> statement-breakpoint
UPDATE "milestones" SET "familyId" = b."familyId" FROM "babies" b WHERE "milestones"."babyId" = b."id" AND "milestones"."familyId" IS NULL;--> statement-breakpoint
UPDATE "supplyInventory" SET "familyId" = b."familyId" FROM "babies" b WHERE "supplyInventory"."babyId" = b."id" AND "supplyInventory"."familyId" IS NULL;--> statement-breakpoint
UPDATE "supplyTransactions" SET "familyId" = b."familyId" FROM "babies" b WHERE "supplyTransactions"."babyId" = b."id" AND "supplyTransactions"."familyId" IS NULL;--> statement-breakpoint
-- For contentCache, populate babyId and userId from familyId (if familyId column still exists temporarily)
-- Note: contentCache might not have existing data, so this is safe
-- Make columns NOT NULL and add defaults
ALTER TABLE "activities" ALTER COLUMN "familyId" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "activities" ALTER COLUMN "familyId" SET DEFAULT requesting_family_id();--> statement-breakpoint
ALTER TABLE "contentCache" ALTER COLUMN "babyId" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "contentCache" ALTER COLUMN "userId" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "contentCache" ALTER COLUMN "userId" SET DEFAULT requesting_user_id();--> statement-breakpoint
ALTER TABLE "contentCache" ALTER COLUMN "familyId" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "contentCache" ALTER COLUMN "familyId" SET DEFAULT requesting_family_id();--> statement-breakpoint
ALTER TABLE "growthRecords" ALTER COLUMN "familyId" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "growthRecords" ALTER COLUMN "familyId" SET DEFAULT requesting_family_id();--> statement-breakpoint
ALTER TABLE "medicalRecords" ALTER COLUMN "familyId" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "medicalRecords" ALTER COLUMN "familyId" SET DEFAULT requesting_family_id();--> statement-breakpoint
ALTER TABLE "milestones" ALTER COLUMN "familyId" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "milestones" ALTER COLUMN "familyId" SET DEFAULT requesting_family_id();--> statement-breakpoint
ALTER TABLE "supplyInventory" ALTER COLUMN "familyId" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "supplyInventory" ALTER COLUMN "familyId" SET DEFAULT requesting_family_id();--> statement-breakpoint
ALTER TABLE "supplyTransactions" ALTER COLUMN "familyId" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "supplyTransactions" ALTER COLUMN "familyId" SET DEFAULT requesting_family_id();--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_familyId_families_id_fk" FOREIGN KEY ("familyId") REFERENCES "public"."families"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contentCache" ADD CONSTRAINT "contentCache_babyId_babies_id_fk" FOREIGN KEY ("babyId") REFERENCES "public"."babies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
-- Note: contentCache_familyId_families_id_fk already exists, skipping
ALTER TABLE "growthRecords" ADD CONSTRAINT "growthRecords_familyId_families_id_fk" FOREIGN KEY ("familyId") REFERENCES "public"."families"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medicalRecords" ADD CONSTRAINT "medicalRecords_familyId_families_id_fk" FOREIGN KEY ("familyId") REFERENCES "public"."families"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "milestones" ADD CONSTRAINT "milestones_familyId_families_id_fk" FOREIGN KEY ("familyId") REFERENCES "public"."families"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplyInventory" ADD CONSTRAINT "supplyInventory_familyId_families_id_fk" FOREIGN KEY ("familyId") REFERENCES "public"."families"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplyTransactions" ADD CONSTRAINT "supplyTransactions_familyId_families_id_fk" FOREIGN KEY ("familyId") REFERENCES "public"."families"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "contentCache_babyId_key_idx" ON "contentCache" USING btree ("babyId","key");--> statement-breakpoint
ALTER TABLE "contentCache" ADD CONSTRAINT "contentCache_babyId_key_unique" UNIQUE("babyId","key");