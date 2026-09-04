CREATE TYPE "public"."auth_type" AS ENUM('pre', 'dcr', 'cimd');--> statement-breakpoint
CREATE TYPE "public"."flow_kind" AS ENUM('login', 'connect');--> statement-breakpoint
CREATE TABLE "mcp_client_registrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"connection_id" uuid NOT NULL,
	"client_id" text NOT NULL,
	"client_secret_enc" text,
	"metadata_document_url" text,
	"raw" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "mcp_client_registrations_connection_id_unique" UNIQUE("connection_id")
);
--> statement-breakpoint
CREATE TABLE "mcp_connections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"auth_type" "auth_type" NOT NULL,
	"resource_url" text NOT NULL,
	"issuer" text NOT NULL,
	"authorization_endpoint" text NOT NULL,
	"token_endpoint" text NOT NULL,
	"scopes" text DEFAULT 'mcp:tools' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mcp_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"connection_id" uuid NOT NULL,
	"access_token_enc" text NOT NULL,
	"refresh_token_enc" text,
	"expires_at" timestamp with time zone NOT NULL,
	"scope" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "mcp_tokens_connection_id_unique" UNIQUE("connection_id")
);
--> statement-breakpoint
CREATE TABLE "oauth_flows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"state" text NOT NULL,
	"kind" "flow_kind" NOT NULL,
	"user_id" uuid,
	"code_verifier" text NOT NULL,
	"resource" text NOT NULL,
	"redirect_uri" text NOT NULL,
	"payload" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	CONSTRAINT "oauth_flows_state_unique" UNIQUE("state")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subject" text NOT NULL,
	"email" text NOT NULL,
	"student_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_subject_unique" UNIQUE("subject")
);
--> statement-breakpoint
ALTER TABLE "mcp_client_registrations" ADD CONSTRAINT "mcp_client_registrations_connection_id_mcp_connections_id_fk" FOREIGN KEY ("connection_id") REFERENCES "public"."mcp_connections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mcp_connections" ADD CONSTRAINT "mcp_connections_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mcp_tokens" ADD CONSTRAINT "mcp_tokens_connection_id_mcp_connections_id_fk" FOREIGN KEY ("connection_id") REFERENCES "public"."mcp_connections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oauth_flows" ADD CONSTRAINT "oauth_flows_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "mcp_connections_user_idx" ON "mcp_connections" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "mcp_connections_user_resource_uq" ON "mcp_connections" USING btree ("user_id","resource_url");--> statement-breakpoint
CREATE INDEX "oauth_flows_state_idx" ON "oauth_flows" USING btree ("state");