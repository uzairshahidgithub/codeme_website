-- =============================================================================
-- Donation intents — manual donor details + receipt storage
-- Migration: 20260521000000_donation_manual_fields.sql
-- =============================================================================

alter table public.donation_intents
  add column if not exists donor_name text,
  add column if not exists donor_email text,
  add column if not exists donor_phone text,
  add column if not exists donor_notes text,
  add column if not exists receipt_path text;

comment on column public.donation_intents.receipt_path is
  'Private storage path in donation-receipts bucket (signed URL for admin review).';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'donation-receipts',
  'donation-receipts',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "donation-receipts: admin read"
  on storage.objects for select
  using (bucket_id = 'donation-receipts' and public.is_admin());

create policy "donation-receipts: admin write"
  on storage.objects for all
  using (bucket_id = 'donation-receipts' and public.is_admin())
  with check (bucket_id = 'donation-receipts' and public.is_admin());
