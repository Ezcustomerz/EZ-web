drop trigger if exists "trigger_decrement_availability_on_booking_delete" on "public"."bookings";

drop trigger if exists "trigger_update_availability_on_booking" on "public"."bookings";

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

revoke delete on table "public"."bookings" from "anon";

revoke insert on table "public"."bookings" from "anon";

revoke references on table "public"."bookings" from "anon";

revoke select on table "public"."bookings" from "anon";

revoke trigger on table "public"."bookings" from "anon";

revoke truncate on table "public"."bookings" from "anon";

revoke update on table "public"."bookings" from "anon";

revoke delete on table "public"."bookings" from "authenticated";

revoke insert on table "public"."bookings" from "authenticated";

revoke references on table "public"."bookings" from "authenticated";

revoke select on table "public"."bookings" from "authenticated";

revoke trigger on table "public"."bookings" from "authenticated";

revoke truncate on table "public"."bookings" from "authenticated";

revoke update on table "public"."bookings" from "authenticated";

revoke delete on table "public"."bookings" from "service_role";

revoke insert on table "public"."bookings" from "service_role";

revoke references on table "public"."bookings" from "service_role";

revoke select on table "public"."bookings" from "service_role";

revoke trigger on table "public"."bookings" from "service_role";

revoke truncate on table "public"."bookings" from "service_role";

revoke update on table "public"."bookings" from "service_role";

revoke delete on table "public"."bundle_services" from "anon";

revoke insert on table "public"."bundle_services" from "anon";

revoke references on table "public"."bundle_services" from "anon";

revoke select on table "public"."bundle_services" from "anon";

revoke trigger on table "public"."bundle_services" from "anon";

revoke truncate on table "public"."bundle_services" from "anon";

revoke update on table "public"."bundle_services" from "anon";

revoke delete on table "public"."bundle_services" from "authenticated";

revoke insert on table "public"."bundle_services" from "authenticated";

revoke references on table "public"."bundle_services" from "authenticated";

revoke select on table "public"."bundle_services" from "authenticated";

revoke trigger on table "public"."bundle_services" from "authenticated";

revoke truncate on table "public"."bundle_services" from "authenticated";

revoke update on table "public"."bundle_services" from "authenticated";

revoke delete on table "public"."bundle_services" from "service_role";

revoke insert on table "public"."bundle_services" from "service_role";

revoke references on table "public"."bundle_services" from "service_role";

revoke select on table "public"."bundle_services" from "service_role";

revoke trigger on table "public"."bundle_services" from "service_role";

revoke truncate on table "public"."bundle_services" from "service_role";

revoke update on table "public"."bundle_services" from "service_role";

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

revoke delete on table "public"."creative_bundles" from "anon";

revoke insert on table "public"."creative_bundles" from "anon";

revoke references on table "public"."creative_bundles" from "anon";

revoke select on table "public"."creative_bundles" from "anon";

revoke trigger on table "public"."creative_bundles" from "anon";

revoke truncate on table "public"."creative_bundles" from "anon";

revoke update on table "public"."creative_bundles" from "anon";

revoke delete on table "public"."creative_bundles" from "authenticated";

revoke insert on table "public"."creative_bundles" from "authenticated";

revoke references on table "public"."creative_bundles" from "authenticated";

revoke select on table "public"."creative_bundles" from "authenticated";

revoke trigger on table "public"."creative_bundles" from "authenticated";

revoke truncate on table "public"."creative_bundles" from "authenticated";

revoke update on table "public"."creative_bundles" from "authenticated";

revoke delete on table "public"."creative_bundles" from "service_role";

revoke insert on table "public"."creative_bundles" from "service_role";

revoke references on table "public"."creative_bundles" from "service_role";

revoke select on table "public"."creative_bundles" from "service_role";

revoke trigger on table "public"."creative_bundles" from "service_role";

revoke truncate on table "public"."creative_bundles" from "service_role";

revoke update on table "public"."creative_bundles" from "service_role";

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

revoke delete on table "public"."service_photos" from "anon";

revoke insert on table "public"."service_photos" from "anon";

