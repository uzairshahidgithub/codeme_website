-- =============================================================================
-- Report Phase 1 — dev role, enrollments, home CMS, donation accounts
-- Migration: 20260522000000_report_phase1.sql
-- =============================================================================

-- Dev role for /dev theme editor access
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('member', 'moderator', 'dev', 'admin', 'super_admin'));

create or replace function public.is_dev_or_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('dev', 'admin', 'super_admin')
  );
$$;

revoke all on function public.is_dev_or_admin() from public;
grant execute on function public.is_dev_or_admin() to authenticated;

-- ===========================
-- COURSE ENROLLMENTS (Eduto)
-- ===========================
create table if not exists public.course_enrollments (
  id             uuid primary key default gen_random_uuid(),
  payment_id     text not null unique,
  user_id        uuid references auth.users(id) on delete set null,
  course_id      text not null,
  course_title   text not null,
  student_name   text not null,
  student_email  text not null,
  student_phone  text not null,
  student_city   text not null,
  amount         numeric(12, 2),
  status         text not null default 'pending'
    check (status in ('pending', 'verified', 'cleared')),
  cleared_at     timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists course_enrollments_status_idx on public.course_enrollments (status);
create index if not exists course_enrollments_created_at_idx on public.course_enrollments (created_at desc);

create trigger course_enrollments_updated_at
  before update on public.course_enrollments
  for each row execute procedure public.handle_updated_at();

alter table public.course_enrollments enable row level security;

create policy "course_enrollments: public insert"
  on public.course_enrollments for insert
  with check (true);

create policy "course_enrollments: own read"
  on public.course_enrollments for select
  using (auth.uid() is not null and auth.uid() = user_id);

create policy "course_enrollments: admin all"
  on public.course_enrollments for all
  using (public.is_admin())
  with check (public.is_admin());

-- ===========================
-- DONATION ACCOUNTS
-- ===========================
create table if not exists public.donation_accounts (
  id            uuid primary key default gen_random_uuid(),
  label         text not null,
  account_value text not null,
  account_name  text not null default 'Codemo Teams',
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create trigger donation_accounts_updated_at
  before update on public.donation_accounts
  for each row execute procedure public.handle_updated_at();

alter table public.donation_accounts enable row level security;

create policy "donation_accounts: public read"
  on public.donation_accounts for select
  using (true);

create policy "donation_accounts: admin write"
  on public.donation_accounts for all
  using (public.is_admin())
  with check (public.is_admin());

insert into public.donation_accounts (label, account_value, account_name, sort_order)
select * from (values
  ('JazzCash', '0300 1234567', 'Codemo Teams', 1),
  ('Easypaisa', '0345 7654321', 'Codemo Teams', 2),
  ('Meezan Bank transfer', 'PK36 MEZN 0001 2345 6789 1011', 'Codemo Teams', 3)
) as v(label, account_value, account_name, sort_order)
where not exists (select 1 from public.donation_accounts limit 1);

-- ===========================
-- HOME FEATURED PICKS
-- ===========================
create table if not exists public.home_featured_courses (
  id         uuid primary key default gen_random_uuid(),
  course_id  uuid not null references public.courses(id) on delete cascade,
  sort_order integer not null default 0,
  unique (course_id)
);

create table if not exists public.home_featured_events (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references public.events(id) on delete cascade,
  sort_order integer not null default 0,
  unique (event_id)
);

alter table public.home_featured_courses enable row level security;
alter table public.home_featured_events enable row level security;

create policy "home_featured_courses: public read"
  on public.home_featured_courses for select using (true);
create policy "home_featured_courses: admin write"
  on public.home_featured_courses for all
  using (public.is_admin()) with check (public.is_admin());

create policy "home_featured_events: public read"
  on public.home_featured_events for select using (true);
create policy "home_featured_events: admin write"
  on public.home_featured_events for all
  using (public.is_admin()) with check (public.is_admin());

-- Reach-out portrait URL (home contact section)
insert into public.site_content (key, value)
values ('contact_portrait_url', '{"url":""}'::jsonb)
on conflict (key) do nothing;
