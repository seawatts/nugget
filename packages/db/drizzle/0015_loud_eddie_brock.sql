ALTER TABLE "chats" ADD COLUMN "contextId" varchar(256);--> statement-breakpoint
ALTER TABLE "chats" ADD COLUMN "contextType" varchar(64);--> statement-breakpoint
CREATE INDEX "chats_contextType_contextId_idx" ON "chats" USING btree ("contextType","contextId");