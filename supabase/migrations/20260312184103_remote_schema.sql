


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."account_status" AS ENUM (
    'active',
    'banned',
    'suspended'
);


ALTER TYPE "public"."account_status" OWNER TO "postgres";


CREATE TYPE "public"."admin_action" AS ENUM (
    'BAN',
    'SUSPEND',
    'UNBAN',
    'DELETE_CONTENT',
    'ROLE_CHANGE'
);


ALTER TYPE "public"."admin_action" OWNER TO "postgres";


CREATE TYPE "public"."asset_type" AS ENUM (
    'product',
    'logo'
);


ALTER TYPE "public"."asset_type" OWNER TO "postgres";


CREATE TYPE "public"."difficulty_level" AS ENUM (
    'BEGINNER',
    'INTERMEDIATE',
    'ADVANCED',
    'MASTER',
    'FUNDAMENTALS'
);


ALTER TYPE "public"."difficulty_level" OWNER TO "postgres";


CREATE TYPE "public"."generation_status" AS ENUM (
    'pending',
    'processing',
    'completed',
    'failed'
);


ALTER TYPE "public"."generation_status" OWNER TO "postgres";


CREATE TYPE "public"."presence_status" AS ENUM (
    'ONLINE',
    'OFFLINE',
    'BUSY'
);


ALTER TYPE "public"."presence_status" OWNER TO "postgres";


CREATE TYPE "public"."subscription_tier" AS ENUM (
    'free',
    'pro',
    'ultra'
);


ALTER TYPE "public"."subscription_tier" OWNER TO "postgres";


CREATE TYPE "public"."ticket_priority" AS ENUM (
    'low',
    'medium',
    'high'
);


ALTER TYPE "public"."ticket_priority" OWNER TO "postgres";


CREATE TYPE "public"."ticket_status" AS ENUM (
    'open',
    'underreview',
    'in_progress',
    'resolved',
    'closed'
);


ALTER TYPE "public"."ticket_status" OWNER TO "postgres";


CREATE TYPE "public"."user_role" AS ENUM (
    'member',
    'premium',
    'moderator',
    'admin'
);


ALTER TYPE "public"."user_role" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_unread_count"("user_uuid" "uuid") RETURNS bigint
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  select count(*) from public.notifications where user_id = user_uuid and is_read = false;
$$;


ALTER FUNCTION "public"."get_unread_count"("user_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_email_by_username"("lookup_username" "text") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    found_email TEXT;
BEGIN
    SELECT email INTO found_email FROM public.profiles WHERE username = lookup_username LIMIT 1;
    RETURN found_email;
END;
$$;


ALTER FUNCTION "public"."get_user_email_by_username"("lookup_username" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username, full_name)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'full_name'
  ) ON CONFLICT (id) DO NOTHING;
  
  INSERT INTO public.user_stats (user_id) VALUES (new.id) ON CONFLICT DO NOTHING;
  INSERT INTO public.subscriptions (user_id, tier) VALUES (new.id, 'free') ON CONFLICT DO NOTHING;
  
  RETURN new;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rls_auto_enable"() RETURNS "event_trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog'
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."rls_auto_enable"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_set_timestamp"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;


ALTER FUNCTION "public"."trigger_set_timestamp"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."ai_generations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "mockup_id" "uuid",
    "prompt" "text",
    "engine_model" "text" NOT NULL,
    "cost_credits" integer NOT NULL,
    "compute_time_ms" integer,
    "status" "public"."generation_status" DEFAULT 'processing'::"public"."generation_status" NOT NULL,
    "error_log" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."ai_generations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."assets" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "type" "public"."asset_type" NOT NULL,
    "storage_path" "text" NOT NULL,
    "width" integer,
    "height" integer,
    "is_public" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."assets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."badges" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text" NOT NULL,
    "icon_url" "text" NOT NULL,
    "xp_bonus" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."badges" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mockups" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "product_id" "uuid",
    "logo_id" "uuid",
    "prompt" "text",
    "status" "public"."generation_status" DEFAULT 'pending'::"public"."generation_status" NOT NULL,
    "storage_path" "text",
    "high_res_path" "text",
    "canvas_state" "jsonb" DEFAULT '{"layers": [], "settings": {"showGrid": true, "snapToEdge": true}, "viewport": {"x": 0, "y": 0, "zoom": 1}}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "is_public" boolean DEFAULT false NOT NULL,
    "views" integer DEFAULT 0 NOT NULL,
    "likes" integer DEFAULT 0 NOT NULL,
    "title" "text" DEFAULT 'Untitled Mockup'::"text" NOT NULL,
    "thumbnail_path" "text"
);


