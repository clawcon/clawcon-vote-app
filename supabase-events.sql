-- events + event-scoped submissions/votes RPC
--
-- This app expects:
-- - public.events table with a unique slug
-- - public.submissions.event_id (FK to events)
-- - RPC: get_submissions_with_votes(_event_slug text)

create extension if not exists "pgcrypto";

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  slug text not null unique,
  name text null,
  city text null,
  starts_at timestamptz null,
  ends_at timestamptz null,
  is_public boolean not null default true
);

alter table public.events enable row level security;

drop policy if exists "Public can read events" on public.events;
create policy "Public can read events"
  on public.events
  for select
  using (true);

-- Add event_id to submissions if missing
alter table public.submissions
  add column if not exists event_id uuid null;

do $$
begin
  -- Add FK if it doesn't exist
  if not exists (
    select 1
    from pg_constraint
    where conname = 'submissions_event_id_fkey'
  ) then
    alter table public.submissions
      add constraint submissions_event_id_fkey
      foreign key (event_id)
      references public.events(id)
      on delete set null;
  end if;
end $$;

-- Event-scoped RPC (new)
create or replace function public.get_submissions_with_votes(_event_slug text)
returns table (
  id uuid,
  title text,
  description text,
  presenter_name text,
  links text[],
  submission_type text,
  submitted_by text,
  submitted_for_name text,
  created_at timestamptz,
  vote_count integer
)
language sql
security definer
set search_path = public
stable
as $$
  select
    s.id,
    s.title,
    s.description,
    s.presenter_name,
    s.links,
    s.submission_type,
    s.submitted_by,
    s.submitted_for_name,
    s.created_at,
    coalesce(v.vote_count, 0) as vote_count
  from public.submissions s
  join public.events e on e.id = s.event_id
  left join (
    select submission_id, count(*)::int as vote_count
    from public.votes
    group by submission_id
  ) v on v.submission_id = s.id
  where e.slug = _event_slug
  order by coalesce(v.vote_count, 0) desc, s.created_at desc;
$$;

grant execute on function public.get_submissions_with_votes(text) to anon, authenticated;
