-- =============================================================================
-- Donation intents — OCR receipt text stored; images never persisted
-- Migration: 20260520000000_donation_intents.sql
-- =============================================================================

create table if not exists public.donation_intents (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid references auth.users(id) on delete set null,
  amount           numeric(12, 2) not null check (amount >= 100 and amount <= 5000),
  currency         text not null default 'PKR',
  ocr_text         text,
  transaction_id   text,
  extracted_amount numeric(12, 2),
  payment_method   text check (payment_method is null or payment_method in ('jazzcash', 'easypaisa', 'bank', 'other')),
  status           text not null default 'pending'
    check (status in ('pending', 'verified', 'rejected')),
  admin_notes      text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

comment on table public.donation_intents is
  'Manual transfer donations: screenshot OCR text + transaction ref. Images are never stored.';

create index if not exists donation_intents_status_idx on public.donation_intents (status);
create index if not exists donation_intents_created_at_idx on public.donation_intents (created_at desc);
create index if not exists donation_intents_transaction_id_idx on public.donation_intents (transaction_id);

create trigger donation_intents_updated_at
  before update on public.donation_intents
  for each row execute procedure public.handle_updated_at();

alter table public.donation_intents enable row level security;

-- Public can submit donations (logged-in user_id attached when available)
create policy "donation_intents: public insert"
  on public.donation_intents for insert
  with check (true);

-- Signed-in users can read their own submissions
create policy "donation_intents: own read"
  on public.donation_intents for select
  using (auth.uid() is not null and auth.uid() = user_id);

-- Admins manage all rows
create policy "donation_intents: admin all"
  on public.donation_intents for all
  using (public.is_admin())
  with check (public.is_admin());
