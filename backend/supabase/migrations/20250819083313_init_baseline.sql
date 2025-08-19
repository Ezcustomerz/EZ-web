create type "public"."advocate_tier_enum" as enum ('silver', 'gold', 'platinum');

create type "public"."subscription_tier_enum" as enum ('basic', 'growth', 'pro');

drop function if exists "public"."update_user_last_login"(user_uuid uuid);


  create table "public"."advocates" (
    "user_id" uuid not null,
    "tier" advocate_tier_enum not null default 'silver'::advocate_tier_enum,
    "fp_affiliate_id" text,
    "fp_referral_code" text,
    "fp_referral_link" text,
    "active_referrals" integer not null default 0,
    "currency" text not null default 'USD'::text,
    "total_earned" numeric(14,2) not null default 0,
    "earned_this_month" numeric(14,2) not null default 0,
    "total_paid_out" numeric(14,2) not null default 0,
    "pending_payout" numeric(14,2) not null default 0,
    "last_payout_at" timestamp with time zone,
    "last_synced_at" timestamp with time zone,
    "sync_source" text not null default 'firstpromoter'::text,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."advocates" enable row level security;


  create table "public"."clients" (
    "user_id" uuid not null,
    "display_name" text,
    "title" text,
    "profile_banner_url" text,
    "created_at" timestamp with time zone not null default now(),
    "email" text,
    "profile_source" avatar_source_enum default 'google'::avatar_source_enum
      );


alter table "public"."clients" enable row level security;


  create table "public"."creatives" (
    "user_id" uuid not null,
    "display_name" text,
    "title" text,
    "storage_used_bytes" bigint not null default 0,
    "storage_limit_bytes" bigint not null default 0,
    "profile_banner_url" text,
    "bio" text,
    "created_at" timestamp with time zone not null default now(),
    "primary_contact" text,
    "secondary_contact" text,
    "subscription_tier" subscription_tier_enum default 'basic'::subscription_tier_enum,
    "profile_source" avatar_source_enum default 'google'::avatar_source_enum
      );


alter table "public"."creatives" enable row level security;

alter table "public"."users" add column "first_login" boolean default true;

CREATE UNIQUE INDEX advocates_pkey ON public.advocates USING btree (user_id);

CREATE UNIQUE INDEX clients_pkey ON public.clients USING btree (user_id);

CREATE UNIQUE INDEX creatives_pkey ON public.creatives USING btree (user_id);

CREATE INDEX ix_advocate_last_synced_at ON public.advocates USING btree (last_synced_at);

CREATE INDEX ix_advocate_tier ON public.advocates USING btree (tier);

CREATE UNIQUE INDEX users_user_id_unique ON public.users USING btree (user_id);

CREATE UNIQUE INDEX ux_adv_fp_affiliate_id ON public.advocates USING btree (fp_affiliate_id) WHERE (fp_affiliate_id IS NOT NULL);

CREATE UNIQUE INDEX ux_adv_fp_referral_code ON public.advocates USING btree (fp_referral_code) WHERE (fp_referral_code IS NOT NULL);

CREATE UNIQUE INDEX ux_adv_fp_referral_link ON public.advocates USING btree (fp_referral_link) WHERE (fp_referral_link IS NOT NULL);

alter table "public"."advocates" add constraint "advocates_pkey" PRIMARY KEY using index "advocates_pkey";

alter table "public"."clients" add constraint "clients_pkey" PRIMARY KEY using index "clients_pkey";

alter table "public"."creatives" add constraint "creatives_pkey" PRIMARY KEY using index "creatives_pkey";

alter table "public"."advocates" add constraint "advocates_active_referrals_check" CHECK ((active_referrals >= 0)) not valid;

alter table "public"."advocates" validate constraint "advocates_active_referrals_check";

alter table "public"."advocates" add constraint "advocates_earned_this_month_check" CHECK ((earned_this_month >= (0)::numeric)) not valid;

alter table "public"."advocates" validate constraint "advocates_earned_this_month_check";

alter table "public"."advocates" add constraint "advocates_pending_payout_check" CHECK ((pending_payout >= (0)::numeric)) not valid;

alter table "public"."advocates" validate constraint "advocates_pending_payout_check";

alter table "public"."advocates" add constraint "advocates_total_earned_check" CHECK ((total_earned >= (0)::numeric)) not valid;

alter table "public"."advocates" validate constraint "advocates_total_earned_check";

alter table "public"."advocates" add constraint "advocates_total_paid_out_check" CHECK ((total_paid_out >= (0)::numeric)) not valid;

alter table "public"."advocates" validate constraint "advocates_total_paid_out_check";

alter table "public"."advocates" add constraint "advocates_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE not valid;

alter table "public"."advocates" validate constraint "advocates_user_id_fkey";

alter table "public"."clients" add constraint "clients_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE not valid;

alter table "public"."clients" validate constraint "clients_user_id_fkey";

alter table "public"."creatives" add constraint "creatives_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE not valid;

alter table "public"."creatives" validate constraint "creatives_user_id_fkey";

alter table "public"."users" add constraint "users_user_id_unique" UNIQUE using index "users_user_id_unique";

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

grant delete on table "public"."advocates" to "anon";

grant insert on table "public"."advocates" to "anon";

grant references on table "public"."advocates" to "anon";

grant select on table "public"."advocates" to "anon";

grant trigger on table "public"."advocates" to "anon";

grant truncate on table "public"."advocates" to "anon";

grant update on table "public"."advocates" to "anon";

grant delete on table "public"."advocates" to "authenticated";

grant insert on table "public"."advocates" to "authenticated";

grant references on table "public"."advocates" to "authenticated";

grant select on table "public"."advocates" to "authenticated";

grant trigger on table "public"."advocates" to "authenticated";

grant truncate on table "public"."advocates" to "authenticated";

grant update on table "public"."advocates" to "authenticated";

grant delete on table "public"."advocates" to "service_role";

grant insert on table "public"."advocates" to "service_role";

grant references on table "public"."advocates" to "service_role";

grant select on table "public"."advocates" to "service_role";

grant trigger on table "public"."advocates" to "service_role";

grant truncate on table "public"."advocates" to "service_role";

grant update on table "public"."advocates" to "service_role";

grant delete on table "public"."clients" to "anon";

grant insert on table "public"."clients" to "anon";

grant references on table "public"."clients" to "anon";

grant select on table "public"."clients" to "anon";

grant trigger on table "public"."clients" to "anon";

grant truncate on table "public"."clients" to "anon";

grant update on table "public"."clients" to "anon";

grant delete on table "public"."clients" to "authenticated";

grant insert on table "public"."clients" to "authenticated";

grant references on table "public"."clients" to "authenticated";

grant select on table "public"."clients" to "authenticated";

grant trigger on table "public"."clients" to "authenticated";

grant truncate on table "public"."clients" to "authenticated";

grant update on table "public"."clients" to "authenticated";

grant delete on table "public"."clients" to "service_role";

grant insert on table "public"."clients" to "service_role";

grant references on table "public"."clients" to "service_role";

grant select on table "public"."clients" to "service_role";

grant trigger on table "public"."clients" to "service_role";

grant truncate on table "public"."clients" to "service_role";

grant update on table "public"."clients" to "service_role";

grant delete on table "public"."creatives" to "anon";

grant insert on table "public"."creatives" to "anon";

grant references on table "public"."creatives" to "anon";

grant select on table "public"."creatives" to "anon";

grant trigger on table "public"."creatives" to "anon";

grant truncate on table "public"."creatives" to "anon";

grant update on table "public"."creatives" to "anon";

grant delete on table "public"."creatives" to "authenticated";

grant insert on table "public"."creatives" to "authenticated";

grant references on table "public"."creatives" to "authenticated";

grant select on table "public"."creatives" to "authenticated";

grant trigger on table "public"."creatives" to "authenticated";

grant truncate on table "public"."creatives" to "authenticated";

grant update on table "public"."creatives" to "authenticated";

grant delete on table "public"."creatives" to "service_role";

grant insert on table "public"."creatives" to "service_role";

grant references on table "public"."creatives" to "service_role";

grant select on table "public"."creatives" to "service_role";

grant trigger on table "public"."creatives" to "service_role";

grant truncate on table "public"."creatives" to "service_role";

grant update on table "public"."creatives" to "service_role";


  create policy "advocates_admin_all"
  on "public"."advocates"
  as permissive
  for all
  to authenticated
using (((auth.jwt() ->> 'role'::text) = 'admin'::text))
with check (((auth.jwt() ->> 'role'::text) = 'admin'::text));



  create policy "advocates_insert_own"
  on "public"."advocates"
  as permissive
  for insert
  to authenticated
with check ((user_id = auth.uid()));



  create policy "advocates_select_own"
  on "public"."advocates"
  as permissive
  for select
  to authenticated
using ((user_id = auth.uid()));



  create policy "advocates_update_own"
  on "public"."advocates"
  as permissive
  for update
  to authenticated
using ((user_id = auth.uid()))
with check ((user_id = auth.uid()));



  create policy "clients_admin_all"
  on "public"."clients"
  as permissive
  for all
  to authenticated
using (((auth.jwt() ->> 'role'::text) = 'admin'::text))
with check (((auth.jwt() ->> 'role'::text) = 'admin'::text));



  create policy "clients_insert_own"
  on "public"."clients"
  as permissive
  for insert
  to authenticated
with check ((user_id = auth.uid()));



  create policy "clients_select_own"
  on "public"."clients"
  as permissive
  for select
  to authenticated
using ((user_id = auth.uid()));



  create policy "clients_update_own"
  on "public"."clients"
  as permissive
  for update
  to authenticated
using ((user_id = auth.uid()))
with check ((user_id = auth.uid()));



  create policy "creatives_admin_all"
  on "public"."creatives"
  as permissive
  for all
  to authenticated
using (((auth.jwt() ->> 'role'::text) = 'admin'::text))
with check (((auth.jwt() ->> 'role'::text) = 'admin'::text));



  create policy "creatives_insert_own"
  on "public"."creatives"
  as permissive
  for insert
  to authenticated
with check ((user_id = auth.uid()));



  create policy "creatives_select_own"
  on "public"."creatives"
  as permissive
  for select
  to authenticated
using ((user_id = auth.uid()));



  create policy "creatives_update_own"
  on "public"."creatives"
  as permissive
  for update
  to authenticated
using ((user_id = auth.uid()))
with check ((user_id = auth.uid()));



