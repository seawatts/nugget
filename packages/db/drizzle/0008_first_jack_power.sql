CREATE TABLE "contentCache" (
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"expiresAt" timestamp with time zone NOT NULL,
	"familyId" varchar(128) DEFAULT requesting_family_id() NOT NULL,
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"updatedAt" timestamp with time zone,
	"value" json NOT NULL,
	CONSTRAINT "contentCache_familyId_key_unique" UNIQUE("familyId","key")
);
--> statement-breakpoint
ALTER TABLE "contentCache" ADD CONSTRAINT "contentCache_familyId_families_id_fk" FOREIGN KEY ("familyId") REFERENCES "public"."families"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "contentCache_familyId_key_idx" ON "contentCache" USING btree ("familyId","key");