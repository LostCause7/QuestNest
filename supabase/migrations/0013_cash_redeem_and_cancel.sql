-- Kids pick a $5-step amount on cash rewards (name/description contains $).
-- They can cancel a pending or approved (not delivered) redemption for a refund.
-- Additive. Safe if 0001–0012 already ran.

-- 500 points ≈ $10, so each $5 step is 250 points. Cap $50 = 2500 points.
drop function if exists public.redeem_reward(uuid, uuid);
drop function if exists public.redeem_reward(uuid, uuid, integer);

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
    'reward',
    red.id,
    case when is_cash then r.title || ' ($' || (charge / 50)::text || ')' else r.title end,
    (select auth.uid())
  );

  if r.stock is not null then update public.rewards set stock = stock - 1 where id = r.id; end if;
  return red;
end;
$$;

grant execute on function public.redeem_reward(uuid, uuid, integer) to authenticated;

-- Keep the two-arg form so older clients and PostgREST still resolve a redeem without p_cost.
create or replace function public.redeem_reward(p_reward uuid, p_child uuid)
returns public.reward_redemptions
language sql
security invoker
set search_path = ''
as $$
  select * from public.redeem_reward(p_reward, p_child, null::integer);
$$;

grant execute on function public.redeem_reward(uuid, uuid) to authenticated;

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
      'refund',
      red.id,
      case when p_action = 'cancel' then 'Changed mind: ' else 'Refund: ' end || coalesce(r.title, 'Reward'),
      (select auth.uid())
    );
    if r.stock is not null then update public.rewards set stock = stock + 1 where id = r.id; end if;
  else
    raise exception 'invalid action % for status %', p_action, red.status;
  end if;
  return red;
end;
$$;