revoke references on table "public"."service_photos" from "anon";

revoke select on table "public"."service_photos" from "anon";

revoke trigger on table "public"."service_photos" from "anon";

revoke truncate on table "public"."service_photos" from "anon";

revoke update on table "public"."service_photos" from "anon";

revoke delete on table "public"."service_photos" from "authenticated";

revoke insert on table "public"."service_photos" from "authenticated";

revoke references on table "public"."service_photos" from "authenticated";

revoke select on table "public"."service_photos" from "authenticated";

revoke trigger on table "public"."service_photos" from "authenticated";

revoke truncate on table "public"."service_photos" from "authenticated";

revoke update on table "public"."service_photos" from "authenticated";

revoke delete on table "public"."service_photos" from "service_role";

revoke insert on table "public"."service_photos" from "service_role";

revoke references on table "public"."service_photos" from "service_role";

revoke select on table "public"."service_photos" from "service_role";

revoke trigger on table "public"."service_photos" from "service_role";

revoke truncate on table "public"."service_photos" from "service_role";

revoke update on table "public"."service_photos" from "service_role";

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

alter table "public"."bookings" drop constraint "bookings_client_status_check";

alter table "public"."bookings" drop constraint "bookings_creative_status_check";

drop function if exists "public"."decrement_booking_availability_count"();

drop function if exists "public"."update_booking_availability_count"();

create table "public"."notifications" (
    "id" uuid not null default gen_random_uuid(),
    "recipient_user_id" uuid not null,
    "notification_type" text not null,
    "title" text not null,
    "message" text not null,
    "is_read" boolean not null default false,
    "related_user_id" uuid,
    "related_entity_id" uuid,
    "related_entity_type" text,
    "metadata" jsonb default '{}'::jsonb,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "target_roles" text[] default ARRAY['creative'::text, 'client'::text]
);


alter table "public"."notifications" enable row level security;

create table "public"."subscription_tiers" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "price" numeric(10,2) not null,
    "storage_amount_bytes" bigint not null,
    "description" text,
    "fee_percentage" numeric(5,2) not null,
    "is_active" boolean not null default true,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."subscription_tiers" enable row level security;

alter table "public"."bookings" add column "approved_at" timestamp with time zone;

alter table "public"."creatives" drop column "storage_limit_bytes";

alter table "public"."creatives" drop column "subscription_tier";

alter table "public"."creatives" add column "subscription_tier_id" uuid not null default 'c8bb6885-4547-4b85-820f-cd59013e3d2a'::uuid;

CREATE INDEX idx_notifications_created_at ON public.notifications USING btree (created_at DESC);

CREATE INDEX idx_notifications_is_read ON public.notifications USING btree (recipient_user_id, is_read);

CREATE INDEX idx_notifications_recipient_roles ON public.notifications USING btree (recipient_user_id, target_roles);

CREATE INDEX idx_notifications_recipient_unread_roles ON public.notifications USING btree (recipient_user_id, is_read) WHERE (is_read = false);

CREATE INDEX idx_notifications_recipient_user_id ON public.notifications USING btree (recipient_user_id);

CREATE INDEX idx_notifications_target_roles_gin ON public.notifications USING gin (target_roles);

CREATE INDEX idx_notifications_type ON public.notifications USING btree (notification_type);

CREATE UNIQUE INDEX notifications_pkey ON public.notifications USING btree (id);

CREATE UNIQUE INDEX subscription_tiers_name_key ON public.subscription_tiers USING btree (name);

CREATE UNIQUE INDEX subscription_tiers_pkey ON public.subscription_tiers USING btree (id);

alter table "public"."notifications" add constraint "notifications_pkey" PRIMARY KEY using index "notifications_pkey";

alter table "public"."subscription_tiers" add constraint "subscription_tiers_pkey" PRIMARY KEY using index "subscription_tiers_pkey";

alter table "public"."creatives" add constraint "creatives_subscription_tier_id_fkey" FOREIGN KEY (subscription_tier_id) REFERENCES subscription_tiers(id) not valid;

alter table "public"."creatives" validate constraint "creatives_subscription_tier_id_fkey";

