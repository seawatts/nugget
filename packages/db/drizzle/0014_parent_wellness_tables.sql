-- Custom SQL migration
-- Create parent wellness and support tables
-- Generated manually for parent check-ins, tasks, and wellness assessments

-- Create enums
CREATE TYPE "public"."checkInResponseType" AS ENUM('emoji_scale', 'yes_no', 'rating_1_5', 'text_short');
CREATE TYPE "public"."checkInCategory" AS ENUM('physical', 'emotional', 'support', 'baby_concern', 'self_care');
CREATE TYPE "public"."taskCategory" AS ENUM('baby_care', 'household', 'self_care', 'relationship', 'preparation');
CREATE TYPE "public"."taskPriority" AS ENUM('high', 'medium', 'low');
CREATE TYPE "public"."wellnessQuestionCategory" AS ENUM('mood', 'anxiety', 'bonding', 'coping', 'thoughts');

-- Create parent_check_ins table
CREATE TABLE IF NOT EXISTS "parent_check_ins" (
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

-- Create parent_tasks table
CREATE TABLE IF NOT EXISTS "parent_tasks" (
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

-- Create wellness_assessments table
CREATE TABLE IF NOT EXISTS "wellness_assessments" (
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

-- Add foreign key constraints
DO $$ BEGIN
 ALTER TABLE "parent_check_ins" ADD CONSTRAINT "parent_check_ins_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "parent_check_ins" ADD CONSTRAINT "parent_check_ins_familyId_families_id_fk" FOREIGN KEY ("familyId") REFERENCES "public"."families"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "parent_tasks" ADD CONSTRAINT "parent_tasks_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "parent_tasks" ADD CONSTRAINT "parent_tasks_familyId_families_id_fk" FOREIGN KEY ("familyId") REFERENCES "public"."families"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "wellness_assessments" ADD CONSTRAINT "wellness_assessments_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "wellness_assessments" ADD CONSTRAINT "wellness_assessments_familyId_families_id_fk" FOREIGN KEY ("familyId") REFERENCES "public"."families"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS "parent_check_ins_user_idx" ON "parent_check_ins" USING btree ("userId");
CREATE INDEX IF NOT EXISTS "parent_check_ins_family_idx" ON "parent_check_ins" USING btree ("familyId");
CREATE INDEX IF NOT EXISTS "parent_check_ins_date_idx" ON "parent_check_ins" USING btree ("date");

CREATE INDEX IF NOT EXISTS "parent_tasks_user_idx" ON "parent_tasks" USING btree ("userId");
CREATE INDEX IF NOT EXISTS "parent_tasks_family_idx" ON "parent_tasks" USING btree ("familyId");
CREATE INDEX IF NOT EXISTS "parent_tasks_completed_idx" ON "parent_tasks" USING btree ("completed");
CREATE INDEX IF NOT EXISTS "parent_tasks_generated_date_idx" ON "parent_tasks" USING btree ("generatedDate");

CREATE INDEX IF NOT EXISTS "wellness_assessments_user_idx" ON "wellness_assessments" USING btree ("userId");
CREATE INDEX IF NOT EXISTS "wellness_assessments_family_idx" ON "wellness_assessments" USING btree ("familyId");
CREATE INDEX IF NOT EXISTS "wellness_assessments_date_idx" ON "wellness_assessments" USING btree ("date");
CREATE INDEX IF NOT EXISTS "wellness_assessments_risk_score_idx" ON "wellness_assessments" USING btree ("riskScore");

-- Enable RLS (Row Level Security)
ALTER TABLE "parent_check_ins" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "parent_tasks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "wellness_assessments" ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for parent_check_ins
CREATE POLICY "Users can view their own check-ins" ON "parent_check_ins"
  FOR SELECT
  USING (
    "userId" = requesting_user_id()
    OR "familyId" IN (
      SELECT "familyId" FROM "family_members"
      WHERE "userId" = requesting_user_id()
    )
  );

CREATE POLICY "Users can insert their own check-ins" ON "parent_check_ins"
  FOR INSERT
  WITH CHECK (
    "userId" = requesting_user_id()
    AND "familyId" = requesting_family_id()
  );

CREATE POLICY "Users can update their own check-ins" ON "parent_check_ins"
  FOR UPDATE
  USING ("userId" = requesting_user_id())
  WITH CHECK ("userId" = requesting_user_id());

CREATE POLICY "Users can delete their own check-ins" ON "parent_check_ins"
  FOR DELETE
  USING ("userId" = requesting_user_id());

-- Create RLS policies for parent_tasks
CREATE POLICY "Users can view their own tasks and family tasks" ON "parent_tasks"
  FOR SELECT
  USING (
    "userId" = requesting_user_id()
    OR "familyId" IN (
      SELECT "familyId" FROM "family_members"
      WHERE "userId" = requesting_user_id()
    )
  );

CREATE POLICY "Users can insert their own tasks" ON "parent_tasks"
  FOR INSERT
  WITH CHECK (
    "userId" = requesting_user_id()
    AND "familyId" = requesting_family_id()
  );

CREATE POLICY "Users can update their own tasks" ON "parent_tasks"
  FOR UPDATE
  USING ("userId" = requesting_user_id())
  WITH CHECK ("userId" = requesting_user_id());

CREATE POLICY "Users can delete their own tasks" ON "parent_tasks"
  FOR DELETE
  USING ("userId" = requesting_user_id());

-- Create RLS policies for wellness_assessments
CREATE POLICY "Users can view their own assessments" ON "wellness_assessments"
  FOR SELECT
  USING ("userId" = requesting_user_id());

CREATE POLICY "Users can insert their own assessments" ON "wellness_assessments"
  FOR INSERT
  WITH CHECK (
    "userId" = requesting_user_id()
    AND "familyId" = requesting_family_id()
  );

CREATE POLICY "Users can update their own assessments" ON "wellness_assessments"
  FOR UPDATE
  USING ("userId" = requesting_user_id())
  WITH CHECK ("userId" = requesting_user_id());

CREATE POLICY "Users can delete their own assessments" ON "wellness_assessments"
  FOR DELETE
  USING ("userId" = requesting_user_id());

