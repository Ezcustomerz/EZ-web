revoke delete on table "public"."creative_client_relationships" from "anon";

revoke insert on table "public"."creative_client_relationships" from "anon";

revoke references on table "public"."creative_client_relationships" from "anon";

revoke select on table "public"."creative_client_relationships" from "anon";

revoke trigger on table "public"."creative_client_relationships" from "anon";

revoke truncate on table "public"."creative_client_relationships" from "anon";

revoke update on table "public"."creative_client_relationships" from "anon";

revoke delete on table "public"."creative_client_relationships" from "authenticated";

revoke insert on table "public"."creative_client_relationships" from "authenticated";

revoke references on table "public"."creative_client_relationships" from "authenticated";

revoke select on table "public"."creative_client_relationships" from "authenticated";

revoke trigger on table "public"."creative_client_relationships" from "authenticated";

revoke truncate on table "public"."creative_client_relationships" from "authenticated";

revoke update on table "public"."creative_client_relationships" from "authenticated";

revoke delete on table "public"."creative_client_relationships" from "service_role";

revoke insert on table "public"."creative_client_relationships" from "service_role";

revoke references on table "public"."creative_client_relationships" from "service_role";

revoke select on table "public"."creative_client_relationships" from "service_role";

revoke trigger on table "public"."creative_client_relationships" from "service_role";

revoke truncate on table "public"."creative_client_relationships" from "service_role";

revoke update on table "public"."creative_client_relationships" from "service_role";

revoke delete on table "public"."creative_services" from "anon";

revoke insert on table "public"."creative_services" from "anon";

revoke references on table "public"."creative_services" from "anon";

revoke select on table "public"."creative_services" from "anon";

revoke trigger on table "public"."creative_services" from "anon";

revoke truncate on table "public"."creative_services" from "anon";

revoke update on table "public"."creative_services" from "anon";

revoke delete on table "public"."creative_services" from "authenticated";

revoke insert on table "public"."creative_services" from "authenticated";

revoke references on table "public"."creative_services" from "authenticated";

revoke select on table "public"."creative_services" from "authenticated";

revoke trigger on table "public"."creative_services" from "authenticated";

revoke truncate on table "public"."creative_services" from "authenticated";

revoke update on table "public"."creative_services" from "authenticated";

revoke delete on table "public"."creative_services" from "service_role";

revoke insert on table "public"."creative_services" from "service_role";

revoke references on table "public"."creative_services" from "service_role";

revoke select on table "public"."creative_services" from "service_role";

revoke trigger on table "public"."creative_services" from "service_role";

revoke truncate on table "public"."creative_services" from "service_role";

revoke update on table "public"."creative_services" from "service_role";

create table "public"."calendar_settings" (
    "id" uuid not null default gen_random_uuid(),
    "service_id" uuid not null,
    "is_scheduling_enabled" boolean not null default false,
    "use_time_slots" boolean not null default false,
    "session_durations" integer[] not null default ARRAY[60],
    "default_session_length" integer not null default 60,
    "min_notice_amount" integer not null default 24,
    "min_notice_unit" text not null default 'hours'::text,
    "max_advance_amount" integer not null default 30,
    "max_advance_unit" text not null default 'days'::text,
    "buffer_time_amount" integer not null default 15,
    "buffer_time_unit" text not null default 'minutes'::text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "is_active" boolean not null default true
);


alter table "public"."calendar_settings" enable row level security;

create table "public"."time_blocks" (
    "id" uuid not null default gen_random_uuid(),
    "weekly_schedule_id" uuid not null,
    "start_time" time without time zone not null,
    "end_time" time without time zone not null,
    "created_at" timestamp with time zone default now()
);


alter table "public"."time_blocks" enable row level security;

create table "public"."time_slots" (
    "id" uuid not null default gen_random_uuid(),
    "weekly_schedule_id" uuid not null,
    "slot_time" time without time zone not null,
    "is_enabled" boolean not null default true,
    "created_at" timestamp with time zone default now()
);


