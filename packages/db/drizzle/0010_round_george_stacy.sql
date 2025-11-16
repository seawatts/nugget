CREATE TYPE "public"."diaperColor" AS ENUM('yellow', 'brown', 'green', 'black', 'red', 'white', 'orange');--> statement-breakpoint
CREATE TYPE "public"."diaperConsistency" AS ENUM('solid', 'loose', 'runny', 'mucousy', 'hard', 'pebbles', 'diarrhea');--> statement-breakpoint
CREATE TYPE "public"."diaperSize" AS ENUM('little', 'medium', 'large');