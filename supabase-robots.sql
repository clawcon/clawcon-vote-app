-- robots
create table if not exists public.robots (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  city text not null,
  robot_name text not null,
  maker_name text not null,
  emergence_date date not null
);

alter table public.robots enable row level security;

drop policy if exists "Public can read robots" on public.robots;
create policy "Public can read robots"
  on public.robots
  for select
  using (true);

drop policy if exists "Authenticated can submit robots" on public.robots;
create policy "Authenticated can submit robots"
  on public.robots
  for insert
  to authenticated
  with check (true);
