drop policy "Creatives can update their bookings" on "public"."bookings";

revoke delete on table "public"."notifications" from "anon";

revoke insert on table "public"."notifications" from "anon";

revoke references on table "public"."notifications" from "anon";

revoke select on table "public"."notifications" from "anon";

revoke trigger on table "public"."notifications" from "anon";

revoke truncate on table "public"."notifications" from "anon";

revoke update on table "public"."notifications" from "anon";

revoke delete on table "public"."notifications" from "authenticated";

revoke insert on table "public"."notifications" from "authenticated";

revoke references on table "public"."notifications" from "authenticated";

revoke select on table "public"."notifications" from "authenticated";

revoke trigger on table "public"."notifications" from "authenticated";

revoke truncate on table "public"."notifications" from "authenticated";

revoke update on table "public"."notifications" from "authenticated";

revoke delete on table "public"."notifications" from "service_role";

revoke insert on table "public"."notifications" from "service_role";

revoke references on table "public"."notifications" from "service_role";

revoke select on table "public"."notifications" from "service_role";

revoke trigger on table "public"."notifications" from "service_role";

revoke truncate on table "public"."notifications" from "service_role";

revoke update on table "public"."notifications" from "service_role";

revoke delete on table "public"."subscription_tiers" from "anon";

revoke insert on table "public"."subscription_tiers" from "anon";

revoke references on table "public"."subscription_tiers" from "anon";

revoke select on table "public"."subscription_tiers" from "anon";

revoke trigger on table "public"."subscription_tiers" from "anon";

revoke truncate on table "public"."subscription_tiers" from "anon";

revoke update on table "public"."subscription_tiers" from "anon";

revoke delete on table "public"."subscription_tiers" from "authenticated";

revoke insert on table "public"."subscription_tiers" from "authenticated";

revoke references on table "public"."subscription_tiers" from "authenticated";

revoke select on table "public"."subscription_tiers" from "authenticated";

revoke trigger on table "public"."subscription_tiers" from "authenticated";

revoke truncate on table "public"."subscription_tiers" from "authenticated";

revoke update on table "public"."subscription_tiers" from "authenticated";

revoke delete on table "public"."subscription_tiers" from "service_role";

revoke insert on table "public"."subscription_tiers" from "service_role";

revoke references on table "public"."subscription_tiers" from "service_role";

revoke select on table "public"."subscription_tiers" from "service_role";

revoke trigger on table "public"."subscription_tiers" from "service_role";

revoke truncate on table "public"."subscription_tiers" from "service_role";

revoke update on table "public"."subscription_tiers" from "service_role";

drop function if exists "public"."get_client_connected_services"(client_user_id uuid);

drop function if exists "public"."get_client_connected_services"(client_user_id_param text);

alter table "public"."creatives" add column "stripe_account_id" text;

alter table "public"."creatives" add column "stripe_account_type" text;

alter table "public"."creatives" add column "stripe_last_payout_date" timestamp with time zone;

alter table "public"."creatives" add column "stripe_onboarding_complete" boolean default false;

alter table "public"."creatives" add column "stripe_payouts_enabled" boolean default false;

CREATE INDEX idx_bookings_client_status_date ON public.bookings USING btree (client_user_id, client_status, order_date DESC);

CREATE INDEX idx_bookings_creative_date_status ON public.bookings USING btree (creative_user_id, booking_date, creative_status, client_status) WHERE (booking_date IS NOT NULL);

CREATE INDEX idx_bookings_creative_status_date ON public.bookings USING btree (creative_user_id, creative_status, order_date DESC);

CREATE INDEX idx_bookings_service_date_status ON public.bookings USING btree (service_id, booking_date, start_time) WHERE ((creative_status <> 'rejected'::text) AND (client_status <> 'cancelled'::text));

CREATE INDEX idx_creative_bundles_creative_active_status ON public.creative_bundles USING btree (creative_user_id, is_active, status) WHERE (is_active = true);

