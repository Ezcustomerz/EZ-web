alter table "public"."calendar_settings" drop constraint "calendar_settings_max_advance_unit_check";

alter table "public"."calendar_settings" drop constraint "calendar_settings_min_notice_unit_check";

alter table "public"."calendar_settings" drop column "session_durations";

alter table "public"."calendar_settings" drop column "use_time_slots";

alter table "public"."calendar_settings" add column "session_duration" integer not null default 60;

alter table "public"."time_blocks" alter column "end_time" set data type time with time zone using "end_time"::time with time zone;

alter table "public"."time_blocks" alter column "start_time" set data type time with time zone using "start_time"::time with time zone;

alter table "public"."time_slots" alter column "slot_time" set data type time with time zone using "slot_time"::time with time zone;

alter table "public"."calendar_settings" add constraint "calendar_settings_max_advance_unit_check" CHECK ((max_advance_unit = ANY (ARRAY['hours'::text, 'days'::text, 'weeks'::text, 'months'::text]))) not valid;

alter table "public"."calendar_settings" validate constraint "calendar_settings_max_advance_unit_check";

alter table "public"."calendar_settings" add constraint "calendar_settings_min_notice_unit_check" CHECK ((min_notice_unit = ANY (ARRAY['minutes'::text, 'hours'::text, 'days'::text]))) not valid;

alter table "public"."calendar_settings" validate constraint "calendar_settings_min_notice_unit_check";

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

grant delete on table "public"."bundle_services" to "anon";

grant insert on table "public"."bundle_services" to "anon";

grant references on table "public"."bundle_services" to "anon";

grant select on table "public"."bundle_services" to "anon";

grant trigger on table "public"."bundle_services" to "anon";

grant truncate on table "public"."bundle_services" to "anon";

grant update on table "public"."bundle_services" to "anon";

grant delete on table "public"."bundle_services" to "authenticated";

grant insert on table "public"."bundle_services" to "authenticated";

grant references on table "public"."bundle_services" to "authenticated";

grant select on table "public"."bundle_services" to "authenticated";

grant trigger on table "public"."bundle_services" to "authenticated";

grant truncate on table "public"."bundle_services" to "authenticated";

grant update on table "public"."bundle_services" to "authenticated";

grant delete on table "public"."bundle_services" to "service_role";

grant insert on table "public"."bundle_services" to "service_role";

grant references on table "public"."bundle_services" to "service_role";

grant select on table "public"."bundle_services" to "service_role";

grant trigger on table "public"."bundle_services" to "service_role";

grant truncate on table "public"."bundle_services" to "service_role";

grant update on table "public"."bundle_services" to "service_role";

grant delete on table "public"."calendar_settings" to "anon";

grant insert on table "public"."calendar_settings" to "anon";

grant references on table "public"."calendar_settings" to "anon";

grant select on table "public"."calendar_settings" to "anon";

grant trigger on table "public"."calendar_settings" to "anon";

grant truncate on table "public"."calendar_settings" to "anon";

grant update on table "public"."calendar_settings" to "anon";

grant delete on table "public"."calendar_settings" to "authenticated";

grant insert on table "public"."calendar_settings" to "authenticated";

grant references on table "public"."calendar_settings" to "authenticated";

grant select on table "public"."calendar_settings" to "authenticated";

grant trigger on table "public"."calendar_settings" to "authenticated";

grant truncate on table "public"."calendar_settings" to "authenticated";

grant update on table "public"."calendar_settings" to "authenticated";

grant delete on table "public"."calendar_settings" to "service_role";

grant insert on table "public"."calendar_settings" to "service_role";

grant references on table "public"."calendar_settings" to "service_role";

grant select on table "public"."calendar_settings" to "service_role";

grant trigger on table "public"."calendar_settings" to "service_role";

grant truncate on table "public"."calendar_settings" to "service_role";

grant update on table "public"."calendar_settings" to "service_role";

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

grant delete on table "public"."creative_bundles" to "anon";

grant insert on table "public"."creative_bundles" to "anon";

grant references on table "public"."creative_bundles" to "anon";

grant select on table "public"."creative_bundles" to "anon";

grant trigger on table "public"."creative_bundles" to "anon";

grant truncate on table "public"."creative_bundles" to "anon";

grant update on table "public"."creative_bundles" to "anon";

grant delete on table "public"."creative_bundles" to "authenticated";

grant insert on table "public"."creative_bundles" to "authenticated";

grant references on table "public"."creative_bundles" to "authenticated";

