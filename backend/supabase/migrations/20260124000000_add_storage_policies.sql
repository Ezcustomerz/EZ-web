-- Create buckets
insert into storage.buckets (id, name, public)
values 
  ('profile-photos', 'profile-photos', true),
  ('creative-assets', 'creative-assets', true),
  ('booking-deliverables', 'booking-deliverables', false)
on conflict (id) do nothing;

-- Policy: Allow authenticated downloads from booking-deliverables
create policy "Allow authenticated downloads from booking-deliverables"
on storage.objects for select
to authenticated
using (
  (bucket_id = 'booking-deliverables'::text) AND 
  (
    (EXISTS ( SELECT 1 FROM bookings b WHERE (((b.id)::text = (storage.foldername(objects.name))[1]) AND (b.creative_user_id = auth.uid())))) OR 
    (EXISTS ( SELECT 1 FROM bookings b WHERE (((b.id)::text = (storage.foldername(objects.name))[1]) AND (b.client_user_id = auth.uid()))))
  )
);

-- Policy: Allow authenticated uploads to booking-deliverables
create policy "Allow authenticated uploads to booking-deliverables"
on storage.objects for insert
to authenticated
with check (bucket_id = 'booking-deliverables'::text);

-- Policy: Profile photos are publicly readable
create policy "Profile photos are publicly readable"
on storage.objects for select
to public
using (bucket_id = 'profile-photos'::text);

-- Policy: Users can delete their own creative assets
create policy "Users can delete their own creative assets"
on storage.objects for delete
to public
using (bucket_id = 'creative-assets'::text);

-- Policy: Users can delete their own profile photos
create policy "Users can delete their own profile photos"
on storage.objects for delete
to public
using ((bucket_id = 'profile-photos'::text) AND ((auth.uid())::text = (storage.foldername(name))[2]));

-- Policy: Users can update their own creative assets
create policy "Users can update their own creative assets"
on storage.objects for update
to public
using (bucket_id = 'creative-assets'::text);

-- Policy: Users can update their own profile photos
create policy "Users can update their own profile photos"
on storage.objects for update
to public
using ((bucket_id = 'profile-photos'::text) AND ((auth.uid())::text = (storage.foldername(name))[2]));

-- Policy: Users can upload creative assets
create policy "Users can upload creative assets"
on storage.objects for insert
to public
with check (bucket_id = 'creative-assets'::text);

-- Policy: Users can upload their own profile photos
create policy "Users can upload their own profile photos"
on storage.objects for insert
to public
with check ((bucket_id = 'profile-photos'::text) AND ((auth.uid())::text = (storage.foldername(name))[2]));

-- Policy: Users can view creative assets
create policy "Users can view creative assets"
on storage.objects for select
to public
using (bucket_id = 'creative-assets'::text);
