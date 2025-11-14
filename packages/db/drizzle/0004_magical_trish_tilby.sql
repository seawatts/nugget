CREATE TYPE "public"."measurementUnit" AS ENUM('imperial', 'metric');--> statement-breakpoint
CREATE TYPE "public"."temperatureUnit" AS ENUM('fahrenheit', 'celsius');--> statement-breakpoint
CREATE TYPE "public"."timeFormat" AS ENUM('12h', '24h');--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "measurementUnit" "measurementUnit" DEFAULT 'imperial' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "temperatureUnit" "temperatureUnit" DEFAULT 'fahrenheit' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "timeFormat" "timeFormat" DEFAULT '12h' NOT NULL;