-- Storage policies for private job_photos bucket

create policy "Read job photos via signed URLs or authenticated access"
on storage.objects
for select
to authenticated
using (bucket_id = 'job_photos');

create policy "Upload job photos for own user folder"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'job_photos'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "Update job photos for own user folder"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'job_photos'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
)
with check (
  bucket_id = 'job_photos'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "Delete job photos for own user folder"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'job_photos'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

