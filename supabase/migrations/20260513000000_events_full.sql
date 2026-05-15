-- =============================================================================
-- Events full functionality — schema, RLS, registrations, recurrences, storage
-- Migration: 20260513000000_events_full.sql
-- =============================================================================

-- ===========================
-- EXTEND public.events with the full feature schema
-- The original (home_page_tables) shape used: date, type, seats_remaining.
-- We rename/extend to the new shape. Existing data is migrated via column copy.
-- ===========================

alter table public.events
  add column if not exists mode              text,
  add column if not exists location_title    text,
  add column if not exists location_link     text,
  add column if not exists category          text,
  add column if not exists starts_at         timestamptz,
  add column if not exists ends_at           timestamptz,
  add column if not exists is_recurring      boolean default false,
  add column if not exists recurrence_rule   text,
  add column if not exists recurrence_label  text,
  add column if not exists max_attendees     int,
  add column if not exists cert_template_url text,
  add column if not exists cert_enabled      boolean default false,
  add column if not exists created_by        uuid references auth.users(id) on delete set null;

-- Migrate legacy column data
update public.events
   set starts_at      = coalesce(starts_at, date),
       ends_at        = coalesce(ends_at, date + interval '1 hour'),
       category       = coalesce(category, lower(type)),
       mode           = coalesce(mode, 'online'),
       location_title = coalesce(location_title, 'TBA'),
       max_attendees  = coalesce(max_attendees, seats_remaining)
 where starts_at is null
    or ends_at is null
    or category is null
    or mode is null
    or location_title is null;

-- Map any legacy categories to the new whitelist before adding the constraint
update public.events
   set category = case
                   when category in ('webinar','bootcamp','workshop','hackathon','seminar','conference') then category
                   else 'other'
                  end
 where category is not null;

-- Status constraint: extend with cancelled/completed
alter table public.events drop constraint if exists events_status_check;
alter table public.events add constraint events_status_check
  check (status in ('draft', 'published', 'cancelled', 'completed', 'archived'));

-- Mode + category constraints
alter table public.events drop constraint if exists events_mode_check;
alter table public.events add constraint events_mode_check
  check (mode in ('online', 'physical'));

alter table public.events drop constraint if exists events_category_check;
alter table public.events add constraint events_category_check
  check (category in ('webinar','bootcamp','workshop','hackathon','seminar','conference','other'));

-- NOT NULLs for the new core fields
alter table public.events
  alter column mode           set not null,
  alter column location_title set not null,
  alter column category       set not null,
  alter column starts_at      set not null,
  alter column ends_at        set not null;

-- Range integrity
alter table public.events drop constraint if exists events_duration_check;
alter table public.events add constraint events_duration_check
  check (ends_at > starts_at);

-- Indexes for the new query patterns
create index if not exists events_starts_at_idx on public.events (starts_at) where status = 'published';
create index if not exists events_ends_at_idx   on public.events (ends_at)   where status in ('published','completed');

-- ===========================
-- EVENT REGISTRATIONS
-- ===========================
create table if not exists public.event_registrations (
  id            uuid primary key default gen_random_uuid(),
  event_id      uuid not null references public.events(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  registered_at timestamptz not null default now(),
  attended      boolean not null default false,
  cert_issued   boolean not null default false,
  cert_url      text,
  unique (event_id, user_id)
);

comment on table public.event_registrations is 'Attendee registrations + attendance + cert issuance per event.';

create index if not exists event_registrations_event_idx on public.event_registrations (event_id);
create index if not exists event_registrations_user_idx  on public.event_registrations (user_id);

alter table public.event_registrations enable row level security;

-- Users see only their own registrations
create policy "event_registrations: user reads own"
  on public.event_registrations for select
  using (auth.uid() = user_id);

-- Users can register themselves
create policy "event_registrations: user inserts own"
  on public.event_registrations for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.events e
      where e.id = event_id and e.status = 'published'
    )
  );

-- Admins read every registration
create policy "event_registrations: admin read all"
  on public.event_registrations for select
  using ((auth.jwt() ->> 'role') in ('admin', 'super_admin'));

-- Admins update attendance + cert fields
create policy "event_registrations: admin write"
  on public.event_registrations for update
  using ((auth.jwt() ->> 'role') in ('admin', 'super_admin'))
  with check ((auth.jwt() ->> 'role') in ('admin', 'super_admin'));

-- ===========================
-- RECURRING INSTANCES (admin overrides for specific dates)
-- ===========================
create table if not exists public.event_recurring_instances (
  id             uuid primary key default gen_random_uuid(),
  parent_id      uuid not null references public.events(id) on delete cascade,
  instance_date  date not null,
  overridden     boolean not null default false,
  override_data  jsonb,
  unique (parent_id, instance_date)
);

comment on table public.event_recurring_instances is 'Per-instance overrides for recurring events generated from RRULE.';

create index if not exists event_recurring_instances_parent_idx on public.event_recurring_instances (parent_id);

alter table public.event_recurring_instances enable row level security;

create policy "event_recurring_instances: public read"
  on public.event_recurring_instances for select
  using (true);

create policy "event_recurring_instances: admin write"
  on public.event_recurring_instances for all
  using ((auth.jwt() ->> 'role') in ('admin', 'super_admin'))
  with check ((auth.jwt() ->> 'role') in ('admin', 'super_admin'));

-- ===========================
-- STORAGE BUCKET — event-assets
-- Private bucket. Banners, cert templates, generated certs.
-- Access via signed URLs only.
-- ===========================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'event-assets',
  'event-assets',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Storage RLS: admins can write anywhere in event-assets
create policy "event-assets: admin write"
  on storage.objects for all
  using (bucket_id = 'event-assets' and (auth.jwt() ->> 'role') in ('admin', 'super_admin'))
  with check (bucket_id = 'event-assets' and (auth.jwt() ->> 'role') in ('admin', 'super_admin'));

-- Authenticated users may read banners (signed URL is generated server-side anyway)
create policy "event-assets: authed read banners"
  on storage.objects for select
  using (bucket_id = 'event-assets' and (storage.foldername(name))[1] = 'banners');

-- Each user may read their own generated cert under generated-certs/{event_id}/{user_id}.pdf
create policy "event-assets: user reads own cert"
  on storage.objects for select
  using (
    bucket_id = 'event-assets'
    and (storage.foldername(name))[1] = 'generated-certs'
    and auth.uid()::text = split_part(name, '/', 3)
  );
