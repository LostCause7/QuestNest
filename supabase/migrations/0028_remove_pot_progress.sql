-- Parents can take a kid (or everyone) off a shared pot and return their points.
-- Safe to re-run.

create or replace function public.remove_child_from_reward_pot(p_reward uuid, p_child uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.rewards%rowtype;
  fund public.reward_funds%rowtype;
  pledge public.reward_fund_pledges%rowtype;
  pledged integer;
  raised integer;
begin
  if (select auth.uid()) is null then raise exception 'not allowed'; end if;

  select * into r from public.rewards where id = p_reward for update;
  if r.id is null then raise exception 'reward not found'; end if;
  if r.family_id not in (select private.my_family_ids()) then raise exception 'not allowed'; end if;

  select * into fund
    from public.reward_funds
   where reward_id = r.id and status = 'open'
   for update;
  if fund.id is null then raise exception 'no pot to change'; end if;

  select * into pledge
    from public.reward_fund_pledges
   where fund_id = fund.id and child_id = p_child
   for update;
  if pledge.id is null then raise exception 'that kid is not on this pot'; end if;

  insert into public.point_transactions (family_id, child_id, amount, kind, ref_id, note, created_by)
  values (
    r.family_id,
    p_child,
    pledge.amount,
    'refund'::public.tx_kind,
    fund.id,
    'Returned from pot: ' || r.title,
    (select auth.uid())
  );

  delete from public.reward_fund_pledges where id = pledge.id;

  select coalesce(sum(amount), 0) into pledged from public.reward_fund_pledges where fund_id = fund.id;
  raised := greatest(0, pledged + coalesce(fund.bonus, 0));

  if pledged <= 0 and coalesce(fund.bonus, 0) = 0 then
    delete from public.reward_funds where id = fund.id;
    return jsonb_build_object('fund_id', null, 'raised', 0, 'target', r.cost, 'filled', false, 'refunded', pledge.amount);
  end if;

  return jsonb_build_object(
    'fund_id', fund.id,
    'raised', raised,
    'target', fund.target,
    'filled', false,
    'refunded', pledge.amount
  );
end;
$$;

grant execute on function public.remove_child_from_reward_pot(uuid, uuid) to authenticated;

create or replace function public.clear_reward_pot(p_reward uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.rewards%rowtype;
  fund public.reward_funds%rowtype;
  pledge public.reward_fund_pledges%rowtype;
  refunded integer := 0;
begin
  if (select auth.uid()) is null then raise exception 'not allowed'; end if;

  select * into r from public.rewards where id = p_reward for update;
  if r.id is null then raise exception 'reward not found'; end if;
  if r.family_id not in (select private.my_family_ids()) then raise exception 'not allowed'; end if;

  select * into fund
    from public.reward_funds
   where reward_id = r.id and status = 'open'
   for update;
  if fund.id is null then
    return jsonb_build_object('fund_id', null, 'raised', 0, 'target', r.cost, 'filled', false, 'refunded', 0);
  end if;

  for pledge in select * from public.reward_fund_pledges where fund_id = fund.id loop
    insert into public.point_transactions (family_id, child_id, amount, kind, ref_id, note, created_by)
    values (
      r.family_id,
      pledge.child_id,
      pledge.amount,
      'refund'::public.tx_kind,
      fund.id,
      'Returned from pot: ' || r.title,
      (select auth.uid())
    );
    refunded := refunded + pledge.amount;
  end loop;

  delete from public.reward_funds where id = fund.id;

  return jsonb_build_object(
    'fund_id', null,
    'raised', 0,
    'target', r.cost,
    'filled', false,
    'refunded', refunded
  );
end;
$$;

grant execute on function public.clear_reward_pot(uuid) to authenticated;