ALTER TABLE "public"."mockups" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "message" "text" NOT NULL,
    "type" "text" DEFAULT 'info'::"text",
    "is_read" boolean DEFAULT false NOT NULL,
    "action_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "full_name" "text",
    "avatar_url" "text",
    "credits" integer DEFAULT 10 NOT NULL,
    "brand_palette" "jsonb" DEFAULT '{"accent": "#B026FF", "primary": "#0A0D14"}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "role" "public"."user_role" DEFAULT 'member'::"public"."user_role" NOT NULL,
    "username" "text" NOT NULL,
    "banned_until" timestamp with time zone,
    "preferences" "jsonb" DEFAULT '{"theme": "dark", "notifications": true}'::"jsonb",
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "total_renders" integer DEFAULT 0 NOT NULL
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."studio_assets" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "name" "text" NOT NULL,
    "storage_path" "text" NOT NULL,
    "type" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "is_public" boolean DEFAULT false NOT NULL,
    CONSTRAINT "studio_assets_type_check" CHECK (("type" = ANY (ARRAY['LOGO'::"text", 'BASE'::"text", 'COMPOSITION'::"text"])))
);


ALTER TABLE "public"."studio_assets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."subscriptions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "tier" "public"."subscription_tier" DEFAULT 'free'::"public"."subscription_tier" NOT NULL,
    "status" "text",
    "current_period_end" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."subscriptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ticket_messages" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "ticket_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "message" "text" NOT NULL,
    "is_internal" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."ticket_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tickets" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "subject" "text" NOT NULL,
    "category" "text" NOT NULL,
    "status" "public"."ticket_status" DEFAULT 'open'::"public"."ticket_status" NOT NULL,
    "priority" "public"."ticket_priority" DEFAULT 'medium'::"public"."ticket_priority" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."tickets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_badges" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "badge_id" "text" NOT NULL,
    "awarded_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_badges" OWNER TO "postgres";


ALTER TABLE ONLY "public"."ai_generations"
    ADD CONSTRAINT "ai_generations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."assets"
    ADD CONSTRAINT "assets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."badges"
    ADD CONSTRAINT "badges_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mockups"
    ADD CONSTRAINT "mockups_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_username_key" UNIQUE ("username");



ALTER TABLE ONLY "public"."studio_assets"
    ADD CONSTRAINT "studio_assets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."ticket_messages"
    ADD CONSTRAINT "ticket_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tickets"
    ADD CONSTRAINT "tickets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_badges"
    ADD CONSTRAINT "user_badges_pkey" PRIMARY KEY ("id");



CREATE OR REPLACE TRIGGER "on_mockups_updated" BEFORE UPDATE ON "public"."mockups" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "on_profiles_updated" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "on_subscriptions_updated" BEFORE UPDATE ON "public"."subscriptions" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "set_timestamp_mockups" BEFORE UPDATE ON "public"."mockups" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_set_timestamp"();



CREATE OR REPLACE TRIGGER "set_timestamp_profiles" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_set_timestamp"();



CREATE OR REPLACE TRIGGER "set_timestamp_subscriptions" BEFORE UPDATE ON "public"."subscriptions" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_set_timestamp"();



CREATE OR REPLACE TRIGGER "set_timestamp_tickets" BEFORE UPDATE ON "public"."tickets" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_set_timestamp"();



ALTER TABLE ONLY "public"."ai_generations"
    ADD CONSTRAINT "ai_generations_mockup_id_fkey" FOREIGN KEY ("mockup_id") REFERENCES "public"."mockups"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_generations"
    ADD CONSTRAINT "ai_generations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."assets"
    ADD CONSTRAINT "assets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mockups"
    ADD CONSTRAINT "mockups_logo_id_fkey" FOREIGN KEY ("logo_id") REFERENCES "public"."assets"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."mockups"
    ADD CONSTRAINT "mockups_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."assets"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."mockups"
    ADD CONSTRAINT "mockups_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."studio_assets"
    ADD CONSTRAINT "studio_assets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ticket_messages"
    ADD CONSTRAINT "ticket_messages_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ticket_messages"
    ADD CONSTRAINT "ticket_messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tickets"
    ADD CONSTRAINT "tickets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_badges"
    ADD CONSTRAINT "user_badges_badge_id_fkey" FOREIGN KEY ("badge_id") REFERENCES "public"."badges"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_badges"
    ADD CONSTRAINT "user_badges_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



CREATE POLICY "AI Logs visibility" ON "public"."ai_generations" FOR SELECT USING ((("auth"."uid"() = "user_id") OR (( SELECT ("profiles"."role")::"text" AS "role"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())) = 'ADMIN'::"text")));



CREATE POLICY "Asset Ownership" ON "public"."studio_assets" USING ((("auth"."uid"() = "user_id") OR (( SELECT ("profiles"."role")::"text" AS "role"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())) = ANY (ARRAY['ADMIN'::"text", 'MODERATOR'::"text"]))));



CREATE POLICY "Messages insert" ON "public"."ticket_messages" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Messages visibility" ON "public"."ticket_messages" FOR SELECT USING (((("auth"."uid"() IN ( SELECT "tickets"."user_id"
   FROM "public"."tickets"
  WHERE ("tickets"."id" = "ticket_messages"."ticket_id"))) AND ("is_internal" = false)) OR (( SELECT ("profiles"."role")::"text" AS "role"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())) = ANY (ARRAY['ADMIN'::"text", 'MODERATOR'::"text", 'SUPPORT'::"text"]))));



