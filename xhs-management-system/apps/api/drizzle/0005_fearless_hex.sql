CREATE TYPE "public"."content_ai_message_role" AS ENUM('user', 'assistant');--> statement-breakpoint
CREATE TABLE "content_ai_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"role" "content_ai_message_role" NOT NULL,
	"message" text NOT NULL,
	"generated_title" text,
	"generated_body" text,
	"generated_tags" jsonb,
	"change_summary" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_ai_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"content_id" uuid NOT NULL,
	"invitation_id" uuid NOT NULL,
	"overview" text NOT NULL,
	"assistant_config_snapshot" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_assistant_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"language" text NOT NULL,
	"tone" text NOT NULL,
	"min_words" integer NOT NULL,
	"max_words" integer NOT NULL,
	"banned_words" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"output_prompt" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invitation_id" uuid NOT NULL,
	"title" text DEFAULT '' NOT NULL,
	"body" text DEFAULT '' NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "contents_invitation_id_unique" UNIQUE("invitation_id")
);
--> statement-breakpoint
ALTER TABLE "content_ai_messages" ADD CONSTRAINT "content_ai_messages_session_id_content_ai_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."content_ai_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_ai_sessions" ADD CONSTRAINT "content_ai_sessions_content_id_contents_id_fk" FOREIGN KEY ("content_id") REFERENCES "public"."contents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_ai_sessions" ADD CONSTRAINT "content_ai_sessions_invitation_id_invitations_id_fk" FOREIGN KEY ("invitation_id") REFERENCES "public"."invitations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contents" ADD CONSTRAINT "contents_invitation_id_invitations_id_fk" FOREIGN KEY ("invitation_id") REFERENCES "public"."invitations"("id") ON DELETE cascade ON UPDATE no action;