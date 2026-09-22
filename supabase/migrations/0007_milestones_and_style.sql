-- Additive only. Safe on a nest that already ran 0001–0006.
alter table public.children
  add column if not exists nickname text,
  add column if not exists motto text,
  add column if not exists style jsonb not null default '{}'::jsonb;

alter table public.profiles
  add column if not exists avatar_key text,
  add column if not exists color_key text,
  add column if not exists motto text,
  add column if not exists style jsonb not null default '{}'::jsonb;

create table if not exists public.family_milestones (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  lifetime_points integer not null check (lifetime_points between 1 and 1000000),
  title text not null,
  icon text not null default '⭐',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (family_id, lifetime_points)
);

alter table public.family_milestones enable row level security;

drop policy if exists "family milestones" on public.family_milestones;
create policy "family milestones" on public.family_milestones for all to authenticated
  using (family_id in (select private.my_family_ids()))
  with check (family_id in (select private.my_family_ids()));

-- Extra lifetime / streak badges. Existing keys stay the same.
create or replace function private.check_badges(p_child uuid)
returns void language plpgsql security definer set search_path = ''
as $$
declare c public.children%rowtype; done int; rewards_done int;
begin
  select * into c from public.children where id = p_child;
  select count(*) into done from public.chore_completions where child_id = p_child and status = 'approved';
  select count(*) into rewards_done from public.reward_redemptions where child_id = p_child and status in ('approved','fulfilled');
  insert into public.child_badges (child_id, badge_key)
  select p_child, k from unnest(array[
    case when done >= 1   then 'first_quest' end,
    case when done >= 10  then 'quests_10' end,
    case when done >= 10  then 'helper' end,
    case when done >= 50  then 'quests_50' end,
    case when done >= 100 then 'quests_100' end,
    case when c.lifetime_points >= 25   then 'points_25' end,
    case when c.lifetime_points >= 50   then 'points_50' end,
    case when c.lifetime_points >= 75   then 'points_75' end,
    case when c.lifetime_points >= 100  then 'points_100' end,
    case when c.lifetime_points >= 150  then 'points_150' end,
    case when c.lifetime_points >= 200  then 'points_200' end,
    case when c.lifetime_points >= 250  then 'points_250' end,
    case when c.lifetime_points >= 350  then 'points_350' end,
    case when c.lifetime_points >= 500  then 'points_500' end,
    case when c.lifetime_points >= 750  then 'points_750' end,
    case when c.lifetime_points >= 1000 then 'points_1000' end,
    case when c.lifetime_points >= 1500 then 'points_1500' end,
    case when c.lifetime_points >= 2000 then 'points_2000' end,
    case when c.lifetime_points >= 3000 then 'points_3000' end,
    case when c.lifetime_points >= 5000 then 'points_5000' end,
    case when c.current_streak >= 3  then 'streak_3' end,
    case when c.current_streak >= 7  then 'streak_7' end,
    case when c.current_streak >= 14 then 'streak_14' end,
    case when c.current_streak >= 30 then 'streak_30' end,
    case when rewards_done >= 1 then 'first_reward' end
  ]) as k where k is not null
  on conflict do nothing;
end;
$$;

grant select, insert, update, delete on public.family_milestones to authenticated;
