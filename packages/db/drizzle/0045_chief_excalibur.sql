CREATE TYPE "public"."achievementCategory" AS ENUM('foundation', 'volume', 'streaks', 'activity-specific', 'efficiency', 'records', 'time-based', 'special', 'personal-milestones', 'parent-milestones');--> statement-breakpoint
CREATE TYPE "public"."achievementRarity" AS ENUM('common', 'rare', 'epic', 'legendary');--> statement-breakpoint
CREATE TABLE "achievements" (
	"achievementId" varchar(128) NOT NULL,
	"babyId" varchar(128) NOT NULL,
	"category" "achievementCategory" NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"description" text,
	"earned" boolean DEFAULT false NOT NULL,
	"familyId" varchar(128) DEFAULT requesting_family_id() NOT NULL,
	"icon" varchar(128) NOT NULL,
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"name" varchar(256) NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"rarity" "achievementRarity" NOT NULL,
	"target" integer NOT NULL,
	"unlockedAt" timestamp with time zone,
	"updatedAt" timestamp with time zone,
	"userId" varchar(128) DEFAULT requesting_user_id() NOT NULL,
	CONSTRAINT "achievements_babyId_achievementId_unique" UNIQUE("babyId","achievementId")
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "weekStartDay" integer;--> statement-breakpoint
ALTER TABLE "achievements" ADD CONSTRAINT "achievements_babyId_babies_id_fk" FOREIGN KEY ("babyId") REFERENCES "public"."babies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "achievements" ADD CONSTRAINT "achievements_familyId_families_id_fk" FOREIGN KEY ("familyId") REFERENCES "public"."families"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "achievements_babyId_idx" ON "achievements" USING btree ("babyId");--> statement-breakpoint
CREATE INDEX "achievements_familyId_idx" ON "achievements" USING btree ("familyId");--> statement-breakpoint
CREATE INDEX "achievements_babyId_earned_idx" ON "achievements" USING btree ("babyId","earned");--> statement-breakpoint
CREATE INDEX "achievements_babyId_category_idx" ON "achievements" USING btree ("babyId","category");