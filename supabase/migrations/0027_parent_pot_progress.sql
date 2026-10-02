-- Parents can set how full a shared pot looks. Kid pledges stay as they are.
-- bonus = parent-set total minus what kids have put in.
-- Safe to re-run.

alter table public.reward_funds
  add column if not exists bonus integer not null default 0;

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
  pledged integer;
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

  select coalesce(sum(amount), 0) into pledged from public.reward_fund_pledges where fund_id = fund.id;
  raised := pledged + coalesce(fund.bonus, 0);
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

  select coalesce(sum(amount), 0) into pledged from public.reward_fund_pledges where fund_id = fund.id;
  raised := pledged + coalesce(fund.bonus, 0);

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

create or replace function public.set_reward_pot_progress(p_reward uuid, p_raised integer)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.rewards%rowtype;
  fund public.reward_funds%rowtype;
  pledged integer;
  want integer;
  kid public.reward_fund_pledges%rowtype;
  red_status public.redemption_status;
begin
  if (select auth.uid()) is null then raise exception 'not allowed'; end if;

  select * into r from public.rewards where id = p_reward and is_active for update;
  if r.id is null then raise exception 'reward not found'; end if;
  if r.family_id not in (select private.my_family_ids()) then raise exception 'not allowed'; end if;
  if position('$' in r.title) > 0 or position('$' in coalesce(r.description, '')) > 0 then
    raise exception 'cash rewards cannot be shared';
  end if;

  want := greatest(0, least(coalesce(p_raised, 0), r.cost));

  select * into fund
    from public.reward_funds
   where reward_id = r.id and status = 'open'
   for update;
  if fund.id is null then
    if want <= 0 then
      return jsonb_build_object('fund_id', null, 'raised', 0, 'target', r.cost, 'filled', false);
    end if;
    insert into public.reward_funds (family_id, reward_id, target, status, bonus)
    values (r.family_id, r.id, r.cost, 'open', want)
    returning * into fund;
    pledged := 0;
  else
    select coalesce(sum(amount), 0) into pledged from public.reward_fund_pledges where fund_id = fund.id;
    update public.reward_funds
       set bonus = want - pledged
     where id = fund.id
    returning * into fund;
  end if;

  if want >= fund.target and pledged > 0 then
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
  elsif want <= 0 and pledged <= 0 then
    delete from public.reward_funds where id = fund.id;
    return jsonb_build_object('fund_id', null, 'raised', 0, 'target', r.cost, 'filled', false);
  end if;

  return jsonb_build_object(
    'fund_id', fund.id,
    'raised', want,
    'target', r.cost,
    'filled', fund.status = 'filled'
  );
end;
$$;

grant execute on function public.set_reward_pot_progress(uuid, integer) to authenticated;

create or replace function public.take_back_pot_chip(p_fund uuid, p_child uuid, p_amount integer)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  fund public.reward_funds%rowtype;
  r public.rewards%rowtype;
  chip integer;
  pledged integer;
  raised integer;
  was_filled boolean;
begin
  if (select auth.uid()) is null then raise exception 'not allowed'; end if;
  if p_amount is null or p_amount < 1 then return; end if;

  select * into fund from public.reward_funds where id = p_fund for update;
  if fund.id is null then return; end if;
  if fund.family_id not in (select private.my_family_ids()) then raise exception 'not allowed'; end if;

  chip := p_amount;
  update public.reward_fund_pledges
     set amount = amount - chip
   where fund_id = fund.id
     and child_id = p_child;
  delete from public.reward_fund_pledges
   where fund_id = fund.id
     and child_id = p_child
     and amount <= 0;

  was_filled := fund.status = 'filled';
  select coalesce(sum(amount), 0) into pledged from public.reward_fund_pledges where fund_id = fund.id;
  raised := pledged + coalesce(fund.bonus, 0);

  if was_filled then
    update public.reward_redemptions
       set status = 'rejected'::public.redemption_status,
           resolved_at = now(),
           resolved_by = (select auth.uid())
     where fund_id = fund.id
       and status in (
         'pending'::public.redemption_status,
         'approved'::public.redemption_status
       );

    if raised < fund.target then
      update public.reward_funds
         set status = 'open',
             filled_at = null
       where id = fund.id;
      select * into r from public.rewards where id = fund.reward_id;
      if r.id is not null and r.stock is not null then
        update public.rewards set stock = stock + 1, updated_at = now() where id = r.id;
      end if;
    end if;
  end if;

  if pledged <= 0 and coalesce(fund.bonus, 0) = 0 then
    delete from public.reward_funds
     where id = fund.id
       and status = 'open'
       and not exists (
         select 1 from public.reward_fund_pledges p where p.fund_id = fund.id
       );
  end if;
end;
$$;

grant execute on function public.take_back_pot_chip(uuid, uuid, integer) to authenticated;
