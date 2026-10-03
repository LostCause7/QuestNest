-- Kids can chip points into a shared pot. When it fills, every kid who
-- put toward it gets the reward. Safe to re-run.

create table if not exists public.reward_funds (
  id         uuid primary key default gen_random_uuid(),
  family_id  uuid not null references public.families(id) on delete cascade,
  reward_id  uuid not null references public.rewards(id) on delete cascade,
  target     integer not null check (target > 0),
  status     text not null default 'open' check (status in ('open', 'filled')),
  created_at timestamptz not null default now(),
  filled_at  timestamptz
);

create unique index if not exists reward_funds_one_open
  on public.reward_funds (reward_id)
  where status = 'open';

create table if not exists public.reward_fund_pledges (
  id         uuid primary key default gen_random_uuid(),
  fund_id    uuid not null references public.reward_funds(id) on delete cascade,
  family_id  uuid not null references public.families(id) on delete cascade,
  child_id   uuid not null references public.children(id) on delete cascade,
  amount     integer not null check (amount > 0),
  created_at timestamptz not null default now(),
  unique (fund_id, child_id)
);

create index if not exists reward_fund_pledges_fund on public.reward_fund_pledges (fund_id);
create index if not exists reward_funds_family on public.reward_funds (family_id, status);

alter table public.reward_funds enable row level security;
alter table public.reward_fund_pledges enable row level security;

drop policy if exists "family reward funds" on public.reward_funds;
create policy "family reward funds" on public.reward_funds for all to authenticated
  using (family_id in (select private.my_family_ids()))
  with check (family_id in (select private.my_family_ids()));

drop policy if exists "family reward pledges" on public.reward_fund_pledges;
create policy "family reward pledges" on public.reward_fund_pledges for all to authenticated
  using (family_id in (select private.my_family_ids()))
  with check (family_id in (select private.my_family_ids()));

alter table public.reward_redemptions
  add column if not exists fund_id uuid references public.reward_funds(id) on delete set null;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
     where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'reward_funds'
  ) then
    alter publication supabase_realtime add table public.reward_funds;
  end if;
  if not exists (
    select 1 from pg_publication_tables
     where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'reward_fund_pledges'
  ) then
    alter publication supabase_realtime add table public.reward_fund_pledges;
  end if;
end $$;

create or replace function public.contribute_to_reward(p_reward uuid, p_child uuid, p_amount integer)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.rewards%rowtype;
  c public.children%rowtype;
  fund public.reward_funds%rowtype;
  pledge public.reward_fund_pledges%rowtype;
  raised integer;
  remaining integer;
  chip integer;
  kid public.reward_fund_pledges%rowtype;
  red_status public.redemption_status;
begin
  if (select auth.uid()) is null then raise exception 'not allowed'; end if;
  if p_amount is null or p_amount < 1 then raise exception 'pick an amount'; end if;

  select * into r from public.rewards where id = p_reward and is_active for update;
  if r.id is null then raise exception 'reward not found'; end if;
  if r.family_id not in (select private.my_family_ids()) then raise exception 'not allowed'; end if;
  if position('$' in r.title) > 0 or position('$' in coalesce(r.description, '')) > 0 then
    raise exception 'cash rewards cannot be shared';
  end if;
  if r.stock is not null and r.stock <= 0 then raise exception 'out of stock'; end if;

  if exists (select 1 from public.reward_assignments a where a.reward_id = r.id)
     and not exists (select 1 from public.reward_assignments a where a.reward_id = r.id and a.child_id = p_child) then
    raise exception 'that reward is not in your shop';
  end if;

  select * into c from public.children where id = p_child and family_id = r.family_id for update;
  if c.id is null then raise exception 'child not found'; end if;
  if c.points_balance < 1 then raise exception 'not enough points'; end if;

  select * into fund
    from public.reward_funds
   where reward_id = r.id and status = 'open'
   for update;
  if fund.id is null then
    begin
      insert into public.reward_funds (family_id, reward_id, target, status)
      values (r.family_id, r.id, r.cost, 'open')
      returning * into fund;
    exception when unique_violation then
      select * into fund
        from public.reward_funds
       where reward_id = r.id and status = 'open'
       for update;
    end;
  end if;

  select coalesce(sum(amount), 0) into raised from public.reward_fund_pledges where fund_id = fund.id;
  remaining := fund.target - raised;
  if remaining <= 0 then raise exception 'that pot is already full'; end if;

  chip := least(p_amount, remaining, c.points_balance);
  if chip < 1 then raise exception 'not enough points'; end if;

  insert into public.reward_fund_pledges (fund_id, family_id, child_id, amount)
  values (fund.id, r.family_id, c.id, chip)
  on conflict (fund_id, child_id) do update
    set amount = public.reward_fund_pledges.amount + excluded.amount
  returning * into pledge;

  insert into public.point_transactions (family_id, child_id, amount, kind, ref_id, note, created_by)
  values (r.family_id, c.id, -chip, 'reward'::public.tx_kind, fund.id, 'Toward ' || r.title, (select auth.uid()));

  select coalesce(sum(amount), 0) into raised from public.reward_fund_pledges where fund_id = fund.id;

  if raised >= fund.target then
    if r.requires_approval then
      red_status := 'pending'::public.redemption_status;
    else
      red_status := 'approved'::public.redemption_status;
    end if;

    for kid in select * from public.reward_fund_pledges where fund_id = fund.id loop
      insert into public.reward_redemptions (family_id, reward_id, child_id, status, cost_at_time, resolved_at, fund_id)
      values (
        r.family_id,
        r.id,
        kid.child_id,
        red_status,
        kid.amount,
        case when r.requires_approval then null else now() end,
        fund.id
      );
    end loop;

    if r.stock is not null then
      update public.rewards set stock = greatest(0, stock - 1), updated_at = now() where id = r.id;
    end if;

    update public.reward_funds
       set status = 'filled', filled_at = now()
     where id = fund.id
    returning * into fund;
  end if;

  return jsonb_build_object(
    'fund_id', fund.id,
    'raised', raised,
    'target', fund.target,
    'filled', fund.status = 'filled',
    'my_amount', pledge.amount,
    'chipped', chip
  );
