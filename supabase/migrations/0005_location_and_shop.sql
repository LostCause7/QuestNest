-- Family home area (city/state + radius) and per-kid shop assignments.
alter table public.families
  add column if not exists location_city text,
  add column if not exists location_state text,
  add column if not exists location_lat double precision,
  add column if not exists location_lng double precision,
  add column if not exists location_radius_miles integer not null default 30
    check (location_radius_miles between 5 and 100);

alter table public.rewards
  add column if not exists source_key text;

create unique index if not exists rewards_family_source_key
  on public.rewards (family_id, source_key)
  where source_key is not null;

create table if not exists public.reward_assignments (
  reward_id uuid not null references public.rewards(id) on delete cascade,
  child_id  uuid not null references public.children(id) on delete cascade,
  primary key (reward_id, child_id)
);

alter table public.reward_assignments enable row level security;

drop policy if exists "family reward assignments" on public.reward_assignments;
create policy "family reward assignments" on public.reward_assignments for all to authenticated
  using (reward_id in (select id from public.rewards where family_id in (select private.my_family_ids())))
  with check (reward_id in (select id from public.rewards where family_id in (select private.my_family_ids())));
