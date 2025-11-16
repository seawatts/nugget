CREATE TYPE "public"."checkInCategory" AS ENUM('physical', 'emotional', 'support', 'baby_concern', 'self_care');--> statement-breakpoint
CREATE TYPE "public"."checkInResponseType" AS ENUM('emoji_scale', 'yes_no', 'rating_1_5', 'text_short');--> statement-breakpoint
CREATE TYPE "public"."taskCategory" AS ENUM('baby_care', 'household', 'self_care', 'relationship', 'preparation');--> statement-breakpoint
CREATE TYPE "public"."taskPriority" AS ENUM('high', 'medium', 'low');--> statement-breakpoint
CREATE TYPE "public"."wellnessQuestionCategory" AS ENUM('mood', 'anxiety', 'bonding', 'coping', 'thoughts');--> statement-breakpoint
CREATE TABLE "parent_check_ins" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"userId" varchar(128) NOT NULL,
	"familyId" varchar(128) DEFAULT requesting_family_id() NOT NULL,
	"date" timestamp DEFAULT now() NOT NULL,
	"responses" json NOT NULL,
	"moodScore" integer,
	"concernsRaised" json DEFAULT '[]'::json,
	"aiGeneratedQuestions" boolean DEFAULT true,
	"questionContext" json,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "parent_tasks" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"userId" varchar(128) NOT NULL,
	"familyId" varchar(128) DEFAULT requesting_family_id() NOT NULL,
	"taskText" text NOT NULL,
	"category" "taskCategory" NOT NULL,
	"priority" "taskPriority" DEFAULT 'medium' NOT NULL,
	"suggestedTime" varchar(64),
	"estimatedMinutes" integer,
	"whyItMatters" text,
	"completed" boolean DEFAULT false NOT NULL,
	"completedAt" timestamp,
	"generatedDate" timestamp DEFAULT now() NOT NULL,
	"context" json,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wellness_assessments" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"userId" varchar(128) NOT NULL,
	"familyId" varchar(128) DEFAULT requesting_family_id() NOT NULL,
	"date" timestamp DEFAULT now() NOT NULL,
	"assessmentType" varchar(64) NOT NULL,
	"questions" json NOT NULL,
	"responses" json NOT NULL,
	"riskScore" integer,
	"recommendations" json,
	"followUpScheduled" timestamp,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "milestones" ALTER COLUMN "achievedDate" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "milestones" ADD COLUMN "isSuggested" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "milestones" ADD COLUMN "suggestedDay" integer;--> statement-breakpoint
ALTER TABLE "parent_check_ins" ADD CONSTRAINT "parent_check_ins_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parent_check_ins" ADD CONSTRAINT "parent_check_ins_familyId_families_id_fk" FOREIGN KEY ("familyId") REFERENCES "public"."families"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parent_tasks" ADD CONSTRAINT "parent_tasks_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parent_tasks" ADD CONSTRAINT "parent_tasks_familyId_families_id_fk" FOREIGN KEY ("familyId") REFERENCES "public"."families"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wellness_assessments" ADD CONSTRAINT "wellness_assessments_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wellness_assessments" ADD CONSTRAINT "wellness_assessments_familyId_families_id_fk" FOREIGN KEY ("familyId") REFERENCES "public"."families"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "parent_check_ins_user_idx" ON "parent_check_ins" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "parent_check_ins_family_idx" ON "parent_check_ins" USING btree ("familyId");--> statement-breakpoint
CREATE INDEX "parent_check_ins_date_idx" ON "parent_check_ins" USING btree ("date");--> statement-breakpoint
CREATE INDEX "parent_tasks_user_idx" ON "parent_tasks" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "parent_tasks_family_idx" ON "parent_tasks" USING btree ("familyId");--> statement-breakpoint
CREATE INDEX "parent_tasks_completed_idx" ON "parent_tasks" USING btree ("completed");--> statement-breakpoint
CREATE INDEX "parent_tasks_generated_date_idx" ON "parent_tasks" USING btree ("generatedDate");--> statement-breakpoint
CREATE INDEX "wellness_assessments_user_idx" ON "wellness_assessments" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "wellness_assessments_family_idx" ON "wellness_assessments" USING btree ("familyId");--> statement-breakpoint
CREATE INDEX "wellness_assessments_date_idx" ON "wellness_assessments" USING btree ("date");--> statement-breakpoint
CREATE INDEX "wellness_assessments_risk_score_idx" ON "wellness_assessments" USING btree ("riskScore");