grant select on table "public"."creative_bundles" to "authenticated";

grant trigger on table "public"."creative_bundles" to "authenticated";

grant truncate on table "public"."creative_bundles" to "authenticated";

grant update on table "public"."creative_bundles" to "authenticated";

grant delete on table "public"."creative_bundles" to "service_role";

grant insert on table "public"."creative_bundles" to "service_role";

grant references on table "public"."creative_bundles" to "service_role";

grant select on table "public"."creative_bundles" to "service_role";

grant trigger on table "public"."creative_bundles" to "service_role";

grant truncate on table "public"."creative_bundles" to "service_role";

grant update on table "public"."creative_bundles" to "service_role";

grant delete on table "public"."creative_client_relationships" to "anon";

grant insert on table "public"."creative_client_relationships" to "anon";

grant references on table "public"."creative_client_relationships" to "anon";

grant select on table "public"."creative_client_relationships" to "anon";

grant trigger on table "public"."creative_client_relationships" to "anon";

grant truncate on table "public"."creative_client_relationships" to "anon";

grant update on table "public"."creative_client_relationships" to "anon";

grant delete on table "public"."creative_client_relationships" to "authenticated";

grant insert on table "public"."creative_client_relationships" to "authenticated";

grant references on table "public"."creative_client_relationships" to "authenticated";

grant select on table "public"."creative_client_relationships" to "authenticated";

grant trigger on table "public"."creative_client_relationships" to "authenticated";

grant truncate on table "public"."creative_client_relationships" to "authenticated";

grant update on table "public"."creative_client_relationships" to "authenticated";

grant delete on table "public"."creative_client_relationships" to "service_role";

grant insert on table "public"."creative_client_relationships" to "service_role";

grant references on table "public"."creative_client_relationships" to "service_role";

grant select on table "public"."creative_client_relationships" to "service_role";

grant trigger on table "public"."creative_client_relationships" to "service_role";

grant truncate on table "public"."creative_client_relationships" to "service_role";

grant update on table "public"."creative_client_relationships" to "service_role";

grant delete on table "public"."creative_services" to "anon";

grant insert on table "public"."creative_services" to "anon";

grant references on table "public"."creative_services" to "anon";

grant select on table "public"."creative_services" to "anon";

grant trigger on table "public"."creative_services" to "anon";

grant truncate on table "public"."creative_services" to "anon";

grant update on table "public"."creative_services" to "anon";

grant delete on table "public"."creative_services" to "authenticated";

grant insert on table "public"."creative_services" to "authenticated";

grant references on table "public"."creative_services" to "authenticated";

grant select on table "public"."creative_services" to "authenticated";

grant trigger on table "public"."creative_services" to "authenticated";

grant truncate on table "public"."creative_services" to "authenticated";

grant update on table "public"."creative_services" to "authenticated";

grant delete on table "public"."creative_services" to "service_role";

grant insert on table "public"."creative_services" to "service_role";

grant references on table "public"."creative_services" to "service_role";

grant select on table "public"."creative_services" to "service_role";

grant trigger on table "public"."creative_services" to "service_role";

grant truncate on table "public"."creative_services" to "service_role";

grant update on table "public"."creative_services" to "service_role";

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

grant delete on table "public"."service_photos" to "anon";

grant insert on table "public"."service_photos" to "anon";

grant references on table "public"."service_photos" to "anon";

grant select on table "public"."service_photos" to "anon";

grant trigger on table "public"."service_photos" to "anon";

grant truncate on table "public"."service_photos" to "anon";

grant update on table "public"."service_photos" to "anon";

grant delete on table "public"."service_photos" to "authenticated";

grant insert on table "public"."service_photos" to "authenticated";

grant references on table "public"."service_photos" to "authenticated";

grant select on table "public"."service_photos" to "authenticated";

grant trigger on table "public"."service_photos" to "authenticated";

grant truncate on table "public"."service_photos" to "authenticated";

grant update on table "public"."service_photos" to "authenticated";

grant delete on table "public"."service_photos" to "service_role";

grant insert on table "public"."service_photos" to "service_role";

grant references on table "public"."service_photos" to "service_role";

grant select on table "public"."service_photos" to "service_role";

grant trigger on table "public"."service_photos" to "service_role";

grant truncate on table "public"."service_photos" to "service_role";

grant update on table "public"."service_photos" to "service_role";

grant delete on table "public"."time_blocks" to "anon";

grant insert on table "public"."time_blocks" to "anon";

grant references on table "public"."time_blocks" to "anon";