CREATE POLICY "Mockup Editing" ON "public"."mockups" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Mockup Visibility" ON "public"."mockups" FOR SELECT USING ((("auth"."uid"() = "user_id") OR ("is_public" = true) OR (( SELECT ("profiles"."role")::"text" AS "role"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())) = ANY (ARRAY['ADMIN'::"text", 'MODERATOR'::"text"]))));



CREATE POLICY "Public profiles are viewable by everyone" ON "public"."profiles" FOR SELECT USING (true);



CREATE POLICY "Tickets insert" ON "public"."tickets" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Tickets update staff" ON "public"."tickets" FOR UPDATE USING ((( SELECT ("profiles"."role")::"text" AS "role"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())) = ANY (ARRAY['ADMIN'::"text", 'MODERATOR'::"text", 'SUPPORT'::"text"])));



CREATE POLICY "Tickets visibility" ON "public"."tickets" FOR SELECT USING ((("auth"."uid"() = "user_id") OR (( SELECT ("profiles"."role")::"text" AS "role"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())) = ANY (ARRAY['ADMIN'::"text", 'MODERATOR'::"text", 'SUPPORT'::"text"]))));



CREATE POLICY "Users can update own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



ALTER TABLE "public"."ai_generations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."assets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."badges" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."mockups" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."studio_assets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."subscriptions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ticket_messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tickets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_badges" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."get_unread_count"("user_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_unread_count"("user_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_unread_count"("user_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_email_by_username"("lookup_username" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_email_by_username"("lookup_username" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_email_by_username"("lookup_username" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "anon";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_set_timestamp"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_set_timestamp"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_set_timestamp"() TO "service_role";


















GRANT ALL ON TABLE "public"."ai_generations" TO "anon";
GRANT ALL ON TABLE "public"."ai_generations" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_generations" TO "service_role";



GRANT ALL ON TABLE "public"."assets" TO "anon";
GRANT ALL ON TABLE "public"."assets" TO "authenticated";
GRANT ALL ON TABLE "public"."assets" TO "service_role";



GRANT ALL ON TABLE "public"."badges" TO "anon";
GRANT ALL ON TABLE "public"."badges" TO "authenticated";
GRANT ALL ON TABLE "public"."badges" TO "service_role";



GRANT ALL ON TABLE "public"."mockups" TO "anon";
GRANT ALL ON TABLE "public"."mockups" TO "authenticated";
GRANT ALL ON TABLE "public"."mockups" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."studio_assets" TO "anon";
GRANT ALL ON TABLE "public"."studio_assets" TO "authenticated";
GRANT ALL ON TABLE "public"."studio_assets" TO "service_role";



GRANT ALL ON TABLE "public"."subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."subscriptions" TO "service_role";



GRANT ALL ON TABLE "public"."ticket_messages" TO "anon";
GRANT ALL ON TABLE "public"."ticket_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."ticket_messages" TO "service_role";



GRANT ALL ON TABLE "public"."tickets" TO "anon";
GRANT ALL ON TABLE "public"."tickets" TO "authenticated";
GRANT ALL ON TABLE "public"."tickets" TO "service_role";



GRANT ALL ON TABLE "public"."user_badges" TO "anon";
GRANT ALL ON TABLE "public"."user_badges" TO "authenticated";
GRANT ALL ON TABLE "public"."user_badges" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";



































drop extension if exists "pg_net";

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


  create policy "Avatar Owner Upload"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check (((bucket_id = 'avatars'::text) AND (auth.uid() = owner)));



  create policy "Avatar Public View"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'avatars'::text));



  create policy "Avatar Upload"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check (((bucket_id = 'avatars'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



  create policy "Public Access"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'avatars'::text));



  create policy "Users can delete their own assets in storage"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using (((bucket_id = 'user-assets'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));



  create policy "Users can delete their own mockups in storage"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using (((bucket_id = 'generated-mockups'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));



  create policy "Users can upload studio assets"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check (((bucket_id = 'studio-assets'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



  create policy "Users can upload their own assets to storage"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check (((bucket_id = 'user-assets'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));



  create policy "Users can upload their own mockups to storage"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check (((bucket_id = 'generated-mockups'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));



  create policy "Users can view studio assets"
  on "storage"."objects"
  as permissive
  for select
  to public
using (((bucket_id = 'studio-assets'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



  create policy "Users can view their own assets in storage"
  on "storage"."objects"
  as permissive
  for select
  to authenticated
using (((bucket_id = 'user-assets'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));



  create policy "Users can view their own mockups in storage"
  on "storage"."objects"
  as permissive
  for select
  to authenticated
using (((bucket_id = 'generated-mockups'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));



