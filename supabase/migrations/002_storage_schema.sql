-- Supabase Storage schema for product image handling

-- 1. Ensure the bucket exists (id must match usage in the app)
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update
set public = excluded.public;

-- 2. Public read access so the storefront can load images
create policy "Public Access"
on storage.objects for select
using (bucket_id = 'product-images');

-- 3. Allow authenticated users to upload new images
create policy "Authenticated users can upload"
on storage.objects for insert
with check (
  bucket_id = 'product-images'
  and auth.role() = 'authenticated'
);

-- 4. Allow authenticated users to update their objects
create policy "Authenticated users can update"
on storage.objects for update
using (
  bucket_id = 'product-images'
  and auth.role() = 'authenticated'
);

-- 5. Allow authenticated users to delete their objects
create policy "Authenticated users can delete"
on storage.objects for delete
using (
  bucket_id = 'product-images'
  and auth.role() = 'authenticated'
);

-- 6. Development helper policy: allow all roles full access to product-images
-- NOTE: This is intended for local development only. Remove or tighten before production.
create policy "Dev allow all on product-images"
on storage.objects
for all
using (bucket_id = 'product-images')
with check (bucket_id = 'product-images');


