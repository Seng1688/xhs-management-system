CREATE TABLE "ai_analysis_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"invitation_id" uuid,
	"generation_index" integer NOT NULL,
	"raw_text" text NOT NULL,
	"additional_prompt" text,
	"request_payload" jsonb NOT NULL,
	"response_payload" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_analysis_logs" ADD CONSTRAINT "ai_analysis_logs_invitation_id_invitations_id_fk" FOREIGN KEY ("invitation_id") REFERENCES "public"."invitations"("id") ON DELETE set null ON UPDATE no action;