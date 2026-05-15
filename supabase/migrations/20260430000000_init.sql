-- =============================================================================
-- Codemo Teams — Initial Schema
-- Migration: 20260430000000_init.sql
-- =============================================================================

-- Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- =============================================================================
-- PROFILES
-- Extended user data that lives alongside Supabase Auth's auth.users table.
-- auth.users is managed by Supabase; we never touch it directly.
-- =============================================================================
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  username      text unique not null,
  first_name    text not null default '',
  avatar_url    text,
  dob           date,
  gender        text check (gender in ('Male', 'Female', 'Not Listed')),
  domain        text,
  status        text check (status in ('Freelancer', 'Student', 'Employed', 'Unemployed', 'Business Owner')),
  level         integer not null default 1,
  role          text not null default 'member' check (role in ('member', 'moderator', 'admin')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.profiles is 'Extended profile data for authenticated users.';

-- Keep updated_at current automatically
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

-- Auto-create a profile row when a new auth user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username, first_name, avatar_url, dob, gender, domain, status)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'first_name', new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'avatar_url', null),
    case
      when new.raw_user_meta_data->>'dob' is not null
      then (new.raw_user_meta_data->>'dob')::date
      else null
    end,
    new.raw_user_meta_data->>'gender',
    new.raw_user_meta_data->>'domain',
    new.raw_user_meta_data->>'status'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =============================================================================
-- AUDIT_LOG
-- Immutable event log. Rows are insert-only; no updates, no deletes.
-- =============================================================================
create table if not exists public.audit_log (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete set null,
  action      text not null,
  metadata    jsonb,
  ip          inet,
  created_at  timestamptz not null default now()
);

comment on table public.audit_log is 'Immutable audit trail. Insert-only.';

-- =============================================================================
-- RLS — PROFILES
-- =============================================================================
alter table public.profiles enable row level security;

-- Anyone can read any public profile (username, avatar, level, domain)
create policy "profiles: public read"
  on public.profiles for select
  using (true);

-- Users can only update their own profile
create policy "profiles: own write"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Insert is handled by the trigger (security definer); block direct inserts
create policy "profiles: no direct insert"
  on public.profiles for insert
  with check (false);

-- Deletion cascades from auth.users via ON DELETE CASCADE; block direct deletes
create policy "profiles: no direct delete"
  on public.profiles for delete
  using (false);

-- =============================================================================
-- RLS — AUDIT_LOG
-- =============================================================================
alter table public.audit_log enable row level security;

-- Service role only (Edge Functions use service role key — bypasses RLS)
-- Regular authenticated users cannot read or write audit_log
create policy "audit_log: deny all"
  on public.audit_log for all
  using (false)
  with check (false);

-- =============================================================================
-- STORAGE — user-avatars bucket
-- =============================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'user-avatars',
  'user-avatars',
  false,
  2097152, -- 2 MiB
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

-- Users can read only their own avatar
create policy "avatars: own read"
  on storage.objects for select
  using (bucket_id = 'user-avatars' and auth.uid()::text = (storage.foldername(name))[1]);

-- Users can upload/replace only their own avatar
create policy "avatars: own insert"
  on storage.objects for insert
  with check (bucket_id = 'user-avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "avatars: own update"
  on storage.objects for update
  using (bucket_id = 'user-avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "avatars: own delete"
  on storage.objects for delete
  using (bucket_id = 'user-avatars' and auth.uid()::text = (storage.foldername(name))[1]);
