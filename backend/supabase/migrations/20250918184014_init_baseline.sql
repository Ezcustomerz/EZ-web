revoke delete on table "public"."calendar_settings" from "anon";

revoke insert on table "public"."calendar_settings" from "anon";

revoke references on table "public"."calendar_settings" from "anon";

revoke select on table "public"."calendar_settings" from "anon";

revoke trigger on table "public"."calendar_settings" from "anon";

revoke truncate on table "public"."calendar_settings" from "anon";

revoke update on table "public"."calendar_settings" from "anon";

revoke delete on table "public"."calendar_settings" from "authenticated";

revoke insert on table "public"."calendar_settings" from "authenticated";

revoke references on table "public"."calendar_settings" from "authenticated";

revoke select on table "public"."calendar_settings" from "authenticated";

revoke trigger on table "public"."calendar_settings" from "authenticated";

revoke truncate on table "public"."calendar_settings" from "authenticated";

revoke update on table "public"."calendar_settings" from "authenticated";

revoke delete on table "public"."calendar_settings" from "service_role";

revoke insert on table "public"."calendar_settings" from "service_role";

revoke references on table "public"."calendar_settings" from "service_role";

revoke select on table "public"."calendar_settings" from "service_role";

revoke trigger on table "public"."calendar_settings" from "service_role";

revoke truncate on table "public"."calendar_settings" from "service_role";

revoke update on table "public"."calendar_settings" from "service_role";

revoke delete on table "public"."time_blocks" from "anon";

revoke insert on table "public"."time_blocks" from "anon";

revoke references on table "public"."time_blocks" from "anon";

revoke select on table "public"."time_blocks" from "anon";

revoke trigger on table "public"."time_blocks" from "anon";

revoke truncate on table "public"."time_blocks" from "anon";

revoke update on table "public"."time_blocks" from "anon";

revoke delete on table "public"."time_blocks" from "authenticated";

revoke insert on table "public"."time_blocks" from "authenticated";

revoke references on table "public"."time_blocks" from "authenticated";

revoke select on table "public"."time_blocks" from "authenticated";

revoke trigger on table "public"."time_blocks" from "authenticated";

revoke truncate on table "public"."time_blocks" from "authenticated";

revoke update on table "public"."time_blocks" from "authenticated";

revoke delete on table "public"."time_blocks" from "service_role";

revoke insert on table "public"."time_blocks" from "service_role";

revoke references on table "public"."time_blocks" from "service_role";

revoke select on table "public"."time_blocks" from "service_role";

revoke trigger on table "public"."time_blocks" from "service_role";

revoke truncate on table "public"."time_blocks" from "service_role";

revoke update on table "public"."time_blocks" from "service_role";

revoke delete on table "public"."time_slots" from "anon";

revoke insert on table "public"."time_slots" from "anon";

revoke references on table "public"."time_slots" from "anon";

revoke select on table "public"."time_slots" from "anon";

revoke trigger on table "public"."time_slots" from "anon";

revoke truncate on table "public"."time_slots" from "anon";

revoke update on table "public"."time_slots" from "anon";

revoke delete on table "public"."time_slots" from "authenticated";

revoke insert on table "public"."time_slots" from "authenticated";

revoke references on table "public"."time_slots" from "authenticated";

revoke select on table "public"."time_slots" from "authenticated";

revoke trigger on table "public"."time_slots" from "authenticated";

revoke truncate on table "public"."time_slots" from "authenticated";

revoke update on table "public"."time_slots" from "authenticated";

revoke delete on table "public"."time_slots" from "service_role";

revoke insert on table "public"."time_slots" from "service_role";

revoke references on table "public"."time_slots" from "service_role";

revoke select on table "public"."time_slots" from "service_role";

revoke trigger on table "public"."time_slots" from "service_role";

revoke truncate on table "public"."time_slots" from "service_role";

revoke update on table "public"."time_slots" from "service_role";

revoke delete on table "public"."weekly_schedule" from "anon";

revoke insert on table "public"."weekly_schedule" from "anon";

revoke references on table "public"."weekly_schedule" from "anon";

revoke select on table "public"."weekly_schedule" from "anon";

revoke trigger on table "public"."weekly_schedule" from "anon";

revoke truncate on table "public"."weekly_schedule" from "anon";

revoke update on table "public"."weekly_schedule" from "anon";

revoke delete on table "public"."weekly_schedule" from "authenticated";

revoke insert on table "public"."weekly_schedule" from "authenticated";

revoke references on table "public"."weekly_schedule" from "authenticated";

revoke select on table "public"."weekly_schedule" from "authenticated";

revoke trigger on table "public"."weekly_schedule" from "authenticated";

revoke truncate on table "public"."weekly_schedule" from "authenticated";

revoke update on table "public"."weekly_schedule" from "authenticated";

revoke delete on table "public"."weekly_schedule" from "service_role";

revoke insert on table "public"."weekly_schedule" from "service_role";

revoke references on table "public"."weekly_schedule" from "service_role";

revoke select on table "public"."weekly_schedule" from "service_role";

revoke trigger on table "public"."weekly_schedule" from "service_role";

revoke truncate on table "public"."weekly_schedule" from "service_role";

revoke update on table "public"."weekly_schedule" from "service_role";

alter table "public"."creatives" add column "availability_location" text default ''::text;

alter table "public"."creatives" add column "average_response_hours" integer default 0;

alter table "public"."creatives" add column "description" text;

alter table "public"."creatives" add column "experience_years" integer default 0;

alter table "public"."creatives" add column "projects_count" integer default 0;

alter table "public"."creatives" add constraint "creatives_description_length_check" CHECK ((length(description) <= 500)) not valid;

alter table "public"."creatives" validate constraint "creatives_description_length_check";

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


