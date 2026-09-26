-- One Stripe subscription per nest. Covers every parent and kid on that account.
-- Additive. Safe to re-run.

alter table public.families
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text,
  add column if not exists subscription_status text,
  add column if not exists subscription_period_end timestamptz;

create unique index if not exists families_stripe_customer_uidx
  on public.families (stripe_customer_id)
  where stripe_customer_id is not null;

notify pgrst, 'reload schema';
