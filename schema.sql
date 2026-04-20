
-- Run this in the Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  customer_phone text not null,
  date date not null,
  time text not null,
  services jsonb not null default '[]'::jsonb,
  total numeric not null default 0,
  notes text,
  status text not null default 'pending' check (status in ('pending','confirmed','cancelled')),
  created_at timestamptz not null default now()
);

create table if not exists feedback (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  rating int not null default 5,
  message text not null,
  approved boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists gallery_images (
  id uuid primary key default gen_random_uuid(),
  image_path text not null,
  public_url text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists bookings_active_slot_unique
on bookings (date, time)
where status in ('pending','confirmed');

alter table bookings enable row level security;
alter table feedback enable row level security;
alter table gallery_images enable row level security;

-- Public customers can create bookings and feedback.
create policy if not exists "public_can_insert_bookings"
on bookings for insert to anon, authenticated
with check (true);

create policy if not exists "public_can_view_active_slots"
on bookings for select to anon, authenticated
using (true);

create policy if not exists "public_can_insert_feedback"
on feedback for insert to anon, authenticated
with check (true);

create policy if not exists "public_can_view_approved_feedback"
on feedback for select to anon, authenticated
using (approved = true or auth.role() = 'authenticated');

-- Admin-authenticated users can update records.
create policy if not exists "auth_can_update_bookings"
on bookings for update to authenticated
using (true)
with check (true);

create policy if not exists "auth_can_select_all_feedback"
on feedback for select to authenticated
using (true);

create policy if not exists "auth_can_update_feedback"
on feedback for update to authenticated
using (true)
with check (true);

create policy if not exists "public_can_view_gallery"
on gallery_images for select to anon, authenticated
using (true);

create policy if not exists "auth_can_insert_gallery_rows"
on gallery_images for insert to authenticated
with check (true);

create policy if not exists "auth_can_select_gallery_rows"
on gallery_images for select to authenticated
using (true);

-- Create a public storage bucket called gallery in the Supabase dashboard.
-- Then add storage policies there so authenticated users can upload and the public can read.
