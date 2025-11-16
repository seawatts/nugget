CREATE TYPE "public"."messageRole" AS ENUM('user', 'assistant');--> statement-breakpoint
CREATE TABLE "chatMessages" (
	"chatId" varchar(128) NOT NULL,
	"content" text NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"role" "messageRole" NOT NULL,
	"userId" varchar(128)
);
--> statement-breakpoint
CREATE TABLE "chats" (
	"babyId" varchar(128) NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"familyId" varchar(128) DEFAULT requesting_family_id() NOT NULL,
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"title" text DEFAULT 'New Chat' NOT NULL,
	"updatedAt" timestamp with time zone,
	"userId" varchar(128) DEFAULT requesting_user_id() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "chatMessages" ADD CONSTRAINT "chatMessages_chatId_chats_id_fk" FOREIGN KEY ("chatId") REFERENCES "public"."chats"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chatMessages" ADD CONSTRAINT "chatMessages_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chats" ADD CONSTRAINT "chats_babyId_babies_id_fk" FOREIGN KEY ("babyId") REFERENCES "public"."babies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chats" ADD CONSTRAINT "chats_familyId_families_id_fk" FOREIGN KEY ("familyId") REFERENCES "public"."families"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "chatMessages_chatId_createdAt_idx" ON "chatMessages" USING btree ("chatId","createdAt");--> statement-breakpoint
CREATE INDEX "chats_babyId_familyId_idx" ON "chats" USING btree ("babyId","familyId");--> statement-breakpoint
CREATE INDEX "chats_updatedAt_idx" ON "chats" USING btree ("updatedAt");