alter table "public"."notifications" add constraint "notifications_entity_type_check" CHECK (((related_entity_type IS NULL) OR (related_entity_type = ANY (ARRAY['booking'::text, 'relationship'::text, 'service'::text])))) not valid;

alter table "public"."notifications" validate constraint "notifications_entity_type_check";

alter table "public"."notifications" add constraint "notifications_recipient_user_id_fkey" FOREIGN KEY (recipient_user_id) REFERENCES users(user_id) ON DELETE CASCADE not valid;

alter table "public"."notifications" validate constraint "notifications_recipient_user_id_fkey";

alter table "public"."notifications" add constraint "notifications_related_user_id_fkey" FOREIGN KEY (related_user_id) REFERENCES users(user_id) ON DELETE SET NULL not valid;

alter table "public"."notifications" validate constraint "notifications_related_user_id_fkey";

alter table "public"."notifications" add constraint "notifications_type_check" CHECK ((notification_type = ANY (ARRAY['new_client_added'::text, 'booking_created'::text, 'booking_placed'::text, 'booking_approved'::text, 'booking_rejected'::text, 'payment_received'::text, 'payment_required'::text, 'session_completed'::text, 'review_submitted'::text]))) not valid;

alter table "public"."notifications" validate constraint "notifications_type_check";

alter table "public"."subscription_tiers" add constraint "subscription_tiers_fee_percentage_check" CHECK (((fee_percentage >= (0)::numeric) AND (fee_percentage <= (100)::numeric))) not valid;

alter table "public"."subscription_tiers" validate constraint "subscription_tiers_fee_percentage_check";

alter table "public"."subscription_tiers" add constraint "subscription_tiers_name_key" UNIQUE using index "subscription_tiers_name_key";

alter table "public"."subscription_tiers" add constraint "subscription_tiers_price_check" CHECK ((price >= (0)::numeric)) not valid;

alter table "public"."subscription_tiers" validate constraint "subscription_tiers_price_check";

alter table "public"."subscription_tiers" add constraint "subscription_tiers_storage_amount_bytes_check" CHECK ((storage_amount_bytes >= 0)) not valid;

alter table "public"."subscription_tiers" validate constraint "subscription_tiers_storage_amount_bytes_check";

alter table "public"."bookings" add constraint "bookings_client_status_check" CHECK ((client_status = ANY (ARRAY['placed'::text, 'confirmed'::text, 'payment_required'::text, 'in_progress'::text, 'completed'::text, 'cancelled'::text]))) not valid;

alter table "public"."bookings" validate constraint "bookings_client_status_check";

alter table "public"."bookings" add constraint "bookings_creative_status_check" CHECK ((creative_status = ANY (ARRAY['pending_approval'::text, 'approved'::text, 'awaiting_payment'::text, 'in_progress'::text, 'completed'::text, 'rejected'::text]))) not valid;

