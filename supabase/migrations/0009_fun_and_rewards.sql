-- Fun & reward loops: family look settings, bonus rules, kudos, gifted looks,
-- daily awards and new trophies. Additive only. Safe if 0001–0008 already ran.

-- Part A: family-wide look + bonus knobs -------------------------------------
alter table public.families
  add column if not exists style jsonb not null default '{}'::jsonb,
  add column if not exists daily_bonus_points   integer not null default 0 check (daily_bonus_points between 0 and 1000),
  add column if not exists combo_bonus_points   integer not null default 0 check (combo_bonus_points between 0 and 1000),
  add column if not exists surprise_chance      integer not null default 0 check (surprise_chance between 0 and 100),
  add column if not exists perfect_day_points   integer not null default 0 check (perfect_day_points between 0 and 1000);

alter table public.children
  add column if not exists cheer text;

alter table public.chores
  add column if not exists kind text not null default 'quest' check (kind in ('quest','kindness'));

alter table public.rewards
  add column if not exists rarity text check (rarity is null or rarity in ('rare','epic','legendary'));

-- Part B: awards + kudos -----------------------------------------------------
create table if not exists public.child_day_awards (
  family_id  uuid not null references public.families(id) on delete cascade,
  child_id   uuid not null references public.children(id) on delete cascade,
  for_date   date not null,
  kind       text not null,           -- daily | combo | mystery | perfect_day | comeback
  points     integer not null default 0,
  created_at timestamptz not null default now(),
  primary key (child_id, for_date, kind)
);

create table if not exists public.child_kudos (
  id         uuid primary key default gen_random_uuid(),
  family_id  uuid not null references public.families(id) on delete cascade,
  child_id   uuid not null references public.children(id) on delete cascade,
  emoji      text not null default '💖',
  message    text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

-- Part C: parent-gifted looks -----------------------------------------------
create table if not exists public.child_unlock_gifts (
  family_id  uuid not null references public.families(id) on delete cascade,
  child_id   uuid not null references public.children(id) on delete cascade,
  item_key   text not null,           -- "kind:key" e.g. "frame:rainbow"
  created_at timestamptz not null default now(),
  primary key (child_id, item_key)
);

create index if not exists child_day_awards_family_idx on public.child_day_awards (family_id, for_date desc);
create index if not exists child_kudos_child_idx on public.child_kudos (child_id, created_at desc);

alter table public.child_day_awards   enable row level security;
alter table public.child_kudos        enable row level security;
alter table public.child_unlock_gifts enable row level security;

drop policy if exists "family day awards" on public.child_day_awards;
create policy "family day awards" on public.child_day_awards for select to authenticated
  using (family_id in (select private.my_family_ids()));

drop policy if exists "family kudos" on public.child_kudos;
create policy "family kudos" on public.child_kudos for all to authenticated
  using (family_id in (select private.my_family_ids()))
  with check (family_id in (select private.my_family_ids()));

drop policy if exists "family unlock gifts" on public.child_unlock_gifts;
create policy "family unlock gifts" on public.child_unlock_gifts for all to authenticated
  using (family_id in (select private.my_family_ids()))
  with check (family_id in (select private.my_family_ids()));

grant select on public.child_day_awards to authenticated;
grant select, insert, update, delete on public.child_kudos to authenticated;
grant select, insert, update, delete on public.child_unlock_gifts to authenticated;

-- Trophies -------------------------------------------------------------------
create or replace function private.check_badges(p_child uuid)
returns void language plpgsql security definer set search_path = ''
as $$
declare c public.children%rowtype; done int; rewards_done int; perfect int; kind_done int; combos int;
begin
  select * into c from public.children where id = p_child;
  select count(*) into done from public.chore_completions where child_id = p_child and status = 'approved';
  select count(*) into rewards_done from public.reward_redemptions where child_id = p_child and status in ('approved','fulfilled');
  select count(*) into perfect from public.child_day_awards where child_id = p_child and kind = 'perfect_day';
  select count(*) into combos  from public.child_day_awards where child_id = p_child and kind = 'combo';
  select count(*) into kind_done
    from public.chore_completions cc join public.chores ch on ch.id = cc.chore_id
   where cc.child_id = p_child and cc.status = 'approved' and ch.kind = 'kindness';
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
    case when rewards_done >= 1 then 'first_reward' end,
    case when perfect >= 1   then 'perfect_day_1' end,
    case when perfect >= 7   then 'perfect_week' end,
    case when kind_done >= 10 then 'kindness_10' end,
    case when combos >= 5    then 'combo_5' end
  ]) as k where k is not null
  on conflict do nothing;
end;
$$;

-- Daily reward loops ---------------------------------------------------------
-- Runs after a completion flips to approved (after cc_streak, by trigger name order).
create or replace function private.daily_rewards()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  f public.families%rowtype;
  c public.children%rowtype;
  approved_today int;
  due_total int;
  due_done int;
  roll int;
  dow smallint;
