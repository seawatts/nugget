CREATE TYPE "public"."celebrationType" AS ENUM('week_1', 'week_2', 'week_3', 'week_4', 'week_5', 'week_6', 'week_7', 'week_8', 'week_9', 'week_10', 'week_11', 'week_12', 'month_1', 'month_2', 'month_3', 'month_4', 'month_5', 'month_6', 'month_9', 'year_1', 'month_18', 'year_2');--> statement-breakpoint
CREATE TYPE "public"."questionAnswer" AS ENUM('yes', 'no');--> statement-breakpoint
CREATE TABLE "celebrationMemories" (
	"babyId" varchar(128) NOT NULL,
	"celebrationDate" timestamp DEFAULT now() NOT NULL,
	"celebrationType" "celebrationType" NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"familyId" varchar(128) DEFAULT requesting_family_id() NOT NULL,
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"metadata" json,
	"note" text,
	"photoUrls" json DEFAULT '[]'::json,
	"sharedWith" json DEFAULT '[]'::json,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"userId" varchar(128) DEFAULT requesting_user_id() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "milestoneQuestionResponses" (
	"answer" "questionAnswer" NOT NULL,
	"babyId" varchar(128) NOT NULL,
	"chatId" varchar(128),
	"contextId" varchar(256) NOT NULL,
	"contextType" varchar(64) NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"familyId" varchar(128) DEFAULT requesting_family_id() NOT NULL,
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"question" text NOT NULL,
	"updatedAt" timestamp with time zone,
	"userId" varchar(128) DEFAULT requesting_user_id() NOT NULL,
	CONSTRAINT "unique_response_per_context" UNIQUE("userId","contextType","contextId","question")
);
--> statement-breakpoint
ALTER TABLE "celebrationMemories" ADD CONSTRAINT "celebrationMemories_babyId_babies_id_fk" FOREIGN KEY ("babyId") REFERENCES "public"."babies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "celebrationMemories" ADD CONSTRAINT "celebrationMemories_familyId_families_id_fk" FOREIGN KEY ("familyId") REFERENCES "public"."families"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "milestoneQuestionResponses" ADD CONSTRAINT "milestoneQuestionResponses_babyId_babies_id_fk" FOREIGN KEY ("babyId") REFERENCES "public"."babies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "milestoneQuestionResponses" ADD CONSTRAINT "milestoneQuestionResponses_chatId_chats_id_fk" FOREIGN KEY ("chatId") REFERENCES "public"."chats"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "milestoneQuestionResponses" ADD CONSTRAINT "milestoneQuestionResponses_familyId_families_id_fk" FOREIGN KEY ("familyId") REFERENCES "public"."families"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "milestoneQuestionResponses_contextType_contextId_idx" ON "milestoneQuestionResponses" USING btree ("contextType","contextId");--> statement-breakpoint
CREATE INDEX "milestoneQuestionResponses_babyId_familyId_idx" ON "milestoneQuestionResponses" USING btree ("babyId","familyId");--> statement-breakpoint
CREATE INDEX "milestoneQuestionResponses_userId_createdAt_idx" ON "milestoneQuestionResponses" USING btree ("userId","createdAt");