CREATE TABLE "todos" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "todos_title_not_blank" CHECK (length(trim("title")) > 0)
);
--> statement-breakpoint
CREATE INDEX "todos_user_id_created_at_idx" ON "todos" ("user_id","created_at");--> statement-breakpoint
ALTER TABLE "todos" ADD CONSTRAINT "todos_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;