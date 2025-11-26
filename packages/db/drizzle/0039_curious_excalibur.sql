CREATE TABLE "parentDailyResponses" (
	"answerChoices" json NOT NULL,
	"babyId" varchar(128) NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"date" timestamp with time zone DEFAULT now() NOT NULL,
	"familyId" varchar(128) DEFAULT requesting_family_id() NOT NULL,
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"question" text NOT NULL,
	"questionContext" json,
	"selectedAnswer" varchar(256),
	"updatedAt" timestamp with time zone,
	"userId" varchar(128) NOT NULL,
	CONSTRAINT "parentDailyResponses_user_date_unique" UNIQUE("userId","date")
);
--> statement-breakpoint
ALTER TABLE "parentDailyResponses" ADD CONSTRAINT "parentDailyResponses_babyId_babies_id_fk" FOREIGN KEY ("babyId") REFERENCES "public"."babies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parentDailyResponses" ADD CONSTRAINT "parentDailyResponses_familyId_families_id_fk" FOREIGN KEY ("familyId") REFERENCES "public"."families"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parentDailyResponses" ADD CONSTRAINT "parentDailyResponses_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "parentDailyResponses_date_idx" ON "parentDailyResponses" USING btree ("date");--> statement-breakpoint
CREATE INDEX "parentDailyResponses_family_idx" ON "parentDailyResponses" USING btree ("familyId");--> statement-breakpoint
CREATE INDEX "parentDailyResponses_user_date_idx" ON "parentDailyResponses" USING btree ("userId","date");--> statement-breakpoint
CREATE INDEX "parentDailyResponses_user_idx" ON "parentDailyResponses" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "parentDailyResponses_baby_idx" ON "parentDailyResponses" USING btree ("babyId");