begin
  if not (new.status = 'approved' and old.status is distinct from 'approved') then
    return new;
  end if;

  select * into f from public.families where id = new.family_id;
  select * into c from public.children where id = new.child_id;
  if f.id is null or c.id is null then return new; end if;

  select count(*) into approved_today
    from public.chore_completions
   where child_id = new.child_id and for_date = new.for_date and status = 'approved';

  -- First quest of the day
  if f.daily_bonus_points > 0 and approved_today = 1 then
    insert into public.child_day_awards (family_id, child_id, for_date, kind, points)
    values (new.family_id, new.child_id, new.for_date, 'daily', f.daily_bonus_points)
    on conflict do nothing;
    if found then
      insert into public.point_transactions (family_id, child_id, amount, kind, ref_id, note, created_by)
      values (new.family_id, new.child_id, f.daily_bonus_points, 'bonus'::public.tx_kind, new.id, 'Daily nest bonus', (select auth.uid()));
    end if;
  end if;

  -- Combo: three approved in one day
  if f.combo_bonus_points > 0 and approved_today = 3 then
    insert into public.child_day_awards (family_id, child_id, for_date, kind, points)
    values (new.family_id, new.child_id, new.for_date, 'combo', f.combo_bonus_points)
    on conflict do nothing;
    if found then
      insert into public.point_transactions (family_id, child_id, amount, kind, ref_id, note, created_by)
      values (new.family_id, new.child_id, f.combo_bonus_points, 'bonus'::public.tx_kind, new.id, 'Combo x3', (select auth.uid()));
    end if;
  end if;

  -- Surprise roll on the first approval of the day
  if f.surprise_chance > 0 and approved_today = 1 and (random() * 100) < f.surprise_chance then
    roll := 1 + floor(random() * greatest(1, new.points_awarded))::int;
    insert into public.child_day_awards (family_id, child_id, for_date, kind, points)
    values (new.family_id, new.child_id, new.for_date, 'mystery', roll)
    on conflict do nothing;
    if found then
      insert into public.point_transactions (family_id, child_id, amount, kind, ref_id, note, created_by)
      values (new.family_id, new.child_id, roll, 'bonus'::public.tx_kind, new.id, 'Nest egg!', (select auth.uid()));
    end if;
  end if;

  -- Comeback: first approval after a gap of 2+ days (streak was reset to 1 by cc_streak)
  if approved_today = 1 and c.current_streak <= 1
     and exists (select 1 from public.chore_completions
                  where child_id = new.child_id and status = 'approved' and for_date <= new.for_date - 2)
     and not exists (select 1 from public.chore_completions
                      where child_id = new.child_id and status = 'approved' and for_date = new.for_date - 1) then
    insert into public.child_day_awards (family_id, child_id, for_date, kind, points)
    values (new.family_id, new.child_id, new.for_date, 'comeback', f.daily_bonus_points)
    on conflict do nothing;
    if found and f.daily_bonus_points > 0 then
      insert into public.point_transactions (family_id, child_id, amount, kind, ref_id, note, created_by)
      values (new.family_id, new.child_id, f.daily_bonus_points, 'bonus'::public.tx_kind, new.id, 'Welcome back!', (select auth.uid()));
    end if;
  end if;

  -- Perfect day: every quest due today for this kid is approved
  if f.perfect_day_points > 0 then
    dow := extract(dow from new.for_date)::smallint;
    select count(*) into due_total
      from public.chores ch
      join public.chore_assignments a on a.chore_id = ch.id and a.child_id = new.child_id
     where ch.is_active
       and (ch.recurrence = 'daily'
            or (ch.recurrence in ('weekly','custom') and dow = any(ch.days_of_week))
            or (ch.recurrence = 'once' and not exists (
                  select 1 from public.chore_completions x
                   where x.chore_id = ch.id and x.child_id = new.child_id and x.status = 'approved' and x.for_date <> new.for_date)));
    select count(*) into due_done
      from public.chores ch
      join public.chore_assignments a on a.chore_id = ch.id and a.child_id = new.child_id
      join public.chore_completions cc on cc.chore_id = ch.id and cc.child_id = new.child_id
                                       and cc.for_date = new.for_date and cc.status = 'approved'
     where ch.is_active
       and (ch.recurrence = 'daily'
            or (ch.recurrence in ('weekly','custom') and dow = any(ch.days_of_week))
            or ch.recurrence = 'once');
    if due_total >= 1 and due_done >= due_total then
      insert into public.child_day_awards (family_id, child_id, for_date, kind, points)
      values (new.family_id, new.child_id, new.for_date, 'perfect_day', f.perfect_day_points)
      on conflict do nothing;
      if found then
        insert into public.point_transactions (family_id, child_id, amount, kind, ref_id, note, created_by)
        values (new.family_id, new.child_id, f.perfect_day_points, 'bonus'::public.tx_kind, new.id, 'Perfect day', (select auth.uid()));
      end if;
    end if;
  end if;

  perform private.check_badges(new.child_id);
  return new;
end;
$$;

drop trigger if exists cc_zz_daily_rewards on public.chore_completions;
create trigger cc_zz_daily_rewards
  after update of status on public.chore_completions
  for each row execute function private.daily_rewards();

-- Realtime for the new tables (kid screens celebrate live) --------------------
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'child_day_awards') then
    alter publication supabase_realtime add table public.child_day_awards;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'child_kudos') then
    alter publication supabase_realtime add table public.child_kudos;
  end if;
end $$;
