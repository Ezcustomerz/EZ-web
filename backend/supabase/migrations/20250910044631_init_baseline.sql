revoke delete on table "public"."advocates" from "anon";

revoke insert on table "public"."advocates" from "anon";

revoke references on table "public"."advocates" from "anon";

revoke select on table "public"."advocates" from "anon";

revoke trigger on table "public"."advocates" from "anon";

revoke truncate on table "public"."advocates" from "anon";

revoke update on table "public"."advocates" from "anon";

revoke delete on table "public"."advocates" from "authenticated";

revoke insert on table "public"."advocates" from "authenticated";

revoke references on table "public"."advocates" from "authenticated";

revoke select on table "public"."advocates" from "authenticated";

revoke trigger on table "public"."advocates" from "authenticated";

revoke truncate on table "public"."advocates" from "authenticated";

revoke update on table "public"."advocates" from "authenticated";

revoke delete on table "public"."advocates" from "service_role";

revoke insert on table "public"."advocates" from "service_role";

revoke references on table "public"."advocates" from "service_role";

revoke select on table "public"."advocates" from "service_role";

revoke trigger on table "public"."advocates" from "service_role";

revoke truncate on table "public"."advocates" from "service_role";

revoke update on table "public"."advocates" from "service_role";

revoke delete on table "public"."clients" from "anon";

revoke insert on table "public"."clients" from "anon";

revoke references on table "public"."clients" from "anon";

revoke select on table "public"."clients" from "anon";

revoke trigger on table "public"."clients" from "anon";

revoke truncate on table "public"."clients" from "anon";

revoke update on table "public"."clients" from "anon";

revoke delete on table "public"."clients" from "authenticated";

revoke insert on table "public"."clients" from "authenticated";

revoke references on table "public"."clients" from "authenticated";

revoke select on table "public"."clients" from "authenticated";

revoke trigger on table "public"."clients" from "authenticated";

revoke truncate on table "public"."clients" from "authenticated";

revoke update on table "public"."clients" from "authenticated";

revoke delete on table "public"."clients" from "service_role";

revoke insert on table "public"."clients" from "service_role";

revoke references on table "public"."clients" from "service_role";

revoke select on table "public"."clients" from "service_role";

revoke trigger on table "public"."clients" from "service_role";

revoke truncate on table "public"."clients" from "service_role";

revoke update on table "public"."clients" from "service_role";

revoke delete on table "public"."creatives" from "anon";

revoke insert on table "public"."creatives" from "anon";

revoke references on table "public"."creatives" from "anon";

revoke select on table "public"."creatives" from "anon";

revoke trigger on table "public"."creatives" from "anon";

revoke truncate on table "public"."creatives" from "anon";

revoke update on table "public"."creatives" from "anon";

revoke delete on table "public"."creatives" from "authenticated";

revoke insert on table "public"."creatives" from "authenticated";

revoke references on table "public"."creatives" from "authenticated";

revoke select on table "public"."creatives" from "authenticated";

revoke trigger on table "public"."creatives" from "authenticated";

revoke truncate on table "public"."creatives" from "authenticated";

revoke update on table "public"."creatives" from "authenticated";

revoke delete on table "public"."creatives" from "service_role";

revoke insert on table "public"."creatives" from "service_role";

revoke references on table "public"."creatives" from "service_role";

revoke select on table "public"."creatives" from "service_role";

revoke trigger on table "public"."creatives" from "service_role";

revoke truncate on table "public"."creatives" from "service_role";

revoke update on table "public"."creatives" from "service_role";

revoke delete on table "public"."users" from "anon";

revoke insert on table "public"."users" from "anon";

revoke references on table "public"."users" from "anon";

revoke select on table "public"."users" from "anon";

revoke trigger on table "public"."users" from "anon";

revoke truncate on table "public"."users" from "anon";

revoke update on table "public"."users" from "anon";

revoke delete on table "public"."users" from "authenticated";

revoke insert on table "public"."users" from "authenticated";

revoke references on table "public"."users" from "authenticated";

revoke select on table "public"."users" from "authenticated";

revoke trigger on table "public"."users" from "authenticated";

revoke truncate on table "public"."users" from "authenticated";

revoke update on table "public"."users" from "authenticated";

revoke delete on table "public"."users" from "service_role";

revoke insert on table "public"."users" from "service_role";

revoke references on table "public"."users" from "service_role";

revoke select on table "public"."users" from "service_role";

revoke trigger on table "public"."users" from "service_role";

revoke truncate on table "public"."users" from "service_role";

revoke update on table "public"."users" from "service_role";

alter table "public"."advocates" add column "display_name" text;

alter table "public"."advocates" add column "profile_banner_url" text;

alter table "public"."advocates" add column "profile_source" avatar_source_enum default 'google'::avatar_source_enum;

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


