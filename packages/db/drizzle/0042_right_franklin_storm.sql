CREATE TYPE "public"."developmentalSubPhaseType" AS ENUM('fussy', 'skills');--> statement-breakpoint
CREATE TABLE "developmentalPhaseProgress" (
	"babyId" varchar(128) NOT NULL,
	"checklistItems" json DEFAULT '[]'::json NOT NULL,
	"completedAt" timestamp with time zone,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"familyId" varchar(128) DEFAULT requesting_family_id() NOT NULL,
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"phaseId" varchar(128) NOT NULL,
	"subPhaseType" "developmentalSubPhaseType" NOT NULL,
	"updatedAt" timestamp with time zone,
	"userId" varchar(128) DEFAULT requesting_user_id() NOT NULL,
	CONSTRAINT "developmentalPhaseProgress_unique_subPhase" UNIQUE("babyId","phaseId","subPhaseType")
);
--> statement-breakpoint
CREATE TABLE "developmentalPhases" (
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"description" text,
	"endDay" integer NOT NULL,
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"phaseNumber" integer NOT NULL,
	"startDay" integer NOT NULL,
	"updatedAt" timestamp with time zone,
	CONSTRAINT "developmentalPhases_phaseNumber_unique" UNIQUE("phaseNumber")
);
--> statement-breakpoint
ALTER TABLE "developmentalPhaseProgress" ADD CONSTRAINT "developmentalPhaseProgress_babyId_babies_id_fk" FOREIGN KEY ("babyId") REFERENCES "public"."babies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "developmentalPhaseProgress" ADD CONSTRAINT "developmentalPhaseProgress_familyId_families_id_fk" FOREIGN KEY ("familyId") REFERENCES "public"."families"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "developmentalPhaseProgress" ADD CONSTRAINT "developmentalPhaseProgress_phaseId_developmentalPhases_id_fk" FOREIGN KEY ("phaseId") REFERENCES "public"."developmentalPhases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "developmentalPhaseProgress_babyId_idx" ON "developmentalPhaseProgress" USING btree ("babyId");--> statement-breakpoint
CREATE INDEX "developmentalPhaseProgress_phaseId_idx" ON "developmentalPhaseProgress" USING btree ("phaseId");