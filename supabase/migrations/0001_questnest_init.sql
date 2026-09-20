-- ============================================================
-- QuestNest v1 schema  (run once in the Supabase SQL Editor)
-- ============================================================
create extension if not exists pgcrypto;
create schema if not exists private;

-- Enums ------------------------------------------------------
create type public.recurrence        as enum ('once','daily','weekly','custom');
create type public.completion_status as enum ('pending','approved','rejected');
create type public.redemption_status as enum ('pending','approved','rejected','fulfilled');
create type public.tx_kind           as enum ('chore','reward','refund','bonus','penalty','adjustment');
create type public.member_role       as enum ('owner','parent');

-- Tables -----------------------------------------------------
create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url   text,
  created_at   timestamptz not null default now()
);

create table public.families (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  owner_id       uuid not null references auth.users(id) on delete cascade,
  currency_name  text not null default 'Stars',
  currency_emoji text not null default '⭐',
  timezone       text not null default 'America/Chicago',
  created_at     timestamptz not null default now()
);

create table public.family_members (
  family_id  uuid not null references public.families(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  role       public.member_role not null default 'parent',
  created_at timestamptz not null default now(),
  primary key (family_id, user_id)
);

create table public.children (
  id               uuid primary key default gen_random_uuid(),
  family_id        uuid not null references public.families(id) on delete cascade,
  name             text not null,
  avatar           text not null default 'fox',
  color            text not null default 'sky',
  points_balance   integer not null default 0,
  lifetime_points  integer not null default 0,
  current_streak   integer not null default 0,
  longest_streak   integer not null default 0,
  last_streak_date date,
  sort_order       integer not null default 0,
  is_active        boolean not null default true,
  created_at       timestamptz not null default now()
);

create table public.child_pins (
  child_id uuid primary key references public.children(id) on delete cascade,
  pin_hash text not null
);

create table public.parent_pins (
  family_id uuid primary key references public.families(id) on delete cascade,
  pin_hash  text not null
);

create table public.chores (
  id                uuid primary key default gen_random_uuid(),
  family_id         uuid not null references public.families(id) on delete cascade,
  title             text not null,
  description       text,
  icon              text not null default '🧹',
  points            integer not null check (points >= 0),
  recurrence        public.recurrence not null default 'daily',
  days_of_week      smallint[] not null default '{0,1,2,3,4,5,6}',  -- 0 = Sunday
  requires_approval boolean not null default true,
  is_active         boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create table public.chore_assignments (
  chore_id uuid not null references public.chores(id) on delete cascade,
  child_id uuid not null references public.children(id) on delete cascade,
  primary key (chore_id, child_id)
);

create table public.chore_completions (
  id             uuid primary key default gen_random_uuid(),
  family_id      uuid not null references public.families(id) on delete cascade,
  chore_id       uuid not null references public.chores(id) on delete cascade,
  child_id       uuid not null references public.children(id) on delete cascade,
  for_date       date not null default current_date,
  status         public.completion_status not null default 'pending',
  points_awarded integer,
  note           text,
  completed_at   timestamptz not null default now(),
  reviewed_at    timestamptz,
  reviewed_by    uuid references auth.users(id),
  unique (chore_id, child_id, for_date)
);

create table public.rewards (
  id                uuid primary key default gen_random_uuid(),
  family_id         uuid not null references public.families(id) on delete cascade,
  title             text not null,
  description       text,
  icon              text not null default '🎁',
  cost              integer not null check (cost >= 0),
  stock             integer check (stock is null or stock >= 0),   -- null = unlimited
  category          text not null default 'privilege',            -- privilege | item | experience
  requires_approval boolean not null default true,
  is_active         boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create table public.reward_redemptions (
  id           uuid primary key default gen_random_uuid(),
  family_id    uuid not null references public.families(id) on delete cascade,
  reward_id    uuid not null references public.rewards(id) on delete cascade,
  child_id     uuid not null references public.children(id) on delete cascade,
  status       public.redemption_status not null default 'pending',
  cost_at_time integer not null,
  requested_at timestamptz not null default now(),
  resolved_at  timestamptz,
  resolved_by  uuid references auth.users(id)
);

create table public.point_transactions (
  id         uuid primary key default gen_random_uuid(),
  family_id  uuid not null references public.families(id) on delete cascade,
  child_id   uuid not null references public.children(id) on delete cascade,
  amount     integer not null,
  kind       public.tx_kind not null,
  ref_id     uuid,
  note       text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table public.child_badges (
  child_id  uuid not null references public.children(id) on delete cascade,
  badge_key text not null,
  earned_at timestamptz not null default now(),
  primary key (child_id, badge_key)
);

create index on public.children (family_id);
create index on public.chores (family_id);
create index on public.chore_completions (family_id, for_date);
create index on public.chore_completions (child_id, status);
create index on public.reward_redemptions (family_id, status);
create index on public.point_transactions (child_id, created_at desc);

-- Private helpers (not exposed via API) ---------------------
create or replace function private.my_family_ids()
returns setof uuid
language sql stable security definer set search_path = ''
as $$
  select family_id from public.family_members where user_id = (select auth.uid());
$$;

create or replace function private.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (new.id,
          coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email,'@',1)),
          new.raw_user_meta_data->>'avatar_url')
  on conflict (id) do nothing;
  return new;
end;
$$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

create or replace function private.handle_new_family()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.family_members (family_id, user_id, role)
  values (new.id, new.owner_id, 'owner');
  return new;
end;
$$;
create trigger on_family_created
  after insert on public.families
  for each row execute function private.handle_new_family();

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
    case when done >= 50  then 'quests_50' end,
    case when done >= 100 then 'quests_100' end,
    case when c.lifetime_points >= 100  then 'points_100' end,
    case when c.lifetime_points >= 500  then 'points_500' end,
    case when c.lifetime_points >= 1000 then 'points_1000' end,
    case when c.current_streak >= 3  then 'streak_3' end,
    case when c.current_streak >= 7  then 'streak_7' end,
    case when c.current_streak >= 30 then 'streak_30' end,
    case when rewards_done >= 1 then 'first_reward' end
  ]) as k where k is not null
  on conflict do nothing;
