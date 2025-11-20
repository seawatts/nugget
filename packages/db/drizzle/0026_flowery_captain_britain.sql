ALTER TABLE "celebrationMemories" ADD COLUMN "aiGeneratedAt" timestamp;--> statement-breakpoint
ALTER TABLE "celebrationMemories" ADD COLUMN "aiQuestions" json;--> statement-breakpoint
ALTER TABLE "celebrationMemories" ADD COLUMN "aiSummary" text;