CREATE INDEX idx_creative_client_relationships_client_updated ON public.creative_client_relationships USING btree (client_user_id, updated_at DESC);

CREATE INDEX idx_creative_client_relationships_creative_updated ON public.creative_client_relationships USING btree (creative_user_id, updated_at DESC);

CREATE INDEX idx_creative_services_creative_active ON public.creative_services USING btree (creative_user_id, is_active) WHERE (is_active = true);

CREATE INDEX idx_creative_services_creative_active_status ON public.creative_services USING btree (creative_user_id, is_active, status) WHERE (is_active = true);

CREATE INDEX idx_creatives_stripe_account_id ON public.creatives USING btree (stripe_account_id) WHERE (stripe_account_id IS NOT NULL);

CREATE INDEX idx_notifications_recipient_created ON public.notifications USING btree (recipient_user_id, created_at DESC);

CREATE INDEX idx_notifications_recipient_unread_created ON public.notifications USING btree (recipient_user_id, is_read, created_at DESC) WHERE (is_read = false);

CREATE INDEX idx_service_photos_service_order ON public.service_photos USING btree (service_id, display_order);

CREATE INDEX idx_subscription_tiers_active_price ON public.subscription_tiers USING btree (is_active, price) WHERE (is_active = true);

CREATE INDEX idx_time_slots_schedule_time ON public.time_slots USING btree (weekly_schedule_id, slot_time);

alter table "public"."creatives" add constraint "creatives_stripe_account_type_check" CHECK (((stripe_account_type IS NULL) OR (stripe_account_type = ANY (ARRAY['individual'::text, 'company'::text])))) not valid;

alter table "public"."creatives" validate constraint "creatives_stripe_account_type_check";

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

create policy "advocates_delete_own"
on "public"."advocates"
as permissive
for delete
to authenticated
using ((user_id = auth.uid()));


create policy "Clients can update their bookings"
on "public"."bookings"
as permissive
for update
to public
using ((client_user_id = auth.uid()))
with check ((client_user_id = auth.uid()));


create policy "Allow public to read bundle services for public bundles"
on "public"."bundle_services"
as permissive
for select
to anon
using ((bundle_id IN ( SELECT creative_bundles.id
   FROM creative_bundles
  WHERE ((creative_bundles.status = 'Public'::text) AND (creative_bundles.is_active = true)))));


create policy "Clients can view bundle services for accessible bundles"
on "public"."bundle_services"
as permissive
for select
to authenticated
using ((bundle_id IN ( SELECT creative_bundles.id
   FROM creative_bundles
  WHERE ((creative_bundles.status = 'Public'::text) AND (creative_bundles.is_active = true) AND (creative_bundles.creative_user_id IN ( SELECT creative_client_relationships.creative_user_id
           FROM creative_client_relationships
          WHERE (creative_client_relationships.client_user_id = auth.uid())))))));


create policy "Clients can view calendar settings for public services"
on "public"."calendar_settings"
as permissive
for select
to public
using (((is_active = true) AND (service_id IN ( SELECT creative_services.id
   FROM creative_services
  WHERE ((creative_services.status = 'Public'::text) AND (creative_services.is_active = true))))));


create policy "Clients can view calendar settings for their booking services"
on "public"."calendar_settings"
as permissive
for select
to public
using (((is_active = true) AND (service_id IN ( SELECT bookings.service_id
   FROM bookings
  WHERE (bookings.client_user_id = auth.uid())))));


create policy "Creatives can view their connected clients"
on "public"."clients"
as permissive
for select
to authenticated
using ((user_id IN ( SELECT creative_client_relationships.client_user_id
   FROM creative_client_relationships
  WHERE (creative_client_relationships.creative_user_id = auth.uid()))));


