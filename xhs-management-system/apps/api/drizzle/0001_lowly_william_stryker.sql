CREATE TYPE "public"."contact_role" AS ENUM('Agent', 'Owner', 'Other');--> statement-breakpoint
CREATE TYPE "public"."invitation_status" AS ENUM('Pending Review', 'Scheduled', 'Completed', 'Declined');--> statement-breakpoint
CREATE TYPE "public"."visit_type" AS ENUM('F&B', 'Service', 'Product');--> statement-breakpoint
CREATE TABLE "invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_name" text NOT NULL,
	"visit_type" "visit_type" NOT NULL,
	"contact_name" text,
	"contact_role" "contact_role",
	"contact_number" text,
	"status" "invitation_status" DEFAULT 'Pending Review' NOT NULL,
	"visit_datetime" timestamp with time zone,
	"compensation" text,
	"remarks" text,
	"raw_text_backup" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
