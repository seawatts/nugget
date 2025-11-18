CREATE TYPE "public"."activitySubjectType" AS ENUM('baby', 'family_member');--> statement-breakpoint
ALTER TABLE "activities" ALTER COLUMN "babyId" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "activities" ADD COLUMN "familyMemberId" varchar(128);--> statement-breakpoint
ALTER TABLE "activities" ADD COLUMN "subjectType" "activitySubjectType" DEFAULT 'baby' NOT NULL;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_familyMemberId_familyMembers_id_fk" FOREIGN KEY ("familyMemberId") REFERENCES "public"."familyMembers"("id") ON DELETE cascade ON UPDATE no action;