ALTER TABLE "users" ADD COLUMN "alarmDiaperEnabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "alarmDiaperThreshold" integer;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "alarmFeedingEnabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "alarmFeedingThreshold" integer;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "alarmPumpingEnabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "alarmPumpingThreshold" integer;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "alarmSleepEnabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "alarmSleepThreshold" integer;