alter table "public"."time_slots" enable row level security;

create table "public"."weekly_schedule" (
    "id" uuid not null default gen_random_uuid(),
    "calendar_setting_id" uuid not null,
    "day_of_week" text not null,
    "is_enabled" boolean not null default false,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."weekly_schedule" enable row level security;

CREATE UNIQUE INDEX calendar_settings_pkey ON public.calendar_settings USING btree (id);

CREATE INDEX idx_calendar_settings_is_active ON public.calendar_settings USING btree (is_active);

CREATE INDEX idx_calendar_settings_service_active ON public.calendar_settings USING btree (service_id, is_active);

CREATE INDEX idx_calendar_settings_service_id ON public.calendar_settings USING btree (service_id);

CREATE INDEX idx_time_blocks_weekly_schedule_id ON public.time_blocks USING btree (weekly_schedule_id);

CREATE INDEX idx_time_slots_weekly_schedule_id ON public.time_slots USING btree (weekly_schedule_id);

CREATE INDEX idx_weekly_schedule_calendar_setting_id ON public.weekly_schedule USING btree (calendar_setting_id);

CREATE UNIQUE INDEX time_blocks_pkey ON public.time_blocks USING btree (id);

CREATE UNIQUE INDEX time_slots_pkey ON public.time_slots USING btree (id);

CREATE UNIQUE INDEX time_slots_weekly_schedule_id_slot_time_key ON public.time_slots USING btree (weekly_schedule_id, slot_time);

CREATE UNIQUE INDEX weekly_schedule_calendar_setting_id_day_of_week_key ON public.weekly_schedule USING btree (calendar_setting_id, day_of_week);

CREATE UNIQUE INDEX weekly_schedule_pkey ON public.weekly_schedule USING btree (id);

alter table "public"."calendar_settings" add constraint "calendar_settings_pkey" PRIMARY KEY using index "calendar_settings_pkey";

alter table "public"."time_blocks" add constraint "time_blocks_pkey" PRIMARY KEY using index "time_blocks_pkey";

alter table "public"."time_slots" add constraint "time_slots_pkey" PRIMARY KEY using index "time_slots_pkey";

alter table "public"."weekly_schedule" add constraint "weekly_schedule_pkey" PRIMARY KEY using index "weekly_schedule_pkey";

alter table "public"."calendar_settings" add constraint "calendar_settings_buffer_time_unit_check" CHECK ((buffer_time_unit = ANY (ARRAY['minutes'::text, 'hours'::text]))) not valid;

alter table "public"."calendar_settings" validate constraint "calendar_settings_buffer_time_unit_check";

alter table "public"."calendar_settings" add constraint "calendar_settings_max_advance_unit_check" CHECK ((max_advance_unit = ANY (ARRAY['days'::text, 'weeks'::text, 'months'::text]))) not valid;

alter table "public"."calendar_settings" validate constraint "calendar_settings_max_advance_unit_check";

alter table "public"."calendar_settings" add constraint "calendar_settings_min_notice_unit_check" CHECK ((min_notice_unit = ANY (ARRAY['hours'::text, 'days'::text]))) not valid;

alter table "public"."calendar_settings" validate constraint "calendar_settings_min_notice_unit_check";

alter table "public"."calendar_settings" add constraint "calendar_settings_service_id_fkey" FOREIGN KEY (service_id) REFERENCES creative_services(id) ON DELETE CASCADE not valid;

alter table "public"."calendar_settings" validate constraint "calendar_settings_service_id_fkey";

alter table "public"."time_blocks" add constraint "time_blocks_check" CHECK ((start_time < end_time)) not valid;

alter table "public"."time_blocks" validate constraint "time_blocks_check";

alter table "public"."time_blocks" add constraint "time_blocks_weekly_schedule_id_fkey" FOREIGN KEY (weekly_schedule_id) REFERENCES weekly_schedule(id) ON DELETE CASCADE not valid;

alter table "public"."time_blocks" validate constraint "time_blocks_weekly_schedule_id_fkey";

alter table "public"."time_slots" add constraint "time_slots_weekly_schedule_id_fkey" FOREIGN KEY (weekly_schedule_id) REFERENCES weekly_schedule(id) ON DELETE CASCADE not valid;

alter table "public"."time_slots" validate constraint "time_slots_weekly_schedule_id_fkey";

alter table "public"."time_slots" add constraint "time_slots_weekly_schedule_id_slot_time_key" UNIQUE using index "time_slots_weekly_schedule_id_slot_time_key";

alter table "public"."weekly_schedule" add constraint "weekly_schedule_calendar_setting_id_day_of_week_key" UNIQUE using index "weekly_schedule_calendar_setting_id_day_of_week_key";

alter table "public"."weekly_schedule" add constraint "weekly_schedule_calendar_setting_id_fkey" FOREIGN KEY (calendar_setting_id) REFERENCES calendar_settings(id) ON DELETE CASCADE not valid;

alter table "public"."weekly_schedule" validate constraint "weekly_schedule_calendar_setting_id_fkey";

alter table "public"."weekly_schedule" add constraint "weekly_schedule_day_of_week_check" CHECK ((day_of_week = ANY (ARRAY['Monday'::text, 'Tuesday'::text, 'Wednesday'::text, 'Thursday'::text, 'Friday'::text, 'Saturday'::text, 'Sunday'::text]))) not valid;

alter table "public"."weekly_schedule" validate constraint "weekly_schedule_day_of_week_check";

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

create policy "Users can insert calendar settings for their own active service"
on "public"."calendar_settings"
as permissive
for insert
to public
with check ((service_id IN ( SELECT creative_services.id
   FROM creative_services
  WHERE ((creative_services.creative_user_id = auth.uid()) AND (creative_services.is_active = true)))));


create policy "Users can manage calendar settings for their own services"
on "public"."calendar_settings"
as permissive
for delete
to public
using ((service_id IN ( SELECT creative_services.id
   FROM creative_services
  WHERE (creative_services.creative_user_id = auth.uid()))));


create policy "Users can update their own active calendar settings"
on "public"."calendar_settings"
as permissive
for update
to public
using ((service_id IN ( SELECT creative_services.id
   FROM creative_services
  WHERE ((creative_services.creative_user_id = auth.uid()) AND (creative_services.is_active = true)))));


create policy "Users can view active calendar settings for their own services"
on "public"."calendar_settings"
as permissive
for select
to public
using (((is_active = true) AND (service_id IN ( SELECT creative_services.id
   FROM creative_services
  WHERE ((creative_services.creative_user_id = auth.uid()) AND (creative_services.is_active = true))))));


create policy "Users can manage time blocks for their own weekly schedule"
on "public"."time_blocks"
as permissive
for all
to public
using ((weekly_schedule_id IN ( SELECT ws.id
   FROM ((weekly_schedule ws
     JOIN calendar_settings cs ON ((ws.calendar_setting_id = cs.id)))
     JOIN creative_services s ON ((cs.service_id = s.id)))
  WHERE (s.creative_user_id = auth.uid()))));


create policy "Users can manage time slots for their own weekly schedule"
on "public"."time_slots"
as permissive
for all
to public
using ((weekly_schedule_id IN ( SELECT ws.id
   FROM ((weekly_schedule ws
     JOIN calendar_settings cs ON ((ws.calendar_setting_id = cs.id)))
     JOIN creative_services s ON ((cs.service_id = s.id)))
  WHERE (s.creative_user_id = auth.uid()))));


create policy "Users can manage weekly schedule for their own calendar setting"
on "public"."weekly_schedule"
as permissive
for all
to public
using ((calendar_setting_id IN ( SELECT cs.id
   FROM (calendar_settings cs
     JOIN creative_services s ON ((cs.service_id = s.id)))
  WHERE (s.creative_user_id = auth.uid()))));



