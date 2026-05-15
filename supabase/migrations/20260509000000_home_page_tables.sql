-- =============================================================================
-- Home page content tables
-- Migration: 20260509000000_home_page_tables.sql
-- =============================================================================

-- ===========================
-- EVENTS
-- ===========================
create table if not exists public.events (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,
  description     text not null default '',
  date            timestamptz not null,
  banner_url      text,
  type            text not null default 'Event',
  seats_remaining integer,
  status          text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table public.events is 'Community events surfaced on the home page and /events.';

create trigger events_updated_at
  before update on public.events
  for each row execute procedure public.handle_updated_at();

create index if not exists events_date_idx on public.events (date) where status = 'published';

alter table public.events enable row level security;

create policy "events: public read published"
  on public.events for select
  using (status = 'published');

-- Service role manages writes (admin UI / migrations)
create policy "events: no public write"
  on public.events for all
  using (false)
  with check (false);

-- ===========================
-- TESTIMONIALS
-- ===========================
create table if not exists public.testimonials (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  role        text,
  content     text not null,
  rating      integer not null default 5 check (rating between 1 and 5),
  avatar_url  text,
  approved    boolean not null default false,
  order_index integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.testimonials is 'Approved community testimonials on the home page.';

create trigger testimonials_updated_at
  before update on public.testimonials
  for each row execute procedure public.handle_updated_at();

alter table public.testimonials enable row level security;

create policy "testimonials: public read approved"
  on public.testimonials for select
  using (approved = true);

create policy "testimonials: no public write"
  on public.testimonials for all
  using (false)
  with check (false);

-- ===========================
-- SITE_CONTENT
-- Key/value store for editable home-page copy (founder message, etc.)
-- ===========================
create table if not exists public.site_content (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

comment on table public.site_content is 'Editable site-wide content keyed by slug. Public read.';

create trigger site_content_updated_at
  before update on public.site_content
  for each row execute procedure public.handle_updated_at();

alter table public.site_content enable row level security;

create policy "site_content: public read"
  on public.site_content for select
  using (true);

create policy "site_content: no public write"
  on public.site_content for all
  using (false)
  with check (false);

-- ===========================
-- COURSES (eLearn highlights)
-- Single-project model post-ADR-0008. Originally lived in a separate Supabase
-- project; consolidated here.
-- ===========================
create table if not exists public.courses (
  id                       uuid primary key default gen_random_uuid(),
  title                    text not null,
  description              text not null default '',
  thumbnail_url            text,
  level                    text not null default 'beginner' check (level in ('beginner', 'intermediate', 'advanced')),
  instructor_name          text not null default '',
  instructor_avatar_url    text,
  duration_hours           integer not null default 1,
  enrolled_count           integer not null default 0,
  status                   text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

comment on table public.courses is 'eLearn courses surfaced on the home page and /elearn.';

create trigger courses_updated_at
  before update on public.courses
  for each row execute procedure public.handle_updated_at();

alter table public.courses enable row level security;

create policy "courses: public read published"
  on public.courses for select
  using (status = 'published');

create policy "courses: no public write"
  on public.courses for all
  using (false)
  with check (false);

-- ===========================
-- SEED — founder message placeholder
-- ===========================
insert into public.site_content (key, value)
values (
  'founder_message',
  jsonb_build_object(
    'name', 'Riccardo Conte',
    'role', 'Founder, Codemo Teams',
    'photo_url', null,
    'paragraphs', jsonb_build_array(
      'We started Codemo because three communities — Code Motion, Code Motivation and Code Movement — kept solving the same problem in three slightly different rooms. So we tore down the walls.',
      'The mission is simple. Talent has no limits and money should never be the gatekeeper to a career in technology. If you can show up and do the work, we will meet you halfway with the channels, the tutorials and the people who have already walked the path.',
      'This page is just the doorway. The community lives behind it.'
    )
  )
)
on conflict (key) do nothing;
