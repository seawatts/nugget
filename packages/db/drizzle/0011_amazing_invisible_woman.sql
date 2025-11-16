CREATE TYPE "public"."sleepLocation" AS ENUM('crib', 'bassinet', 'bed', 'car_seat', 'stroller', 'arms', 'swing', 'bouncer');--> statement-breakpoint
CREATE TYPE "public"."sleepQuality" AS ENUM('peaceful', 'restless', 'fussy', 'crying');--> statement-breakpoint
CREATE TYPE "public"."wakeReason" AS ENUM('hungry', 'diaper', 'crying', 'naturally', 'noise', 'unknown');