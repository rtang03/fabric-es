DROP TABLE IF EXISTS "public"."users" CASCADE;
DROP TABLE IF EXISTS "public"."api_key" CASCADE;
DROP TABLE IF EXISTS "public"."oauth_clients" CASCADE;

CREATE TABLE IF NOT EXISTS "api_key" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "api_key" text NOT NULL, "client_id" text NOT NULL, "scope" text, CONSTRAINT "PK_b1bd840641b8acbaad89c3d8d11" PRIMARY KEY ("id"));
CREATE TABLE IF NOT EXISTS "oauth_clients" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "application_name" text NOT NULL, "client_secret" text NOT NULL, "redirect_uris" text, "grants" text, "user_id" text, "is_system_app" boolean NOT NULL, CONSTRAINT "PK_c4759172d3431bae6f04e678e0d" PRIMARY KEY ("id"));
CREATE TABLE IF NOT EXISTS "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" text NOT NULL, "username" text, "password" text NOT NULL, "is_admin" boolean NOT NULL, "is_deleted" boolean, CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"));
