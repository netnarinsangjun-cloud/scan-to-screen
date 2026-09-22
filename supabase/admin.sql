-- =============================================================================
-- Scan to Screen — Admin back office (run AFTER schema.sql)
-- Adds: admin allow-list, write policies for admins, and a public media bucket.
-- Idempotent: safe to run more than once.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Admin allow-list
-- -----------------------------------------------------------------------------
-- Admins sign in with a username + password (Supabase Auth). The app maps a
-- username to "<username>@scan-to-screen.local", so user "admin" is stored as
-- admin@scan-to-screen.local. Signing in alone grants nothing: only accounts
-- listed here can change the catalogue.
create table if not exists public.admins (
  email      text primary key check (email = lower(email)),
  created_at timestamptz default now()
);

alter table public.admins enable row level security;
-- No policies on purpose: the list is not readable/writable through the API.
-- Manage it from the SQL Editor:
--   insert into public.admins (email) values ('staff2@scan-to-screen.local');
--   delete from public.admins where email = 'staff2@scan-to-screen.local';
-- (Create the matching login in Authentication -> Users -> Add user, with
--  "Auto Confirm User" ticked.)

-- SECURITY DEFINER so policies can consult the allow-list without exposing it.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admins
    where email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- -----------------------------------------------------------------------------
-- 2. Catalogue write access for admins
-- -----------------------------------------------------------------------------
grant insert, update, delete on public.products to authenticated;

drop policy if exists "admin: insert products" on public.products;
create policy "admin: insert products"
  on public.products
  for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "admin: update products" on public.products;
create policy "admin: update products"
  on public.products
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "admin: delete products" on public.products;
create policy "admin: delete products"
  on public.products
  for delete
  to authenticated
  using (public.is_admin());

-- -----------------------------------------------------------------------------
-- 3. Media storage (product images / videos)
-- -----------------------------------------------------------------------------
-- Public bucket: files are readable by URL (the TV needs that), but only admins
-- can upload, replace or delete.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-media',
  'product-media',
  true,
  52428800, -- 50 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'video/mp4', 'video/webm']
)
on conflict (id) do update
set public             = excluded.public,
    file_size_limit    = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "admin: upload product media" on storage.objects;
create policy "admin: upload product media"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'product-media' and public.is_admin());

drop policy if exists "admin: update product media" on storage.objects;
create policy "admin: update product media"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'product-media' and public.is_admin())
  with check (bucket_id = 'product-media' and public.is_admin());

drop policy if exists "admin: delete product media" on storage.objects;
create policy "admin: delete product media"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'product-media' and public.is_admin());

-- -----------------------------------------------------------------------------
-- 4. First admin: username "admin"
-- -----------------------------------------------------------------------------
insert into public.admins (email)
values ('admin@scan-to-screen.local')
on conflict (email) do nothing;