end;
$$;

create or replace function private.apply_transaction()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  update public.children
     set points_balance  = points_balance + new.amount,
         lifetime_points = lifetime_points + case when new.amount > 0 and new.kind <> 'refund' then new.amount else 0 end
   where id = new.child_id;
  perform private.check_badges(new.child_id);
  return new;
end;
$$;

create or replace function private.update_streak()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare c public.children%rowtype;
begin
  if new.status = 'approved' and (old.status is distinct from 'approved') then
    select * into c from public.children where id = new.child_id for update;
    if c.last_streak_date is null or c.last_streak_date < new.for_date - 1 then
      c.current_streak := 1;
    elsif c.last_streak_date = new.for_date - 1 then
      c.current_streak := c.current_streak + 1;
    end if; -- same day: streak unchanged
    update public.children
       set current_streak = c.current_streak,
           longest_streak = greatest(longest_streak, c.current_streak),
           last_streak_date = greatest(coalesce(last_streak_date, new.for_date), new.for_date)
     where id = new.child_id;
    perform private.check_badges(new.child_id);
  end if;
  return new;
end;
$$;

create or replace function private.touch_updated_at()
returns trigger language plpgsql set search_path = ''
as $$ begin new.updated_at = now(); return new; end; $$;

create trigger tx_apply      after insert on public.point_transactions for each row execute function private.apply_transaction();
create trigger cc_streak     after update of status on public.chore_completions for each row execute function private.update_streak();
create trigger chores_touch  before update on public.chores  for each row execute function private.touch_updated_at();
create trigger rewards_touch before update on public.rewards for each row execute function private.touch_updated_at();

-- Row Level Security ----------------------------------------
alter table public.profiles           enable row level security;
alter table public.families           enable row level security;
alter table public.family_members     enable row level security;
alter table public.children           enable row level security;
alter table public.child_pins         enable row level security;   -- no policies: function-only
alter table public.parent_pins        enable row level security;   -- no policies: function-only
alter table public.chores             enable row level security;
alter table public.chore_assignments  enable row level security;
alter table public.chore_completions  enable row level security;
alter table public.rewards            enable row level security;
alter table public.reward_redemptions enable row level security;
alter table public.point_transactions enable row level security;
alter table public.child_badges       enable row level security;

create policy "own profile"        on public.profiles for all to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "members read family" on public.families for select to authenticated
  using (id in (select private.my_family_ids()));
create policy "create own family"   on public.families for insert to authenticated
  with check (owner_id = (select auth.uid()));
create policy "members update family" on public.families for update to authenticated
  using (id in (select private.my_family_ids()));
create policy "owner deletes family" on public.families for delete to authenticated
  using (owner_id = (select auth.uid()));

create policy "see co-members" on public.family_members for select to authenticated
  using (family_id in (select private.my_family_ids()));

create policy "family children"     on public.children for all to authenticated
  using (family_id in (select private.my_family_ids())) with check (family_id in (select private.my_family_ids()));
create policy "family chores"       on public.chores for all to authenticated
  using (family_id in (select private.my_family_ids())) with check (family_id in (select private.my_family_ids()));
