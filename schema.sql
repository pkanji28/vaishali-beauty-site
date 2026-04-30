create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  customer_phone text not null,
  service text not null,
  total numeric not null default 0,
  booking_date date not null,
  booking_time text not null,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

alter table public.bookings enable row level security;

drop policy if exists "Allow public insert bookings" on public.bookings;
drop policy if exists "Allow public read bookings" on public.bookings;
drop policy if exists "Allow public update bookings" on public.bookings;
drop policy if exists "Allow public delete bookings" on public.bookings;

create policy "Allow public insert bookings" on public.bookings for insert to anon with check (true);
create policy "Allow public read bookings" on public.bookings for select to anon using (true);
create policy "Allow public update bookings" on public.bookings for update to anon using (true) with check (true);
create policy "Allow public delete bookings" on public.bookings for delete to anon using (true);
