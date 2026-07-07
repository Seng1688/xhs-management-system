ALTER TABLE "joiner" DROP CONSTRAINT "joiner_name_unique";--> statement-breakpoint
ALTER TABLE "joiner" ALTER COLUMN "name" SET DATA TYPE text;--> statement-breakpoint
UPDATE "joiner" SET "email" = lower(trim("email")) WHERE "email" IS NOT NULL;--> statement-breakpoint
ALTER TABLE "joiner" ALTER COLUMN "email" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "joiner" ADD COLUMN "created_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "joiner" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "joiner" ADD CONSTRAINT "joiner_email_unique" UNIQUE("email");--> statement-breakpoint
DROP TYPE "public"."joiner_name";
