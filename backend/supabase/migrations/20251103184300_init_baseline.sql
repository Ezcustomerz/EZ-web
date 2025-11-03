
  create table "public"."bookings" (
    "id" uuid not null default gen_random_uuid(),
    "service_id" uuid not null,
    "client_user_id" uuid not null,
    "creative_user_id" uuid not null,
    "booking_date" date,
    "start_time" time with time zone,
    "end_time" time with time zone,
    "session_duration" integer default 60,
    "notes" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "price" numeric default 0,
    "payment_option" text default 'later'::text,
    "order_date" timestamp with time zone default now(),
    "payment_status" text default 'pending'::text,
    "amount_paid" numeric default 0,
    "client_status" text default 'placed'::text,
    "creative_status" text default 'pending_approval'::text,
    "canceled_date" timestamp with time zone
      );


alter table "public"."bookings" enable row level security;

CREATE UNIQUE INDEX bookings_pkey ON public.bookings USING btree (id);

CREATE INDEX idx_bookings_booking_date ON public.bookings USING btree (booking_date);

CREATE INDEX idx_bookings_client ON public.bookings USING btree (client_user_id);

CREATE INDEX idx_bookings_client_status ON public.bookings USING btree (client_user_id, client_status);

CREATE INDEX idx_bookings_client_user_id ON public.bookings USING btree (client_user_id);

CREATE INDEX idx_bookings_creative ON public.bookings USING btree (creative_user_id);

CREATE INDEX idx_bookings_creative_date ON public.bookings USING btree (creative_user_id, booking_date) WHERE (booking_date IS NOT NULL);

CREATE INDEX idx_bookings_creative_status ON public.bookings USING btree (creative_user_id, creative_status);

CREATE INDEX idx_bookings_creative_user_id ON public.bookings USING btree (creative_user_id);

CREATE INDEX idx_bookings_order_date ON public.bookings USING btree (order_date DESC);

CREATE INDEX idx_bookings_service_date ON public.bookings USING btree (service_id, booking_date);

CREATE INDEX idx_bookings_service_id ON public.bookings USING btree (service_id);

alter table "public"."bookings" add constraint "bookings_pkey" PRIMARY KEY using index "bookings_pkey";

alter table "public"."bookings" add constraint "booking_scheduling_consistency" CHECK ((((booking_date IS NULL) AND (start_time IS NULL) AND (end_time IS NULL)) OR ((booking_date IS NOT NULL) AND (start_time IS NOT NULL) AND (end_time IS NOT NULL)))) not valid;

alter table "public"."bookings" validate constraint "booking_scheduling_consistency";

alter table "public"."bookings" add constraint "bookings_amount_paid_check" CHECK ((amount_paid >= (0)::numeric)) not valid;

alter table "public"."bookings" validate constraint "bookings_amount_paid_check";

alter table "public"."bookings" add constraint "bookings_client_status_check" CHECK ((client_status = ANY (ARRAY['placed'::text, 'confirmed'::text, 'in_progress'::text, 'completed'::text, 'cancelled'::text]))) not valid;

alter table "public"."bookings" validate constraint "bookings_client_status_check";

alter table "public"."bookings" add constraint "bookings_client_user_id_fkey" FOREIGN KEY (client_user_id) REFERENCES public.clients(user_id) ON DELETE CASCADE not valid;

alter table "public"."bookings" validate constraint "bookings_client_user_id_fkey";

alter table "public"."bookings" add constraint "bookings_creative_status_check" CHECK ((creative_status = ANY (ARRAY['pending_approval'::text, 'approved'::text, 'in_progress'::text, 'completed'::text, 'rejected'::text]))) not valid;

alter table "public"."bookings" validate constraint "bookings_creative_status_check";

alter table "public"."bookings" add constraint "bookings_creative_user_id_fkey" FOREIGN KEY (creative_user_id) REFERENCES public.creatives(user_id) ON DELETE CASCADE not valid;

alter table "public"."bookings" validate constraint "bookings_creative_user_id_fkey";

alter table "public"."bookings" add constraint "bookings_payment_option_check" CHECK ((payment_option = ANY (ARRAY['upfront'::text, 'split'::text, 'later'::text]))) not valid;

alter table "public"."bookings" validate constraint "bookings_payment_option_check";

alter table "public"."bookings" add constraint "bookings_payment_status_check" CHECK ((payment_status = ANY (ARRAY['pending'::text, 'deposit_paid'::text, 'fully_paid'::text, 'refunded'::text]))) not valid;

alter table "public"."bookings" validate constraint "bookings_payment_status_check";

alter table "public"."bookings" add constraint "bookings_price_check" CHECK ((price >= (0)::numeric)) not valid;

alter table "public"."bookings" validate constraint "bookings_price_check";

alter table "public"."bookings" add constraint "bookings_service_id_fkey" FOREIGN KEY (service_id) REFERENCES public.creative_services(id) ON DELETE CASCADE not valid;

alter table "public"."bookings" validate constraint "bookings_service_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.decrement_booking_availability_count()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF OLD.booking_availability_id IS NOT NULL THEN
    -- Decrement current_bookings when a booking is deleted
    UPDATE booking_availability 
    SET current_bookings = GREATEST(0, current_bookings - 1)
    WHERE id = OLD.booking_availability_id;
  END IF;
  RETURN OLD;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_booking_availability_count()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.booking_availability_id IS NOT NULL THEN
    -- Increment current_bookings when a new booking is created
    UPDATE booking_availability 
    SET current_bookings = current_bookings + 1
    WHERE id = NEW.booking_availability_id;
  END IF;
  RETURN NEW;
END;
$function$
;

grant delete on table "public"."bookings" to "anon";

grant insert on table "public"."bookings" to "anon";

grant references on table "public"."bookings" to "anon";

grant select on table "public"."bookings" to "anon";

grant trigger on table "public"."bookings" to "anon";

grant truncate on table "public"."bookings" to "anon";

grant update on table "public"."bookings" to "anon";

grant delete on table "public"."bookings" to "authenticated";

grant insert on table "public"."bookings" to "authenticated";

grant references on table "public"."bookings" to "authenticated";

grant select on table "public"."bookings" to "authenticated";

grant trigger on table "public"."bookings" to "authenticated";

grant truncate on table "public"."bookings" to "authenticated";

grant update on table "public"."bookings" to "authenticated";

grant delete on table "public"."bookings" to "service_role";

grant insert on table "public"."bookings" to "service_role";

grant references on table "public"."bookings" to "service_role";

grant select on table "public"."bookings" to "service_role";

grant trigger on table "public"."bookings" to "service_role";

grant truncate on table "public"."bookings" to "service_role";

grant update on table "public"."bookings" to "service_role";


  create policy "Creatives can update their bookings"
  on "public"."bookings"
  as permissive
  for update
  to public
using ((creative_user_id = auth.uid()));



  create policy "Users can create bookings"
  on "public"."bookings"
  as permissive
  for insert
  to public
with check ((client_user_id = auth.uid()));



  create policy "Users can view their own bookings"
  on "public"."bookings"
  as permissive
  for select
  to public
using (((client_user_id = auth.uid()) OR (creative_user_id = auth.uid())));


CREATE TRIGGER trigger_decrement_availability_on_booking_delete AFTER DELETE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.decrement_booking_availability_count();

CREATE TRIGGER trigger_update_availability_on_booking AFTER INSERT ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.update_booking_availability_count();


