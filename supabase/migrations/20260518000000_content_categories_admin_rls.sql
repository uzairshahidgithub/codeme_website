-- =============================================================================
-- Content categories + courses extensions + profile-based admin RLS
-- Migration: 20260518000000_content_categories_admin_rls.sql
-- =============================================================================

-- ===========================
-- CONTENT CATEGORIES (events + courses)
-- ===========================
create table if not exists public.content_categories (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null,
  label       text not null,
  kind        text not null check (kind in ('event', 'course')),
  color       text not null default '#3B82F6',
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (slug, kind)
);

comment on table public.content_categories is 'Admin-managed topic categories for events and courses.';

create trigger content_categories_updated_at
  before update on public.content_categories
  for each row execute procedure public.handle_updated_at();

alter table public.content_categories enable row level security;

create policy "content_categories: public read"
  on public.content_categories for select
  using (true);

create policy "content_categories: admin write"
  on public.content_categories for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'super_admin')
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'super_admin')
    )
  );

insert into public.content_categories (slug, label, kind, color, sort_order) values
  ('webinar',    'Webinar',    'event',  '#3B82F6', 1),
  ('bootcamp',   'Bootcamp',   'event',  '#10B981', 2),
  ('workshop',   'Workshop',   'event',  '#F59E0B', 3),
  ('hackathon',  'Hackathon',  'event',  '#EF4444', 4),
  ('seminar',    'Seminar',    'event',  '#06B6D4', 5),
  ('conference', 'Conference', 'event',  '#EC4899', 6),
  ('other',      'Other',      'event',  '#2D7FF9', 7),
  ('ai',         'AI',         'course', '#8B5CF6', 1),
  ('security',   'Security',   'course', '#EF4444', 2),
  ('typescript', 'TypeScript', 'course', '#3B82F6', 3),
  ('web',        'Web',        'course', '#10B981', 4),
  ('devops',     'DevOps',     'course', '#F59E0B', 5)
on conflict (slug, kind) do nothing;

-- ===========================
-- COURSES — category + tags
-- ===========================
alter table public.courses
  add column if not exists category text,
  add column if not exists tags text[] default '{}';

-- ===========================
-- EVENTS — allow dynamic categories (admin-managed slugs)
-- ===========================
alter table public.events drop constraint if exists events_category_check;

-- ===========================
-- ADMIN RLS via profiles.role (works without JWT custom hook)
-- ===========================
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('admin', 'super_admin')
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- Events
drop policy if exists "events: admin write" on public.events;
create policy "events: admin write"
  on public.events for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "events: admin read all" on public.events;
create policy "events: admin read all"
  on public.events for select
  using (public.is_admin());

-- Courses
drop policy if exists "courses: admin write" on public.courses;
create policy "courses: admin write"
  on public.courses for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "courses: admin read all" on public.courses;
create policy "courses: admin read all"
  on public.courses for select
  using (public.is_admin());