alter table "public"."bookings" validate constraint "bookings_creative_status_check";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.check_service_photo_limit()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- Check if adding this photo would exceed 6 photos for the service
    IF (SELECT COUNT(*) FROM service_photos WHERE service_id = NEW.service_id) >= 6 THEN
        RAISE EXCEPTION 'Maximum 6 photos allowed per service';
    END IF;
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.check_service_photos_limit()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF (SELECT COUNT(*) FROM service_photos WHERE service_id = NEW.service_id) >= 5 THEN
    RAISE EXCEPTION 'Maximum 5 photos allowed per service';
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_client_connected_services(client_user_id uuid)
 RETURNS TABLE(id uuid, title text, description text, price numeric, delivery_time text, status text, color text, is_active boolean, created_at timestamp with time zone, updated_at timestamp with time zone, creative_user_id uuid, creative_name text)
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        cs.id,
        cs.title,
        cs.description,
        cs.price,
        cs.delivery_time,
        cs.status,
        cs.color,
        cs.is_active,
        cs.created_at,
        cs.updated_at,
        cs.creative_user_id,
        COALESCE(c.display_name, u.name, 'Unknown Creative') as creative_name
    FROM creative_services cs
    INNER JOIN creative_client_relationships ccr ON cs.creative_user_id = ccr.creative_user_id
    LEFT JOIN creatives c ON cs.creative_user_id = c.user_id
    LEFT JOIN users u ON cs.creative_user_id = u.user_id
    WHERE ccr.client_user_id = client_user_id
        AND cs.is_active = true
    ORDER BY cs.created_at DESC;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_client_connected_services(client_user_id_param text)
 RETURNS TABLE(id uuid, title text, description text, price numeric, delivery_time text, status text, color text, is_active boolean, created_at timestamp with time zone, updated_at timestamp with time zone, creative_user_id text, creative_name text, photos jsonb, requires_booking boolean)
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY
    SELECT
        cs.id,
        cs.title,
        cs.description,
        cs.price,
        cs.delivery_time,
        cs.status,
        cs.color,
        cs.is_active,
        cs.created_at,
        cs.updated_at,
        cs.creative_user_id,
        COALESCE(c.display_name, u.name) AS creative_name,
        (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'id', sp.id,
                    'photo_url', sp.photo_url,
                    'photo_filename', sp.photo_filename,
                    'photo_size_bytes', sp.photo_size_bytes,
                    'display_order', sp.display_order,
                    'is_primary', sp.is_primary,
                    'created_at', sp.created_at,
                    'updated_at', sp.updated_at
                ) ORDER BY sp.display_order
            )
            FROM public.service_photos sp
            WHERE sp.service_id = cs.id
        ) AS photos,
        cs.requires_booking
    FROM
        creative_client_relationships ccr
    JOIN
        creative_services cs ON ccr.creative_user_id = cs.creative_user_id
    LEFT JOIN
        creatives c ON cs.creative_user_id = c.user_id
    LEFT JOIN
        users u ON cs.creative_user_id = u.user_id
    WHERE
        ccr.client_user_id = client_user_id_param
        AND cs.is_active = TRUE
    ORDER BY
        cs.created_at DESC;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_client_connected_services_with_photos(client_user_id uuid)
 RETURNS TABLE(id uuid, title text, description text, price numeric, delivery_time text, status text, color text, is_active boolean, created_at timestamp with time zone, updated_at timestamp with time zone, creative_user_id uuid, creative_name text, photos jsonb, requires_booking boolean)
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    cs.id,
    cs.title,
    cs.description,
    cs.price,
    cs.delivery_time,
    cs.status,
    cs.color,
    cs.is_active,
    cs.created_at,
    cs.updated_at,
    cs.creative_user_id,
    COALESCE(c.display_name, u.name, 'Unknown Creative') as creative_name,
    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'photo_url', sp.photo_url,
            'photo_filename', sp.photo_filename,
            'photo_size_bytes', sp.photo_size_bytes,
            'is_primary', sp.is_primary,
            'display_order', sp.display_order
          ) ORDER BY sp.display_order
        )
        FROM service_photos sp
        WHERE sp.service_id = cs.id
      ),
      '[]'::jsonb
    ) as photos,
    cs.requires_booking
  FROM creative_services cs
  JOIN creative_client_relationships ccr ON cs.creative_user_id = ccr.creative_user_id
  LEFT JOIN creatives c ON cs.creative_user_id = c.user_id
  LEFT JOIN users u ON cs.creative_user_id = u.user_id
  WHERE ccr.client_user_id = client_user_id
    AND ccr.status = 'connected'
    AND cs.is_active = true
  ORDER BY cs.created_at DESC;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_creative_service_counts(creative_user_ids text[])
 RETURNS TABLE(creative_user_id text, service_count bigint)
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY
    SELECT
        cs.creative_user_id,
        COUNT(cs.id) as service_count
    FROM
        creative_services cs
    WHERE
        cs.creative_user_id = ANY(creative_user_ids)
        AND cs.is_active = TRUE
    GROUP BY
        cs.creative_user_id;
END;
$function$
;

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

CREATE OR REPLACE FUNCTION public.update_service_photos_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
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

create policy "Allow authenticated users to read subscription tiers"
on "public"."subscription_tiers"
as permissive
for select
to authenticated
using (true);