create policy "Users can view clients in their bookings"
on "public"."clients"
as permissive
for select
to public
using ((user_id IN ( SELECT bookings.client_user_id
   FROM bookings
  WHERE (bookings.creative_user_id = auth.uid())
UNION
 SELECT bookings.client_user_id
   FROM bookings
  WHERE (bookings.client_user_id = auth.uid()))));


create policy "clients_delete_own"
on "public"."clients"
as permissive
for delete
to authenticated
using ((user_id = auth.uid()));


create policy "Allow public to read public bundles"
on "public"."creative_bundles"
as permissive
for select
to anon
using (((status = 'Public'::text) AND (is_active = true)));


create policy "Clients can view public bundles from connected creatives"
on "public"."creative_bundles"
as permissive
for select
to authenticated
using (((status = 'Public'::text) AND (is_active = true) AND (creative_user_id IN ( SELECT creative_client_relationships.creative_user_id
   FROM creative_client_relationships
  WHERE (creative_client_relationships.client_user_id = auth.uid())))));


create policy "Authenticated creatives can view their own client relationships"
on "public"."creative_client_relationships"
as permissive
for select
to authenticated
using ((creative_user_id = auth.uid()));


create policy "Clients can view their own relationships"
on "public"."creative_client_relationships"
as permissive
for select
to authenticated
using ((client_user_id = auth.uid()));


create policy "Users can view services in their bookings"
on "public"."creative_services"
as permissive
for select
to public
using (((id IN ( SELECT bookings.service_id
   FROM bookings
  WHERE (bookings.client_user_id = auth.uid())
UNION
 SELECT bookings.service_id
   FROM bookings
  WHERE (bookings.creative_user_id = auth.uid()))) OR ((status = 'Public'::text) AND (is_active = true)) OR (creative_user_id = auth.uid())));


create policy "Allow public to read creative profiles"
on "public"."creatives"
as permissive
for select
to anon
using (true);


create policy "Clients can view their connected creatives"
on "public"."creatives"
as permissive
for select
to authenticated
using ((user_id IN ( SELECT creative_client_relationships.creative_user_id
   FROM creative_client_relationships
  WHERE (creative_client_relationships.client_user_id = auth.uid()))));


create policy "Users can view creatives in their bookings"
on "public"."creatives"
as permissive
for select
to public
using ((user_id IN ( SELECT bookings.creative_user_id
   FROM bookings
  WHERE (bookings.client_user_id = auth.uid())
UNION
 SELECT bookings.creative_user_id
   FROM bookings
  WHERE (bookings.creative_user_id = auth.uid()))));


create policy "creatives_delete_own"
on "public"."creatives"
as permissive
for delete
to authenticated
using ((user_id = auth.uid()));


create policy "Users can create notifications for their bookings"
on "public"."notifications"
as permissive
for insert
to public
with check (((recipient_user_id = auth.uid()) OR (related_user_id = auth.uid()) OR ((related_entity_type = 'booking'::text) AND (related_entity_id IN ( SELECT bookings.id
   FROM bookings
  WHERE (bookings.client_user_id = auth.uid())
UNION
 SELECT bookings.id
   FROM bookings
  WHERE (bookings.creative_user_id = auth.uid()))))));


create policy "Users can update their own notifications"
on "public"."notifications"
as permissive
for update
to public
using ((recipient_user_id = auth.uid()))
with check ((recipient_user_id = auth.uid()));


create policy "Users can view their own notifications"
on "public"."notifications"
as permissive
for select
to public
using ((recipient_user_id = auth.uid()));


create policy "Allow public to read service photos for public services"
on "public"."service_photos"
as permissive
for select
to anon
using ((EXISTS ( SELECT 1
   FROM creative_services cs
  WHERE ((cs.id = service_photos.service_id) AND (cs.status = 'Public'::text) AND (cs.is_active = true)))));


create policy "Allow anonymous users to read active subscription tiers"
on "public"."subscription_tiers"
as permissive
for select
to anon
using ((is_active = true));


