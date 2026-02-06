-- sponsors
create table if not exists public.sponsors (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  city text not null,
  name text not null,
  url text null,
  kind text not null check (kind in ('in-kind','credits','awards','prizes','grants','challenges')),
  contribution text null,
  notes text null,
  logo_url text null
);

alter table public.sponsors enable row level security;

drop policy if exists "Public can read sponsors" on public.sponsors;
create policy "Public can read sponsors"
  on public.sponsors
  for select
  using (true);

drop policy if exists "Authenticated can submit sponsors" on public.sponsors;
create policy "Authenticated can submit sponsors"
  on public.sponsors
  for insert
  to authenticated
  with check (true);
