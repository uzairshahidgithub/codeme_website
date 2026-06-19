-- =============================================================================
-- Featured courses + Eduto pricing fields + demo seed data
-- Migration: 20260519000000_featured_courses_seed.sql
-- =============================================================================

alter table public.courses
  add column if not exists is_featured boolean not null default false,
  add column if not exists featured_label text,
  add column if not exists featured_sort_order integer not null default 0,
  add column if not exists price numeric(10, 2) not null default 0,
  add column if not exists original_price numeric(10, 2),
  add column if not exists rating numeric(2, 1) not null default 4.5,
  add column if not exists duration_label text,
  add column if not exists short_description text;

create index if not exists courses_featured_idx
  on public.courses (featured_sort_order, enrolled_count desc)
  where status = 'published' and is_featured = true;

comment on column public.courses.is_featured is 'When true, course appears in homepage highlights and Eduto featured row.';
comment on column public.courses.featured_label is 'Optional badge on featured cards (e.g. Flash Sale, Trending).';

-- ===========================
-- SEED — only when tables are empty (safe to re-run)
-- ===========================
do $$
begin
  if (select count(*) from public.courses) = 0 then
    insert into public.courses (
      title, description, short_description, thumbnail_url, level, instructor_name,
      duration_hours, duration_label, enrolled_count, category, tags, status,
      is_featured, featured_label, featured_sort_order, price, original_price, rating
    ) values
      (
        'React Masterclass',
        'Master React by building scalable web applications. Learn hooks, state management, and modern component architecture.',
        'Master React from scratch and build scalable web apps.',
        'https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=800&q=80',
        'intermediate', 'Sarah J.', 40, '8 Weeks', 1240, 'Frontend', array['React', 'Frontend'],
        'published', true, 'Flash Sale', 1, 4000, 6000, 5.0
      ),
      (
        'Node.js Backend',
        'Build robust backend architectures with Node.js and Express. Focus on REST APIs, databases, and authentication.',
        'Build robust backend architectures with Node.js.',
        'https://images.unsplash.com/photo-1627398242454-45a1465c2479?auto=format&fit=crop&w=800&q=80',
        'intermediate', 'Mike R.', 30, '6 Weeks', 860, 'Backend', array['Node.js', 'API'],
        'published', true, 'Trending', 2, 3500, 5000, 4.8
      ),
      (
        'Kubernetes Deep Dive',
        'Master container orchestration and scaling. Learn to deploy, manage, and optimize enterprise-level clusters.',
        'Master container orchestration and scaling.',
        'https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?auto=format&fit=crop&w=800&q=80',
        'advanced', 'Alex W.', 20, '4 Weeks', 512, 'DevOps', array['Kubernetes', 'DevOps'],
        'published', true, 'New', 3, 5000, 8000, 5.0
      ),
      (
        'Foundations of applied AI',
        'A practitioner-led path from regression basics to a working agent loop. Six modules, three shipped artefacts.',
        'From regression to a working agent loop — no math gatekeeping.',
        'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=800&q=80',
        'beginner', 'Aanya Rao', 8, '2 Weeks', 1240, 'Data Science', array['AI', 'Python'],
        'published', true, 'Featured', 4, 4500, 6500, 4.9
      ),
      (
        'Defensive web security',
        'OWASP top-ten in production. Real attacks, real fixes, real CVEs — including what your linter never finds.',
        'OWASP top-ten with real attacks and fixes.',
        'https://images.unsplash.com/photo-1555949963-aa79dcee981c?auto=format&fit=crop&w=800&q=80',
        'intermediate', 'Marcus Lefèvre', 12, '3 Weeks', 860, 'Security', array['Security', 'OWASP'],
        'published', false, null, 0, 3500, 5000, 4.7
      ),
      (
        'Designing with TypeScript',
        'From TS as syntax tax to using the type system to design correct software. Generics, variance, branded types.',
        'Use the type system to design correct software.',
        'https://images.unsplash.com/photo-1516116216624-53e697fedbea?auto=format&fit=crop&w=800&q=80',
        'advanced', 'Priya Krishnan', 10, '5 Weeks', 512, 'Frontend', array['TypeScript'],
        'published', false, null, 0, 4000, null, 4.6
      ),
      (
        'UI/UX Fundamentals',
        'Design engaging digital products. Learn user research, wireframing, and interactive prototyping techniques.',
        'Design engaging digital products from scratch.',
        'https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=800&q=80',
        'beginner', 'Elena P.', 25, '5 Weeks', 410, 'Design', array['Design', 'UX'],
        'published', false, null, 0, 3000, null, 4.5
      ),
      (
        'Data Science with Python',
        'Unlock the power of data. Learn Pandas, NumPy, and predictive modeling for real-world applications.',
        'Unlock the power of data using Python.',
        'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80',
        'intermediate', 'Dr. Alan T.', 50, '10 Weeks', 320, 'Data Science', array['Python', 'ML'],
        'published', false, null, 0, 7500, 10000, 5.0
      );
  end if;

  if (select count(*) from public.events) = 0 then
    insert into public.events (
      title, description, date, type, mode, location_title, location_link, category,
      starts_at, ends_at, status, max_attendees, banner_url, is_recurring
    ) values
      (
        'Threat modelling for indie devs',
        'STRIDE, attack trees and where most teams over-engineer. Bring a side project — leave with a threat model.',
        now() + interval '7 days', 'workshop',
        'online', 'Codemo Discord Stage', null, 'workshop',
        now() + interval '7 days', now() + interval '7 days 2 hours', 'published', 40, null, false
      ),
      (
        'AI agents from zero — build a research bot',
        'Tools, traces and evals. Ship a working agent in two hours with a repo you can extend.',
        now() + interval '10 days', 'bootcamp',
        'online', 'Zoom · link on registration', null, 'bootcamp',
        now() + interval '10 days', now() + interval '10 days 3 hours', 'published', 60, null, false
      ),
      (
        'Career clinic: from junior to staff',
        'Mock reviews, salary calibration and a promo doc that lands. Office hours with staff engineers.',
        now() + interval '21 days', 'seminar',
        'physical', 'Codemo HQ · London', null, 'seminar',
        now() + interval '21 days', now() + interval '21 days 4 hours', 'published', 25, null, false
      ),
      (
        'Web security capture-the-flag',
        'Team-based CTF with beginner and advanced tracks. Prizes for top three teams.',
        now() + interval '14 days', 'hackathon',
        'online', 'Codemo CTF Platform', null, 'hackathon',
        now() + interval '14 days', now() + interval '14 days 6 hours', 'published', 100, null, false
      ),
      (
        'TypeScript architecture patterns',
        'Branded types, dependency injection, and module boundaries at scale.',
        now() + interval '28 days', 'webinar',
        'online', 'Google Meet', null, 'webinar',
        now() + interval '28 days', now() + interval '28 days' + interval '90 minutes', 'published', 80, null, false
      );
  end if;
end $$;
