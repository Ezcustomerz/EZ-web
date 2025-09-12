create table "public"."creative_client_relationships" (
    "id" uuid not null default gen_random_uuid(),
    "creative_user_id" uuid not null,
    "client_user_id" uuid not null,
    "status" text not null default 'active'::text,
    "total_spent" numeric default 0,
    "projects_count" integer default 0,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."creative_client_relationships" enable row level security;

create table "public"."creative_services" (
    "id" uuid not null default gen_random_uuid(),
    "creative_user_id" uuid not null,
    "title" text not null,
    "description" text not null,
    "price" numeric(10,2) not null,
    "delivery_time" text not null,
    "status" text not null default 'Private'::text,
    "color" text not null default '#3b82f6'::text,
    "is_active" boolean not null default true,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "is_enabled" boolean default true
);


alter table "public"."creative_services" enable row level security;

CREATE UNIQUE INDEX creative_client_relationships_creative_user_id_client_user__key ON public.creative_client_relationships USING btree (creative_user_id, client_user_id);

CREATE UNIQUE INDEX creative_client_relationships_pkey ON public.creative_client_relationships USING btree (id);

CREATE UNIQUE INDEX creative_services_pkey ON public.creative_services USING btree (id);

CREATE INDEX idx_creative_client_relationships_client_id ON public.creative_client_relationships USING btree (client_user_id);

CREATE INDEX idx_creative_client_relationships_creative_id ON public.creative_client_relationships USING btree (creative_user_id);

CREATE INDEX idx_creative_client_relationships_status ON public.creative_client_relationships USING btree (status);

CREATE INDEX idx_creative_services_creative_user_id ON public.creative_services USING btree (creative_user_id);

CREATE INDEX idx_creative_services_is_active ON public.creative_services USING btree (is_active);

CREATE INDEX idx_creative_services_status ON public.creative_services USING btree (status);

alter table "public"."creative_client_relationships" add constraint "creative_client_relationships_pkey" PRIMARY KEY using index "creative_client_relationships_pkey";

alter table "public"."creative_services" add constraint "creative_services_pkey" PRIMARY KEY using index "creative_services_pkey";

alter table "public"."creative_client_relationships" add constraint "creative_client_relationships_client_user_id_fkey" FOREIGN KEY (client_user_id) REFERENCES clients(user_id) ON DELETE CASCADE not valid;

alter table "public"."creative_client_relationships" validate constraint "creative_client_relationships_client_user_id_fkey";

alter table "public"."creative_client_relationships" add constraint "creative_client_relationships_creative_user_id_client_user__key" UNIQUE using index "creative_client_relationships_creative_user_id_client_user__key";

alter table "public"."creative_client_relationships" add constraint "creative_client_relationships_creative_user_id_fkey" FOREIGN KEY (creative_user_id) REFERENCES creatives(user_id) ON DELETE CASCADE not valid;

alter table "public"."creative_client_relationships" validate constraint "creative_client_relationships_creative_user_id_fkey";

alter table "public"."creative_client_relationships" add constraint "creative_client_relationships_projects_count_check" CHECK ((projects_count >= 0)) not valid;

alter table "public"."creative_client_relationships" validate constraint "creative_client_relationships_projects_count_check";

alter table "public"."creative_client_relationships" add constraint "creative_client_relationships_status_check" CHECK ((status = ANY (ARRAY['active'::text, 'inactive'::text]))) not valid;

alter table "public"."creative_client_relationships" validate constraint "creative_client_relationships_status_check";

alter table "public"."creative_client_relationships" add constraint "creative_client_relationships_total_spent_check" CHECK ((total_spent >= (0)::numeric)) not valid;

alter table "public"."creative_client_relationships" validate constraint "creative_client_relationships_total_spent_check";

alter table "public"."creative_services" add constraint "creative_services_creative_user_id_fkey" FOREIGN KEY (creative_user_id) REFERENCES creatives(user_id) ON DELETE CASCADE not valid;

alter table "public"."creative_services" validate constraint "creative_services_creative_user_id_fkey";

alter table "public"."creative_services" add constraint "creative_services_price_check" CHECK ((price >= (0)::numeric)) not valid;

alter table "public"."creative_services" validate constraint "creative_services_price_check";

alter table "public"."creative_services" add constraint "creative_services_status_check" CHECK ((status = ANY (ARRAY['Public'::text, 'Private'::text]))) not valid;

alter table "public"."creative_services" validate constraint "creative_services_status_check";

set check_function_bodies = off;

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

create policy "Creatives can create their own client relationships"
on "public"."creative_client_relationships"
as permissive
for insert
to public
with check ((creative_user_id = auth.uid()));


create policy "Creatives can delete their own client relationships"
on "public"."creative_client_relationships"
as permissive
for delete
to public
using ((creative_user_id = auth.uid()));


create policy "Creatives can update their own client relationships"
on "public"."creative_client_relationships"
as permissive
for update
to public
using ((creative_user_id = auth.uid()));


create policy "Creatives can view their own client relationships"
on "public"."creative_client_relationships"
as permissive
for select
to public
using ((creative_user_id = auth.uid()));


create policy "Anyone can view public services"
on "public"."creative_services"
as permissive
for select
to public
using (((status = 'Public'::text) AND (is_active = true)));


create policy "Creative users can delete their own services"
on "public"."creative_services"
as permissive
for delete
to public
using ((creative_user_id = auth.uid()));


create policy "Creative users can insert their own services"
on "public"."creative_services"
as permissive
for insert
to public
with check ((creative_user_id = auth.uid()));


create policy "Creative users can update their own services"
on "public"."creative_services"
as permissive
for update
to public
using ((creative_user_id = auth.uid()));


create policy "Creative users can view their own services"
on "public"."creative_services"
as permissive
for select
to public
using ((creative_user_id = auth.uid()));


CREATE TRIGGER update_creative_client_relationships_updated_at BEFORE UPDATE ON public.creative_client_relationships FOR EACH ROW EXECUTE FUNCTION update_creative_client_relationships_updated_at();

CREATE TRIGGER update_creative_services_updated_at BEFORE UPDATE ON public.creative_services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


