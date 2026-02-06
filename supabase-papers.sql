-- papers
create table if not exists public.papers (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  city text not null,
  title text not null,
  paper_type text not null check (paper_type in ('whitepaper','research','academic','other')),
  authors text not null,
  url text null,
  abstract text null
);

alter table public.papers enable row level security;

drop policy if exists "Public can read papers" on public.papers;
create policy "Public can read papers"
  on public.papers
  for select
  using (true);

drop policy if exists "Authenticated can submit papers" on public.papers;
create policy "Authenticated can submit papers"
  on public.papers
  for insert
  to authenticated
  with check (true);
