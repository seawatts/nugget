-- Create Supabase RLS functions for requesting_user_id and requesting_family_id
CREATE OR REPLACE FUNCTION requesting_user_id()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT NULLIF(
    current_setting('request.jwt.claims', true)::json->>'sub',
    ''
  )::text;
$$;--> statement-breakpoint

CREATE OR REPLACE FUNCTION requesting_family_id()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT NULLIF(
    current_setting('request.jwt.claims', true)::json->>'org_id',
    ''
  )::text;
$$;--> statement-breakpoint

CREATE TYPE "public"."activityType" AS ENUM('sleep', 'feeding', 'bottle', 'nursing', 'pumping', 'diaper', 'wet', 'dirty', 'both', 'solids', 'bath', 'medicine', 'temperature', 'tummy_time', 'growth', 'potty');--> statement-breakpoint
CREATE TYPE "public"."feedingSource" AS ENUM('pumped', 'donor', 'direct', 'formula');--> statement-breakpoint
CREATE TYPE "public"."journeyStage" AS ENUM('ttc', 'pregnant', 'born');--> statement-breakpoint
CREATE TYPE "public"."localConnectionStatus" AS ENUM('connected', 'disconnected');--> statement-breakpoint
CREATE TYPE "public"."milestoneType" AS ENUM('physical', 'cognitive', 'social', 'language', 'self_care');--> statement-breakpoint
CREATE TYPE "public"."stripeSubscriptionStatus" AS ENUM('active', 'canceled', 'incomplete', 'incomplete_expired', 'past_due', 'paused', 'trialing', 'unpaid');--> statement-breakpoint
CREATE TYPE "public"."supplyTransactionType" AS ENUM('add', 'deduct');--> statement-breakpoint
CREATE TYPE "public"."ttcMethod" AS ENUM('natural', 'ivf', 'other');--> statement-breakpoint
CREATE TYPE "public"."unitPref" AS ENUM('ML', 'OZ');--> statement-breakpoint
CREATE TYPE "public"."userRole" AS ENUM('primary', 'partner', 'caregiver');--> statement-breakpoint
CREATE TABLE "activities" (
	"amount" integer,
	"babyId" varchar(128) NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"details" json,
	"duration" integer,
	"endTime" timestamp,
	"familyMemberId" varchar(128),
	"feedingSource" "feedingSource",
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"isScheduled" boolean DEFAULT false NOT NULL,
	"notes" text,
	"startTime" timestamp NOT NULL,
	"type" "activityType" NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"userId" varchar(128) DEFAULT requesting_user_id() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "babies" (
	"birthDate" timestamp,
	"birthWeightOz" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"currentWeightOz" integer,
	"dueDate" timestamp,
	"familyId" varchar(128) DEFAULT requesting_family_id() NOT NULL,
	"feedIntervalHours" integer DEFAULT 2.5,
	"gender" text,
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"metadata" json,
	"mlPerPump" integer DEFAULT 24,
	"name" text NOT NULL,
	"photoUrl" text,
	"pumpsPerDay" integer DEFAULT 6,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"userId" varchar(128) DEFAULT requesting_user_id() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "families" (
	"clerkOrgId" text NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now(),
	"createdByUserId" varchar NOT NULL,
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"stripeCustomerId" text,
	"stripeSubscriptionId" text,
	"stripeSubscriptionStatus" "stripeSubscriptionStatus",
	"updatedAt" timestamp with time zone,
	CONSTRAINT "families_clerkOrgId_unique" UNIQUE("clerkOrgId"),
	CONSTRAINT "families_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "familyMembers" (
	"createdAt" timestamp with time zone DEFAULT now(),
	"familyId" varchar DEFAULT requesting_family_id() NOT NULL,
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"journeyStage" "journeyStage",
	"onboardingCompletedAt" timestamp with time zone,
	"role" "userRole" DEFAULT 'primary' NOT NULL,
	"ttcMethod" "ttcMethod",
	"updatedAt" timestamp with time zone,
	"userId" varchar DEFAULT requesting_user_id() NOT NULL,
	"userRole" "userRole",
	CONSTRAINT "familyMembers_userId_familyId_unique" UNIQUE("userId","familyId")
);
--> statement-breakpoint
CREATE TABLE "growthRecords" (
	"babyId" varchar(128) NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"date" timestamp NOT NULL,
	"headCircumference" integer,
	"height" integer,
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"metadata" json,
	"notes" text,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"userId" varchar(128) DEFAULT requesting_user_id() NOT NULL,
	"weight" integer
);
--> statement-breakpoint
CREATE TABLE "medicalRecords" (
	"babyId" varchar(128) NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"date" timestamp NOT NULL,
	"description" text,
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"location" text,
	"metadata" json,
	"provider" text,
	"title" text NOT NULL,
	"type" text NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"userId" varchar(128) DEFAULT requesting_user_id() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "milestones" (
	"achievedDate" timestamp NOT NULL,
	"babyId" varchar(128) NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"description" text,
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"metadata" json,
	"photoUrl" text,
	"title" text NOT NULL,
	"type" "milestoneType" NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"userId" varchar(128) DEFAULT requesting_user_id() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shortUrls" (
	"code" varchar(128) NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now(),
	"expiresAt" timestamp with time zone,
	"familyId" varchar DEFAULT requesting_family_id() NOT NULL,
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"redirectUrl" text NOT NULL,
	"updatedAt" timestamp with time zone,
	"userId" varchar DEFAULT requesting_user_id() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "supplyInventory" (
	"babyId" varchar(128) NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"donorMl" integer DEFAULT 0 NOT NULL,
	"formulaMl" integer DEFAULT 0 NOT NULL,
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"pumpedMl" integer DEFAULT 0 NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"userId" varchar(128) DEFAULT requesting_user_id() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "supplyTransactions" (
	"amountMl" integer NOT NULL,
	"babyId" varchar(128) NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"familyMemberId" varchar(128),
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"notes" text,
	"source" "feedingSource" NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"type" "supplyTransactionType" NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"userId" varchar(128) DEFAULT requesting_user_id() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"avatarUrl" text,
	"clerkId" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"email" text NOT NULL,
	"firstName" text,
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"lastLoggedInAt" timestamp with time zone,
	"lastName" text,
	"online" boolean DEFAULT false NOT NULL,
	"unitPref" "unitPref" DEFAULT 'ML' NOT NULL,
	"updatedAt" timestamp with time zone,
	CONSTRAINT "users_clerkId_unique" UNIQUE("clerkId")
);
--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_babyId_babies_id_fk" FOREIGN KEY ("babyId") REFERENCES "public"."babies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_familyMemberId_familyMembers_id_fk" FOREIGN KEY ("familyMemberId") REFERENCES "public"."familyMembers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "babies" ADD CONSTRAINT "babies_familyId_families_id_fk" FOREIGN KEY ("familyId") REFERENCES "public"."families"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "families" ADD CONSTRAINT "families_createdByUserId_users_id_fk" FOREIGN KEY ("createdByUserId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "familyMembers" ADD CONSTRAINT "familyMembers_familyId_families_id_fk" FOREIGN KEY ("familyId") REFERENCES "public"."families"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "familyMembers" ADD CONSTRAINT "familyMembers_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "growthRecords" ADD CONSTRAINT "growthRecords_babyId_babies_id_fk" FOREIGN KEY ("babyId") REFERENCES "public"."babies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medicalRecords" ADD CONSTRAINT "medicalRecords_babyId_babies_id_fk" FOREIGN KEY ("babyId") REFERENCES "public"."babies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "milestones" ADD CONSTRAINT "milestones_babyId_babies_id_fk" FOREIGN KEY ("babyId") REFERENCES "public"."babies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shortUrls" ADD CONSTRAINT "shortUrls_familyId_families_id_fk" FOREIGN KEY ("familyId") REFERENCES "public"."families"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shortUrls" ADD CONSTRAINT "shortUrls_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplyInventory" ADD CONSTRAINT "supplyInventory_babyId_babies_id_fk" FOREIGN KEY ("babyId") REFERENCES "public"."babies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplyTransactions" ADD CONSTRAINT "supplyTransactions_babyId_babies_id_fk" FOREIGN KEY ("babyId") REFERENCES "public"."babies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplyTransactions" ADD CONSTRAINT "supplyTransactions_familyMemberId_familyMembers_id_fk" FOREIGN KEY ("familyMemberId") REFERENCES "public"."familyMembers"("id") ON DELETE set null ON UPDATE no action;