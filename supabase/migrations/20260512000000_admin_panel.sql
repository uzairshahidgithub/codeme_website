-- =============================================================================
-- Admin panel — role system, JWT hook, RLS, stats view, articles stub
-- Migration: 20260512000000_admin_panel.sql
-- =============================================================================

-- ===========================
-- Extend profiles.role to allow super_admin
-- ===========================
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('member', 'moderator', 'admin', 'super_admin'));

-- ===========================
-- ARTICLES (stub — extended in a future articles sprint)
-- Needed by admin_stats view today
-- ===========================
create table if not exists public.articles (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  slug        text unique not null,
  excerpt     text,
  body        text not null default '',
  author_id   uuid references auth.users(id) on delete set null,
  status      text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  published_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.articles is 'Editorial articles — surfaced on /articles and admin panel.';

create trigger articles_updated_at
  before update on public.articles
  for each row execute procedure public.handle_updated_at();

alter table public.articles enable row level security;

create policy "articles: public read published"
  on public.articles for select
  using (status = 'published');

create policy "articles: admin all"
  on public.articles for all
  using ((auth.jwt() ->> 'role') in ('admin', 'super_admin'))
  with check ((auth.jwt() ->> 'role') in ('admin', 'super_admin'));

-- ===========================
-- ADMIN RLS — events, courses, testimonials, profiles
-- Admins can read every row regardless of status; write is gated by role.
-- Existing public-read policies remain in force; these are additive.
-- ===========================
create policy "events: admin read all"
  on public.events for select
  using ((auth.jwt() ->> 'role') in ('admin', 'super_admin'));

create policy "events: admin write"
  on public.events for all
  using ((auth.jwt() ->> 'role') in ('admin', 'super_admin'))
  with check ((auth.jwt() ->> 'role') in ('admin', 'super_admin'));

create policy "courses: admin read all"
  on public.courses for select
  using ((auth.jwt() ->> 'role') in ('admin', 'super_admin'));

create policy "courses: admin write"
  on public.courses for all
  using ((auth.jwt() ->> 'role') in ('admin', 'super_admin'))
  with check ((auth.jwt() ->> 'role') in ('admin', 'super_admin'));

create policy "testimonials: admin read all"
  on public.testimonials for select
  using ((auth.jwt() ->> 'role') in ('admin', 'super_admin'));

create policy "testimonials: admin write"
  on public.testimonials for all
  using ((auth.jwt() ->> 'role') in ('admin', 'super_admin'))
  with check ((auth.jwt() ->> 'role') in ('admin', 'super_admin'));

create policy "profiles: admin read all"
  on public.profiles for select
  using ((auth.jwt() ->> 'role') in ('admin', 'super_admin'));

-- super_admin can promote/demote any user; normal admin cannot edit roles.
create policy "profiles: super_admin write"
  on public.profiles for update
  using ((auth.jwt() ->> 'role') = 'super_admin')
  with check ((auth.jwt() ->> 'role') = 'super_admin');

-- audit_log: admins can read; nobody can write directly (Edge Functions use service role)
create policy "audit_log: admin read"
  on public.audit_log for select
  using ((auth.jwt() ->> 'role') in ('admin', 'super_admin'));

-- site_content: admins can update (used by admin/settings page)
create policy "site_content: admin write"
  on public.site_content for all
  using ((auth.jwt() ->> 'role') in ('admin', 'super_admin'))
  with check ((auth.jwt() ->> 'role') in ('admin', 'super_admin'));

-- ===========================
-- CUSTOM ACCESS TOKEN HOOK
-- Injects profiles.role into every issued JWT under `claims.role`.
-- Enable in Dashboard: Auth → Hooks → Custom Access Token →
-- select public.custom_access_token_hook.
-- ===========================
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
as $$
declare
  user_role text;
  claims    jsonb;
begin
  select p.role into user_role
  from public.profiles p
  where p.id = (event ->> 'user_id')::uuid;

  claims := event -> 'claims';

  if user_role is not null then
    claims := jsonb_set(claims, '{role}', to_jsonb(user_role));
  else
    claims := jsonb_set(claims, '{role}', to_jsonb('member'::text));
  end if;

  event := jsonb_set(event, '{claims}', claims);
  return event;
end;
$$;

grant execute on function public.custom_access_token_hook to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook from authenticated, anon, public;

comment on function public.custom_access_token_hook is
  'Supabase Auth Hook: injects public.profiles.role into JWT claims.role on every token issuance.';

-- ===========================
-- ADMIN_STATS view
-- Read-only aggregate for the admin dashboard.
-- ===========================
create or replace view public.admin_stats as
select
  (select count(*) from auth.users)                                                   as total_users,
  (select count(*) from auth.users where created_at > now() - interval '7 days')      as new_users_week,
  (select count(*) from auth.users where created_at > now() - interval '30 days')     as new_users_month,
  (select count(*) from auth.users where last_sign_in_at > now() - interval '24 hours') as active_today,
  (select count(*) from public.events where status = 'published')                     as active_events,
  (select count(*) from public.courses where status = 'published')                    as active_courses,
  (select count(*) from public.testimonials where approved = false)                   as pending_testimonials,
  (select count(*) from public.articles where status = 'draft')                       as draft_articles;

-- The view aggregates from auth.users which is owned by supabase_auth_admin.
-- Grant the view to authenticated; the policies below restrict to admins.
grant select on public.admin_stats to authenticated;

-- Views in public can be hit by any authenticated user without policies; we
-- enforce admin-only access via a security barrier function instead.
create or replace function public.get_admin_stats()
returns public.admin_stats
language sql
security definer
set search_path = public
as $$
  select * from public.admin_stats limit 1;
$$;

revoke execute on function public.get_admin_stats() from public, anon;
grant execute on function public.get_admin_stats() to authenticated;

-- Wrap the function with a role check at call time (Edge Function or RPC client).
-- Frontend calls supabase.rpc('get_admin_stats_secured') instead.
create or replace function public.get_admin_stats_secured()
returns public.admin_stats
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_role text;
  result      public.admin_stats;
begin
  caller_role := (auth.jwt() ->> 'role');
  if caller_role is null or caller_role not in ('admin', 'super_admin') then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  select * into result from public.admin_stats limit 1;
  return result;
end;
$$;

revoke execute on function public.get_admin_stats_secured() from public, anon;
grant execute on function public.get_admin_stats_secured() to authenticated;

-- ===========================
-- USER GROWTH (last 30 days, daily counts) — for the dashboard line chart
-- ===========================
create or replace function public.get_user_growth_30d()
returns table (day date, signups bigint)
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_role text;
begin
  caller_role := (auth.jwt() ->> 'role');
  if caller_role is null or caller_role not in ('admin', 'super_admin') then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return query
    select d::date as day,
           coalesce((select count(*) from auth.users u where u.created_at::date = d::date), 0) as signups
      from generate_series((now() - interval '29 days')::date, now()::date, interval '1 day') d
      order by d;
end;
$$;

revoke execute on function public.get_user_growth_30d() from public, anon;
grant execute on function public.get_user_growth_30d() to authenticated;

-- ===========================
-- ROLE BREAKDOWN — for the dashboard donut chart
-- ===========================
create or replace function public.get_role_breakdown()
returns table (role text, total bigint)
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_role text;
begin
  caller_role := (auth.jwt() ->> 'role');
  if caller_role is null or caller_role not in ('admin', 'super_admin') then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return query
    select p.role::text, count(*)::bigint
      from public.profiles p
      group by p.role
      order by count(*) desc;
end;
$$;

revoke execute on function public.get_role_breakdown() from public, anon;
grant execute on function public.get_role_breakdown() to authenticated;
