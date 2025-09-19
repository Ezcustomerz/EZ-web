alter table "public"."creatives" drop column "average_response_hours";

alter table "public"."creatives" drop column "experience_years";

alter table "public"."creatives" drop column "projects_count";

alter table "public"."creatives" add column "avatar_background_color" text default '#3B82F6'::text;

alter table "public"."creatives" add column "primary_service_id" uuid;

alter table "public"."creatives" add column "profile_highlight_values" jsonb default '{}'::jsonb;

alter table "public"."creatives" add column "profile_highlights" jsonb default '[]'::jsonb;

alter table "public"."creatives" add column "secondary_service_id" uuid;

CREATE INDEX idx_creatives_primary_service_id ON public.creatives USING btree (primary_service_id);

CREATE INDEX idx_creatives_secondary_service_id ON public.creatives USING btree (secondary_service_id);

alter table "public"."creatives" add constraint "creatives_avatar_background_color_check" CHECK ((avatar_background_color ~ '^#[0-9A-Fa-f]{6}$'::text)) not valid;

alter table "public"."creatives" validate constraint "creatives_avatar_background_color_check";

alter table "public"."creatives" add constraint "creatives_primary_service_id_fkey" FOREIGN KEY (primary_service_id) REFERENCES creative_services(id) ON DELETE SET NULL not valid;

alter table "public"."creatives" validate constraint "creatives_primary_service_id_fkey";

alter table "public"."creatives" add constraint "creatives_secondary_service_id_fkey" FOREIGN KEY (secondary_service_id) REFERENCES creative_services(id) ON DELETE SET NULL not valid;

alter table "public"."creatives" validate constraint "creatives_secondary_service_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.handle_auth_user_delete()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Delete from role-specific tables first (due to foreign key constraints)
  DELETE FROM public.creatives WHERE user_id = OLD.id;
  DELETE FROM public.clients WHERE user_id = OLD.id;
  DELETE FROM public.advocates WHERE user_id = OLD.id;
  
  -- Delete from public.users table
  DELETE FROM public.users WHERE user_id = OLD.id;
  
  RETURN OLD;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Use INSERT ... ON CONFLICT DO NOTHING to prevent duplicates
  INSERT INTO public.users (
    user_id,
    name,
    email,
    profile_picture_url,
    avatar_source,
    roles,
    first_login,
    last_login_at,
    created_at
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url',
    'google',
    ARRAY['client'::text], -- Default role
    true, -- First login flag
    NOW(),
    NEW.created_at
  )
  ON CONFLICT (user_id) DO NOTHING; -- Ignore if user already exists
  
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.track_user_login()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Update last_login_at for the current authenticated user
  UPDATE public.users 
  SET last_login_at = NOW()
  WHERE user_id = auth.uid();
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_creative_client_relationships_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$
;


