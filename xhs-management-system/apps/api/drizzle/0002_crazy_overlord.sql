CREATE TYPE "public"."joiner_name" AS ENUM('妈妈', '哥哥', '姐姐', '恩恩', 'Sam');--> statement-breakpoint
CREATE TABLE "invitation_joiners" (
	"invitation_id" uuid NOT NULL,
	"joiner_id" uuid NOT NULL,
	CONSTRAINT "invitation_joiners_invitation_id_joiner_id_pk" PRIMARY KEY("invitation_id","joiner_id")
);
--> statement-breakpoint
CREATE TABLE "joiner" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" "joiner_name" NOT NULL,
	CONSTRAINT "joiner_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "invitations" ADD COLUMN "address" text;--> statement-breakpoint
ALTER TABLE "invitation_joiners" ADD CONSTRAINT "invitation_joiners_invitation_id_invitations_id_fk" FOREIGN KEY ("invitation_id") REFERENCES "public"."invitations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation_joiners" ADD CONSTRAINT "invitation_joiners_joiner_id_joiner_id_fk" FOREIGN KEY ("joiner_id") REFERENCES "public"."joiner"("id") ON DELETE cascade ON UPDATE no action;