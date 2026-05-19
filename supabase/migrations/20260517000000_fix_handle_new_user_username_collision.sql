-- =============================================================================
-- Migration: Fix handle_new_user trigger to prevent silent profile failures
-- on username collisions. Appends a short UID suffix when the desired
-- username is already taken, ensuring the profile row is ALWAYS created.
-- =============================================================================

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_username text;
  v_suffix   text;
begin
  -- Derive the desired username from metadata, falling back to email local-part
  v_username := coalesce(
    nullif(trim(new.raw_user_meta_data->>'username'), ''),
    split_part(new.email, '@', 1)
  );

  -- Sanitize: keep only alphanumeric + underscores, truncate to 20 chars
  v_username := regexp_replace(v_username, '[^a-zA-Z0-9_]', '', 'g');
  v_username := left(v_username, 20);

  -- If sanitized result is empty, use 'user'
  if v_username = '' then
    v_username := 'user';
  end if;

  -- If username already taken, append first 6 chars of user UUID
  if exists (select 1 from public.profiles where username = v_username) then
    v_suffix := left(replace(new.id::text, '-', ''), 6);
    v_username := left(v_username, 14) || '_' || v_suffix;
  end if;

  insert into public.profiles (id, username, first_name, avatar_url, dob, gender, domain, status)
  values (
    new.id,
    v_username,
    coalesce(
      nullif(trim(new.raw_user_meta_data->>'first_name'), ''),
      v_username
    ),
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