grant select on table "public"."time_blocks" to "anon";

grant trigger on table "public"."time_blocks" to "anon";

grant truncate on table "public"."time_blocks" to "anon";

grant update on table "public"."time_blocks" to "anon";

grant delete on table "public"."time_blocks" to "authenticated";

grant insert on table "public"."time_blocks" to "authenticated";

grant references on table "public"."time_blocks" to "authenticated";

grant select on table "public"."time_blocks" to "authenticated";

grant trigger on table "public"."time_blocks" to "authenticated";

grant truncate on table "public"."time_blocks" to "authenticated";

grant update on table "public"."time_blocks" to "authenticated";

grant delete on table "public"."time_blocks" to "service_role";

grant insert on table "public"."time_blocks" to "service_role";

grant references on table "public"."time_blocks" to "service_role";

grant select on table "public"."time_blocks" to "service_role";

grant trigger on table "public"."time_blocks" to "service_role";

grant truncate on table "public"."time_blocks" to "service_role";

grant update on table "public"."time_blocks" to "service_role";

grant delete on table "public"."time_slots" to "anon";

grant insert on table "public"."time_slots" to "anon";

grant references on table "public"."time_slots" to "anon";

grant select on table "public"."time_slots" to "anon";

grant trigger on table "public"."time_slots" to "anon";

grant truncate on table "public"."time_slots" to "anon";

grant update on table "public"."time_slots" to "anon";

grant delete on table "public"."time_slots" to "authenticated";

grant insert on table "public"."time_slots" to "authenticated";

grant references on table "public"."time_slots" to "authenticated";

grant select on table "public"."time_slots" to "authenticated";

grant trigger on table "public"."time_slots" to "authenticated";

grant truncate on table "public"."time_slots" to "authenticated";

grant update on table "public"."time_slots" to "authenticated";

grant delete on table "public"."time_slots" to "service_role";

grant insert on table "public"."time_slots" to "service_role";

grant references on table "public"."time_slots" to "service_role";

grant select on table "public"."time_slots" to "service_role";

grant trigger on table "public"."time_slots" to "service_role";

grant truncate on table "public"."time_slots" to "service_role";

grant update on table "public"."time_slots" to "service_role";

grant delete on table "public"."users" to "anon";

grant insert on table "public"."users" to "anon";

grant references on table "public"."users" to "anon";

grant select on table "public"."users" to "anon";

grant trigger on table "public"."users" to "anon";

grant truncate on table "public"."users" to "anon";

grant update on table "public"."users" to "anon";

grant delete on table "public"."users" to "authenticated";

grant insert on table "public"."users" to "authenticated";

grant references on table "public"."users" to "authenticated";

grant select on table "public"."users" to "authenticated";

grant trigger on table "public"."users" to "authenticated";

grant truncate on table "public"."users" to "authenticated";

grant update on table "public"."users" to "authenticated";

grant delete on table "public"."users" to "service_role";

grant insert on table "public"."users" to "service_role";

grant references on table "public"."users" to "service_role";

grant select on table "public"."users" to "service_role";

grant trigger on table "public"."users" to "service_role";

grant truncate on table "public"."users" to "service_role";

grant update on table "public"."users" to "service_role";

grant delete on table "public"."weekly_schedule" to "anon";

grant insert on table "public"."weekly_schedule" to "anon";

grant references on table "public"."weekly_schedule" to "anon";

grant select on table "public"."weekly_schedule" to "anon";

grant trigger on table "public"."weekly_schedule" to "anon";

grant truncate on table "public"."weekly_schedule" to "anon";

grant update on table "public"."weekly_schedule" to "anon";

grant delete on table "public"."weekly_schedule" to "authenticated";

grant insert on table "public"."weekly_schedule" to "authenticated";

grant references on table "public"."weekly_schedule" to "authenticated";

grant select on table "public"."weekly_schedule" to "authenticated";

grant trigger on table "public"."weekly_schedule" to "authenticated";

grant truncate on table "public"."weekly_schedule" to "authenticated";

grant update on table "public"."weekly_schedule" to "authenticated";

grant delete on table "public"."weekly_schedule" to "service_role";

grant insert on table "public"."weekly_schedule" to "service_role";

grant references on table "public"."weekly_schedule" to "service_role";

grant select on table "public"."weekly_schedule" to "service_role";

grant trigger on table "public"."weekly_schedule" to "service_role";

grant truncate on table "public"."weekly_schedule" to "service_role";

grant update on table "public"."weekly_schedule" to "service_role";


