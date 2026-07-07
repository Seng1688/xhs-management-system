CREATE TABLE "invitation_reminder_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invitation_id" uuid NOT NULL,
	"reminder_type" text NOT NULL,
	"visit_date" text NOT NULL,
	"sent_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "invitation_reminder_logs_invitation_type_date_unique" UNIQUE("invitation_id","reminder_type","visit_date")
);
--> statement-breakpoint
ALTER TABLE "joiner" ADD COLUMN "email" text;--> statement-breakpoint
ALTER TABLE "invitation_reminder_logs" ADD CONSTRAINT "invitation_reminder_logs_invitation_id_invitations_id_fk" FOREIGN KEY ("invitation_id") REFERENCES "public"."invitations"("id") ON DELETE cascade ON UPDATE no action;