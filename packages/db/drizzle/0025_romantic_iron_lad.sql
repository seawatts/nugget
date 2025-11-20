ALTER TYPE "public"."activityType" ADD VALUE 'doctor_visit';--> statement-breakpoint
ALTER TABLE "activities" RENAME COLUMN "amount" TO "amountMl";--> statement-breakpoint
ALTER TABLE "supplyInventory" ALTER COLUMN "donorMl" SET DATA TYPE real;--> statement-breakpoint
ALTER TABLE "supplyInventory" ALTER COLUMN "formulaMl" SET DATA TYPE real;--> statement-breakpoint
ALTER TABLE "supplyInventory" ALTER COLUMN "pumpedMl" SET DATA TYPE real;--> statement-breakpoint
ALTER TABLE "supplyTransactions" ALTER COLUMN "amountMl" SET DATA TYPE real;--> statement-breakpoint
ALTER TABLE "medicalRecords" ADD COLUMN "activityId" varchar(128);--> statement-breakpoint
ALTER TABLE "medicalRecords" ADD COLUMN "doctorName" text;--> statement-breakpoint
ALTER TABLE "medicalRecords" ADD COLUMN "headCircumferenceCm" real;--> statement-breakpoint
ALTER TABLE "medicalRecords" ADD COLUMN "lengthCm" real;--> statement-breakpoint
ALTER TABLE "medicalRecords" ADD COLUMN "vaccinations" json;--> statement-breakpoint
ALTER TABLE "medicalRecords" ADD COLUMN "visitType" text;--> statement-breakpoint
ALTER TABLE "medicalRecords" ADD COLUMN "weightKg" real;--> statement-breakpoint
ALTER TABLE "medicalRecords" ADD CONSTRAINT "medicalRecords_activityId_activities_id_fk" FOREIGN KEY ("activityId") REFERENCES "public"."activities"("id") ON DELETE set null ON UPDATE no action;