end;
$$;

grant execute on function public.contribute_to_reward(uuid, uuid, integer) to authenticated;

-- Don't let a sibling buy the last copy alone after a pot has already started.
create or replace function public.redeem_reward(p_reward uuid, p_child uuid, p_cost integer default null)
returns public.reward_redemptions language plpgsql security invoker set search_path = ''
as $$
declare
  r public.rewards%rowtype;
  c public.children%rowtype;
  red public.reward_redemptions%rowtype;
  charge integer;
  is_cash boolean;
begin
  select * into r from public.rewards where id = p_reward and is_active for update;
  if r.id is null then raise exception 'reward not found'; end if;
  select * into c from public.children where id = p_child and family_id = r.family_id for update;
  if c.id is null then raise exception 'child not found'; end if;
  if r.stock is not null and r.stock <= 0 then raise exception 'out of stock'; end if;

  if exists (
    select 1
      from public.reward_funds f
      join public.reward_fund_pledges p on p.fund_id = f.id
     where f.reward_id = r.id and f.status = 'open'
  ) then
    raise exception 'put toward the shared pot instead';
  end if;

  is_cash := position('$' in r.title) > 0 or position('$' in coalesce(r.description, '')) > 0;
  if is_cash then
    charge := coalesce(p_cost, r.cost);
    if charge is null or charge <= 0 then raise exception 'pick an amount'; end if;
    if mod(charge, 250) <> 0 then raise exception 'amount must be in $5 steps'; end if;
    if charge > 2500 then raise exception 'that amount is too big'; end if;
  else
    charge := r.cost;
  end if;

  if c.points_balance < charge then raise exception 'not enough points'; end if;

  insert into public.reward_redemptions (family_id, reward_id, child_id, status, cost_at_time, resolved_at)
  values (
    r.family_id,
    p_reward,
    p_child,
    case when r.requires_approval then 'pending'::public.redemption_status else 'approved'::public.redemption_status end,
    charge,
    case when r.requires_approval then null else now() end
  )
  returning * into red;

  insert into public.point_transactions (family_id, child_id, amount, kind, ref_id, note, created_by)
  values (
    r.family_id,
    p_child,
    -charge,
    'reward'::public.tx_kind,
    red.id,
    case when is_cash then r.title || ' ($' || (charge / 50)::text || ')' else r.title end,
    (select auth.uid())
  );

  if r.stock is not null then update public.rewards set stock = stock - 1 where id = r.id; end if;
  return red;
end;
$$;

grant execute on function public.redeem_reward(uuid, uuid, integer) to authenticated;

-- One redeem_reward only. A 2-arg overload plus a 3-arg default makes
-- PostgREST throw "could not choose the best candidate function".
drop function if exists public.redeem_reward(uuid, uuid);

-- A filled pot decrements stock once. Only put it back if every contributor
-- cancels or is declined.
create or replace function public.resolve_redemption(p_redemption uuid, p_action text)
returns public.reward_redemptions language plpgsql security invoker set search_path = ''
as $$
declare red public.reward_redemptions%rowtype; r public.rewards%rowtype;
begin
  select * into red from public.reward_redemptions where id = p_redemption for update;
  if red.id is null then raise exception 'not found'; end if;
  select * into r from public.rewards where id = red.reward_id;

  if p_action = 'approve' and red.status = 'pending' then
    update public.reward_redemptions
       set status = 'approved'::public.redemption_status, resolved_at = now(), resolved_by = (select auth.uid())
     where id = red.id returning * into red;
  elsif p_action = 'fulfill' and red.status in ('pending'::public.redemption_status, 'approved'::public.redemption_status) then
    update public.reward_redemptions
       set status = 'fulfilled'::public.redemption_status, resolved_at = now(), resolved_by = (select auth.uid())
     where id = red.id returning * into red;
  elsif (p_action = 'reject' and red.status = 'pending'::public.redemption_status)
     or (p_action = 'cancel' and red.status in ('pending'::public.redemption_status, 'approved'::public.redemption_status)) then
    update public.reward_redemptions
       set status = 'rejected'::public.redemption_status, resolved_at = now(), resolved_by = (select auth.uid())
     where id = red.id returning * into red;
    insert into public.point_transactions (family_id, child_id, amount, kind, ref_id, note, created_by)
    values (
      red.family_id,
      red.child_id,
      red.cost_at_time,
      'refund'::public.tx_kind,
      red.id,
      case when p_action = 'cancel' then 'Changed mind: ' else 'Refund: ' end || coalesce(r.title, 'Reward'),
      (select auth.uid())
    );
    if r.stock is not null then
      if red.fund_id is null then
        update public.rewards set stock = stock + 1 where id = r.id;
      elsif not exists (
        select 1 from public.reward_redemptions x
         where x.fund_id = red.fund_id
           and x.id <> red.id
           and x.status in (
             'pending'::public.redemption_status,
             'approved'::public.redemption_status,
             'fulfilled'::public.redemption_status
           )
      ) then
        update public.rewards set stock = stock + 1 where id = r.id;
      end if;
    end if;
  else
    raise exception 'invalid action % for status %', p_action, red.status;
  end if;
  return red;
end;
$$;

grant execute on function public.resolve_redemption(uuid, text) to authenticated;