create policy "Clients can view time blocks for public services"
on "public"."time_blocks"
as permissive
for select
to public
using ((weekly_schedule_id IN ( SELECT ws.id
   FROM (weekly_schedule ws
     JOIN calendar_settings cs ON ((ws.calendar_setting_id = cs.id)))
  WHERE ((cs.is_active = true) AND (cs.service_id IN ( SELECT creative_services.id
           FROM creative_services
          WHERE ((creative_services.status = 'Public'::text) AND (creative_services.is_active = true))))))));


create policy "Clients can view time blocks for their booking services"
on "public"."time_blocks"
as permissive
for select
to public
using ((weekly_schedule_id IN ( SELECT ws.id
   FROM (weekly_schedule ws
     JOIN calendar_settings cs ON ((ws.calendar_setting_id = cs.id)))
  WHERE ((cs.is_active = true) AND (cs.service_id IN ( SELECT bookings.service_id
           FROM bookings
          WHERE (bookings.client_user_id = auth.uid())))))));


create policy "Clients can view time slots for public services"
on "public"."time_slots"
as permissive
for select
to public
using ((weekly_schedule_id IN ( SELECT ws.id
   FROM (weekly_schedule ws
     JOIN calendar_settings cs ON ((ws.calendar_setting_id = cs.id)))
  WHERE ((cs.is_active = true) AND (cs.service_id IN ( SELECT creative_services.id
           FROM creative_services
          WHERE ((creative_services.status = 'Public'::text) AND (creative_services.is_active = true))))))));


create policy "Clients can view time slots for their booking services"
on "public"."time_slots"
as permissive
for select
to public
using ((weekly_schedule_id IN ( SELECT ws.id
   FROM (weekly_schedule ws
     JOIN calendar_settings cs ON ((ws.calendar_setting_id = cs.id)))
  WHERE ((cs.is_active = true) AND (cs.service_id IN ( SELECT bookings.service_id
           FROM bookings
          WHERE (bookings.client_user_id = auth.uid())))))));


create policy "Clients can view their connected creative users"
on "public"."users"
as permissive
for select
to authenticated
using ((user_id IN ( SELECT creative_client_relationships.creative_user_id
   FROM creative_client_relationships
  WHERE (creative_client_relationships.client_user_id = auth.uid()))));


create policy "Creatives can view their connected client users"
on "public"."users"
as permissive
for select
to authenticated
using ((user_id IN ( SELECT creative_client_relationships.client_user_id
   FROM creative_client_relationships
  WHERE (creative_client_relationships.creative_user_id = auth.uid()))));


create policy "Users can view other users in their bookings"
on "public"."users"
as permissive
for select
to public
using ((user_id IN ( SELECT bookings.creative_user_id
   FROM bookings
  WHERE (bookings.client_user_id = auth.uid())
UNION
 SELECT bookings.client_user_id
   FROM bookings
  WHERE (bookings.creative_user_id = auth.uid()))));


create policy "Clients can view weekly schedule for public services"
on "public"."weekly_schedule"
as permissive
for select
to public
using ((calendar_setting_id IN ( SELECT calendar_settings.id
   FROM calendar_settings
  WHERE ((calendar_settings.is_active = true) AND (calendar_settings.service_id IN ( SELECT creative_services.id
           FROM creative_services
          WHERE ((creative_services.status = 'Public'::text) AND (creative_services.is_active = true))))))));


create policy "Clients can view weekly schedule for their booking services"
on "public"."weekly_schedule"
as permissive
for select
to public
using ((calendar_setting_id IN ( SELECT calendar_settings.id
   FROM calendar_settings
  WHERE ((calendar_settings.is_active = true) AND (calendar_settings.service_id IN ( SELECT bookings.service_id
           FROM bookings
          WHERE (bookings.client_user_id = auth.uid())))))));


create policy "Creatives can update their bookings"
on "public"."bookings"
as permissive
for update
to public
using ((creative_user_id = auth.uid()))
with check ((creative_user_id = auth.uid()));



