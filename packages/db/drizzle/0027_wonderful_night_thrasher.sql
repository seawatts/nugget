ALTER TABLE "users" ADD COLUMN "lastSelectedBabyId" varchar(128);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "lastSelectedFamilyId" varchar(128);--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_lastSelectedBabyId_babies_id_fk" FOREIGN KEY ("lastSelectedBabyId") REFERENCES "public"."babies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_lastSelectedFamilyId_families_id_fk" FOREIGN KEY ("lastSelectedFamilyId") REFERENCES "public"."families"("id") ON DELETE set null ON UPDATE no action;