create policy "family assignments"  on public.chore_assignments for all to authenticated
  using (chore_id in (select id from public.chores where family_id in (select private.my_family_ids())))
  with check (chore_id in (select id from public.chores where family_id in (select private.my_family_ids())));
create policy "family completions"  on public.chore_completions for all to authenticated
  using (family_id in (select private.my_family_ids())) with check (family_id in (select private.my_family_ids()));
create policy "family rewards"      on public.rewards for all to authenticated
  using (family_id in (select private.my_family_ids())) with check (family_id in (select private.my_family_ids()));
create policy "family redemptions"  on public.reward_redemptions for all to authenticated
  using (family_id in (select private.my_family_ids())) with check (family_id in (select private.my_family_ids()));
create policy "family ledger read"  on public.point_transactions for select to authenticated
  using (family_id in (select private.my_family_ids()));
create policy "family ledger write" on public.point_transactions for insert to authenticated
  with check (family_id in (select private.my_family_ids()));
create policy "family badges"       on public.child_badges for select to authenticated
  using (child_id in (select id from public.children where family_id in (select private.my_family_ids())));

-- Public RPCs -------------------------------------------------
create or replace function public.set_child_pin(p_child uuid, p_pin text)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  if p_pin !~ '^[0-9]{4}$' then raise exception 'PIN must be 4 digits'; end if;
  if not exists (select 1 from public.children c where c.id = p_child and c.family_id in (select private.my_family_ids()))
    then raise exception 'not allowed'; end if;
  insert into public.child_pins (child_id, pin_hash) values (p_child, extensions.crypt(p_pin, extensions.gen_salt('bf')))
  on conflict (child_id) do update set pin_hash = excluded.pin_hash;
end;
$$;

create or replace function public.verify_child_pin(p_child uuid, p_pin text)
returns boolean language plpgsql security definer set search_path = ''
as $$
declare h text;
begin
  if not exists (select 1 from public.children c where c.id = p_child and c.family_id in (select private.my_family_ids()))
    then return false; end if;
  select pin_hash into h from public.child_pins where child_id = p_child;
  return h is not null and h = extensions.crypt(p_pin, h);
end;
$$;

create or replace function public.set_parent_pin(p_family uuid, p_pin text)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  if p_pin !~ '^[0-9]{4,6}$' then raise exception 'PIN must be 4-6 digits'; end if;
  if p_family not in (select private.my_family_ids()) then raise exception 'not allowed'; end if;
  insert into public.parent_pins (family_id, pin_hash) values (p_family, extensions.crypt(p_pin, extensions.gen_salt('bf')))
  on conflict (family_id) do update set pin_hash = excluded.pin_hash;
end;
$$;

create or replace function public.verify_parent_pin(p_family uuid, p_pin text)
returns boolean language plpgsql security definer set search_path = ''
as $$
declare h text;
begin
  if p_family not in (select private.my_family_ids()) then return false; end if;
  select pin_hash into h from public.parent_pins where family_id = p_family;
  return h is not null and h = extensions.crypt(p_pin, h);
end;
$$;

create or replace function public.has_parent_pin(p_family uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.parent_pins pp
    where pp.family_id = p_family and p_family in (select private.my_family_ids())
  );
$$;

create or replace function public.complete_chore(p_chore uuid, p_child uuid, p_date date default current_date)
returns public.chore_completions language plpgsql security invoker set search_path = ''
as $$
declare ch public.chores%rowtype; row public.chore_completions%rowtype;
begin
  select * into ch from public.chores where id = p_chore and is_active;
  if ch.id is null then raise exception 'chore not found'; end if;
  if not exists (select 1 from public.chore_assignments where chore_id = p_chore and child_id = p_child)
    then raise exception 'chore not assigned to this child'; end if;

  insert into public.chore_completions (family_id, chore_id, child_id, for_date, status)
  values (ch.family_id, p_chore, p_child, p_date, 'pending')
  returning * into row;

  if not ch.requires_approval then
    -- auto-approve: the UPDATE fires the streak/badge trigger
    update public.chore_completions
       set status = 'approved', points_awarded = ch.points, reviewed_at = now()
     where id = row.id returning * into row;
    insert into public.point_transactions (family_id, child_id, amount, kind, ref_id, note, created_by)
    values (ch.family_id, p_child, ch.points, 'chore', row.id, ch.title, (select auth.uid()));
  end if;
  return row;
end;
$$;

