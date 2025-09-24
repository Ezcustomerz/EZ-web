alter table "public"."creatives" drop constraint "creatives_primary_service_id_fkey";

alter table "public"."creatives" drop constraint "creatives_secondary_service_id_fkey";

alter table "public"."creative_services" drop constraint "creative_services_status_check";

create table "public"."bundle_services" (
    "id" uuid not null default gen_random_uuid(),
    "bundle_id" uuid not null,
    "service_id" uuid not null,
    "created_at" timestamp with time zone default now()
);


alter table "public"."bundle_services" enable row level security;

create table "public"."creative_bundles" (
    "id" uuid not null default gen_random_uuid(),
    "creative_user_id" uuid not null,
    "title" text not null,
    "description" text not null,
    "color" text not null default '#3b82f6'::text,
    "status" text not null default 'Public'::text,
    "pricing_option" text not null default 'fixed'::text,
    "fixed_price" numeric,
    "discount_percentage" numeric,
    "is_active" boolean not null default true,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."creative_bundles" enable row level security;

alter table "public"."creative_services" drop column "is_enabled";

CREATE UNIQUE INDEX bundle_services_bundle_id_service_id_key ON public.bundle_services USING btree (bundle_id, service_id);

CREATE UNIQUE INDEX bundle_services_pkey ON public.bundle_services USING btree (id);

CREATE UNIQUE INDEX creative_bundles_pkey ON public.creative_bundles USING btree (id);

CREATE INDEX idx_bundle_services_bundle_id ON public.bundle_services USING btree (bundle_id);

CREATE INDEX idx_bundle_services_service_id ON public.bundle_services USING btree (service_id);

CREATE INDEX idx_creative_bundles_creative_user_id ON public.creative_bundles USING btree (creative_user_id);

CREATE INDEX idx_creative_bundles_is_active ON public.creative_bundles USING btree (is_active);

CREATE INDEX idx_creative_bundles_status ON public.creative_bundles USING btree (status);

alter table "public"."bundle_services" add constraint "bundle_services_pkey" PRIMARY KEY using index "bundle_services_pkey";

alter table "public"."creative_bundles" add constraint "creative_bundles_pkey" PRIMARY KEY using index "creative_bundles_pkey";

alter table "public"."bundle_services" add constraint "bundle_services_bundle_id_fkey" FOREIGN KEY (bundle_id) REFERENCES creative_bundles(id) ON DELETE CASCADE not valid;

alter table "public"."bundle_services" validate constraint "bundle_services_bundle_id_fkey";

alter table "public"."bundle_services" add constraint "bundle_services_bundle_id_service_id_key" UNIQUE using index "bundle_services_bundle_id_service_id_key";

alter table "public"."bundle_services" add constraint "bundle_services_service_id_fkey" FOREIGN KEY (service_id) REFERENCES creative_services(id) ON DELETE CASCADE not valid;

alter table "public"."bundle_services" validate constraint "bundle_services_service_id_fkey";

alter table "public"."creative_bundles" add constraint "creative_bundles_color_check" CHECK ((color ~ '^#[0-9A-Fa-f]{6}$'::text)) not valid;

alter table "public"."creative_bundles" validate constraint "creative_bundles_color_check";

alter table "public"."creative_bundles" add constraint "creative_bundles_creative_user_id_fkey" FOREIGN KEY (creative_user_id) REFERENCES creatives(user_id) ON DELETE CASCADE not valid;

alter table "public"."creative_bundles" validate constraint "creative_bundles_creative_user_id_fkey";

alter table "public"."creative_bundles" add constraint "creative_bundles_discount_percentage_check" CHECK (((discount_percentage >= (0)::numeric) AND (discount_percentage <= (100)::numeric))) not valid;

alter table "public"."creative_bundles" validate constraint "creative_bundles_discount_percentage_check";

alter table "public"."creative_bundles" add constraint "creative_bundles_fixed_price_check" CHECK ((fixed_price >= (0)::numeric)) not valid;

alter table "public"."creative_bundles" validate constraint "creative_bundles_fixed_price_check";

alter table "public"."creative_bundles" add constraint "creative_bundles_pricing_option_check" CHECK ((pricing_option = ANY (ARRAY['fixed'::text, 'discount'::text]))) not valid;

alter table "public"."creative_bundles" validate constraint "creative_bundles_pricing_option_check";

alter table "public"."creative_bundles" add constraint "creative_bundles_status_check" CHECK ((status = ANY (ARRAY['Public'::text, 'Private'::text]))) not valid;

alter table "public"."creative_bundles" validate constraint "creative_bundles_status_check";

alter table "public"."creative_services" add constraint "creative_services_status_check" CHECK ((status = ANY (ARRAY['Public'::text, 'Private'::text, 'Bundle-Only'::text]))) not valid;

alter table "public"."creative_services" validate constraint "creative_services_status_check";

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

create policy "Users can delete bundle services for their bundles"
on "public"."bundle_services"
as permissive
for delete
to public
using ((bundle_id IN ( SELECT creative_bundles.id
   FROM creative_bundles
  WHERE (creative_bundles.creative_user_id = auth.uid()))));


create policy "Users can insert bundle services for their bundles"
on "public"."bundle_services"
as permissive
for insert
to public
with check ((bundle_id IN ( SELECT creative_bundles.id
   FROM creative_bundles
  WHERE (creative_bundles.creative_user_id = auth.uid()))));


create policy "Users can update bundle services for their bundles"
on "public"."bundle_services"
as permissive
for update
to public
using ((bundle_id IN ( SELECT creative_bundles.id
   FROM creative_bundles
  WHERE (creative_bundles.creative_user_id = auth.uid()))));


create policy "Users can view bundle services for their bundles"
on "public"."bundle_services"
as permissive
for select
to public
using ((bundle_id IN ( SELECT creative_bundles.id
   FROM creative_bundles
  WHERE (creative_bundles.creative_user_id = auth.uid()))));


create policy "Users can delete their own bundles"
on "public"."creative_bundles"
as permissive
for delete
to public
using ((creative_user_id = auth.uid()));


create policy "Users can insert their own bundles"
on "public"."creative_bundles"
as permissive
for insert
to public
with check ((creative_user_id = auth.uid()));


create policy "Users can update their own bundles"
on "public"."creative_bundles"
as permissive
for update
to public
using ((creative_user_id = auth.uid()));


create policy "Users can view their own bundles"
on "public"."creative_bundles"
as permissive
for select
to public
using ((creative_user_id = auth.uid()));


CREATE TRIGGER update_creative_bundles_updated_at BEFORE UPDATE ON public.creative_bundles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


