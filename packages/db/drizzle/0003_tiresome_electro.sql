CREATE TABLE "invitations" (
	"code" varchar(128) NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now(),
	"expiresAt" timestamp with time zone NOT NULL,
	"familyId" varchar DEFAULT requesting_family_id() NOT NULL,
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"invitedByUserId" varchar DEFAULT requesting_user_id() NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"role" "userRole" DEFAULT 'partner' NOT NULL,
	"updatedAt" timestamp with time zone,
	"usedAt" timestamp with time zone,
	"usedByUserId" varchar,
	CONSTRAINT "invitations_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "pushSubscriptions" (
	"auth" text NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now(),
	"endpoint" text NOT NULL,
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"p256dh" text NOT NULL,
	"updatedAt" timestamp with time zone,
	"userId" varchar DEFAULT requesting_user_id() NOT NULL,
	CONSTRAINT "pushSubscriptions_endpoint_unique" UNIQUE("endpoint")
);
--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_familyId_families_id_fk" FOREIGN KEY ("familyId") REFERENCES "public"."families"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_invitedByUserId_users_id_fk" FOREIGN KEY ("invitedByUserId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_usedByUserId_users_id_fk" FOREIGN KEY ("usedByUserId") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pushSubscriptions" ADD CONSTRAINT "pushSubscriptions_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;