create or replace function public.review_completion(p_completion uuid, p_approve boolean, p_points integer default null)
returns public.chore_completions language plpgsql security invoker set search_path = ''
as $$
declare row public.chore_completions%rowtype; ch public.chores%rowtype;
begin
  select * into row from public.chore_completions where id = p_completion for update;
  if row.id is null then raise exception 'not found'; end if;
  if row.status <> 'pending' then raise exception 'already reviewed'; end if;
  select * into ch from public.chores where id = row.chore_id;

  update public.chore_completions
     set status = case when p_approve then 'approved' else 'rejected' end,
         points_awarded = case when p_approve then coalesce(p_points, ch.points) else 0 end,
         reviewed_at = now(), reviewed_by = (select auth.uid())
   where id = p_completion returning * into row;

  if p_approve then
    insert into public.point_transactions (family_id, child_id, amount, kind, ref_id, note, created_by)
    values (row.family_id, row.child_id, row.points_awarded, 'chore', row.id, ch.title, (select auth.uid()));
  end if;
  return row;
end;
$$;

create or replace function public.redeem_reward(p_reward uuid, p_child uuid)
returns public.reward_redemptions language plpgsql security invoker set search_path = ''
as $$
declare r public.rewards%rowtype; c public.children%rowtype; red public.reward_redemptions%rowtype;
begin
  select * into r from public.rewards where id = p_reward and is_active for update;
  if r.id is null then raise exception 'reward not found'; end if;
  select * into c from public.children where id = p_child and family_id = r.family_id for update;
  if c.id is null then raise exception 'child not found'; end if;
  if c.points_balance < r.cost then raise exception 'not enough points'; end if;
  if r.stock is not null and r.stock <= 0 then raise exception 'out of stock'; end if;

  insert into public.reward_redemptions (family_id, reward_id, child_id, status, cost_at_time, resolved_at)
  values (r.family_id, p_reward, p_child,
          case when r.requires_approval then 'pending' else 'approved' end, r.cost,
          case when r.requires_approval then null else now() end)
  returning * into red;

  insert into public.point_transactions (family_id, child_id, amount, kind, ref_id, note, created_by)
  values (r.family_id, p_child, -r.cost, 'reward', red.id, r.title, (select auth.uid()));

  if r.stock is not null then update public.rewards set stock = stock - 1 where id = r.id; end if;
  return red;
end;
$$;

create or replace function public.resolve_redemption(p_redemption uuid, p_action text)  -- 'approve' | 'reject' | 'fulfill'
returns public.reward_redemptions language plpgsql security invoker set search_path = ''
as $$
declare red public.reward_redemptions%rowtype; r public.rewards%rowtype;
begin
  select * into red from public.reward_redemptions where id = p_redemption for update;
  if red.id is null then raise exception 'not found'; end if;
  select * into r from public.rewards where id = red.reward_id;

  if p_action = 'approve' and red.status = 'pending' then
    update public.reward_redemptions set status = 'approved', resolved_at = now(), resolved_by = (select auth.uid()) where id = red.id returning * into red;
  elsif p_action = 'fulfill' and red.status in ('pending','approved') then
    update public.reward_redemptions set status = 'fulfilled', resolved_at = now(), resolved_by = (select auth.uid()) where id = red.id returning * into red;
  elsif p_action = 'reject' and red.status = 'pending' then
    update public.reward_redemptions set status = 'rejected', resolved_at = now(), resolved_by = (select auth.uid()) where id = red.id returning * into red;
    insert into public.point_transactions (family_id, child_id, amount, kind, ref_id, note, created_by)
    values (red.family_id, red.child_id, red.cost_at_time, 'refund', red.id, 'Refund: ' || r.title, (select auth.uid()));
    if r.stock is not null then update public.rewards set stock = stock + 1 where id = r.id; end if;
  else
    raise exception 'invalid action % for status %', p_action, red.status;
  end if;
  return red;
end;
$$;

create or replace function public.adjust_points(p_child uuid, p_amount integer, p_note text default null)
returns public.point_transactions language plpgsql security invoker set search_path = ''
as $$
declare c public.children%rowtype; tx public.point_transactions%rowtype;
begin
  select * into c from public.children where id = p_child;
  if c.id is null then raise exception 'child not found'; end if;
  if p_amount = 0 then raise exception 'amount must be non-zero'; end if;
  insert into public.point_transactions (family_id, child_id, amount, kind, note, created_by)
  values (c.family_id, p_child, p_amount, case when p_amount > 0 then 'bonus' else 'penalty' end, p_note, (select auth.uid()))
  returning * into tx;
  return tx;
end;
$$;

-- Lock function execution to signed-in users -----------------
revoke execute on all functions in schema public from public, anon;
grant  execute on all functions in schema public to authenticated;

-- Realtime ---------------------------------------------------
alter publication supabase_realtime add table
  public.children, public.chore_completions, public.reward_redemptions, public.point_transactions, public.child_badges;
