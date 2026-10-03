-- Kind Heart (and other ledger writes) can fail with:
--   column "kind" is of type public.tx_kind but expression is of type text
-- With search_path = '', plpgsql string literals / CASE / PostgREST text
-- cannot assign to public.tx_kind. Cast every ledger insert. Never copy
-- chores.kind (quest|kindness text) onto point_transactions.kind.
-- Safe to re-run.

-- Trophy insert must never block points, approval, or login settle.
create or replace function private.check_badges(p_child uuid)
returns void language plpgsql security definer set search_path = ''
as $$
declare c public.children%rowtype; done int; rewards_done int; perfect int; kind_done int; combos int;
begin
  select * into c from public.children where id = p_child;
  if c.id is null then return; end if;
  select count(*) into done from public.chore_completions where child_id = p_child and status = 'approved';
  select count(*) into rewards_done from public.reward_redemptions where child_id = p_child and status in ('approved','fulfilled');
  begin
    select count(*) into perfect from public.child_day_awards where child_id = p_child and kind = 'perfect_day';
  exception when undefined_table or undefined_column then
    perfect := 0;
  end;
  begin
    select count(*) into combos from public.child_day_awards where child_id = p_child and kind = 'combo';
  exception when undefined_table or undefined_column then
    combos := 0;
  end;
  begin
    select count(*) into kind_done
      from public.chore_completions cc join public.chores ch on ch.id = cc.chore_id
     where cc.child_id = p_child and cc.status = 'approved' and ch.kind = 'kindness';
  exception when undefined_column then
    kind_done := 0;
  end;
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
exception when others then
  return;
end;
$$;

-- App / PostgREST inserts kind as text. This RPC casts it.
create or replace function public.record_points(
  p_family uuid,
  p_child uuid,
  p_amount integer,
  p_kind text,
  p_ref uuid default null,
  p_note text default null
)
returns public.point_transactions
language plpgsql
security invoker
set search_path = ''
as $$
declare tx public.point_transactions%rowtype;
begin
  if p_kind is null or p_kind not in ('chore','reward','refund','bonus','penalty','adjustment') then
    raise exception 'invalid tx kind';
  end if;
  insert into public.point_transactions (family_id, child_id, amount, kind, ref_id, note, created_by)
  values (
    p_family,
    p_child,
    p_amount,
    p_kind::public.tx_kind,
    p_ref,
    p_note,
    (select auth.uid())
  )
  returning * into tx;
  return tx;
end;
$$;

grant execute on function public.record_points(uuid, uuid, integer, text, uuid, text) to authenticated;

create or replace function public.complete_chore(p_chore uuid, p_child uuid, p_date date default current_date)
returns public.chore_completions language plpgsql security invoker set search_path = ''
as $$
declare ch public.chores%rowtype; row public.chore_completions%rowtype;
begin
  select * into ch from public.chores where id = p_chore and is_active for update;
  if ch.id is null then raise exception 'chore not found'; end if;
  if not exists (select 1 from public.chore_assignments where chore_id = p_chore and child_id = p_child)
    then raise exception 'chore not assigned to this child'; end if;

  if coalesce(ch.single_claim, false)
     and exists (
       select 1 from public.chore_completions
        where chore_id = p_chore
          and for_date = p_date
          and child_id <> p_child
          and status in ('pending'::public.completion_status, 'approved'::public.completion_status)
          and not coalesce(excuse, false)
     )
  then
    raise exception 'quest already claimed today';
  end if;

  select * into row from public.chore_completions
   where chore_id = p_chore and child_id = p_child and for_date = p_date;

  if found then
    if row.status = 'rejected'
       or (row.status = 'pending'::public.completion_status and coalesce(row.excuse, false)) then
      update public.chore_completions
         set status = 'pending'::public.completion_status,
             excuse = false,
             points_awarded = null,
             note = null,
             completed_at = now(),
             reviewed_at = null,
             reviewed_by = null
       where id = row.id returning * into row;
    else
      raise exception 'duplicate key value violates unique constraint chore_completions';
    end if;
  else
    insert into public.chore_completions (family_id, chore_id, child_id, for_date, status, excuse)
    values (ch.family_id, p_chore, p_child, p_date, 'pending'::public.completion_status, false)
    returning * into row;
  end if;

  if not ch.requires_approval then
    update public.chore_completions
       set status = 'approved'::public.completion_status, points_awarded = ch.points, reviewed_at = now(), excuse = false
     where id = row.id returning * into row;
    insert into public.point_transactions (family_id, child_id, amount, kind, ref_id, note, created_by)
    values (ch.family_id, p_child, ch.points, 'chore'::public.tx_kind, row.id, ch.title, (select auth.uid()));
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

  if p_approve and coalesce(row.excuse, false) then
    update public.chore_completions
       set status = 'excused'::public.completion_status,
           points_awarded = 0,
           reviewed_at = now(),
           reviewed_by = (select auth.uid())
     where id = p_completion returning * into row;
    return row;
  end if;

  update public.chore_completions
     set status = case when p_approve then 'approved'::public.completion_status else 'rejected'::public.completion_status end,
         points_awarded = case when p_approve then coalesce(p_points, ch.points) else 0 end,
         reviewed_at = now(), reviewed_by = (select auth.uid())
   where id = p_completion returning * into row;

  if p_approve then
    insert into public.point_transactions (family_id, child_id, amount, kind, ref_id, note, created_by)
    values (row.family_id, row.child_id, row.points_awarded, 'chore'::public.tx_kind, row.id, ch.title, (select auth.uid()));
  end if;
  return row;
end;
$$;

-- Recast leftover shop ledger writes when 0024 already created these functions.
do $outer$
begin
  if exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'redeem_reward'
      and pg_get_function_identity_arguments(p.oid) = 'p_reward uuid, p_child uuid, p_cost integer'
  ) and exists (
    select 1 from information_schema.tables
     where table_schema = 'public' and table_name = 'reward_funds'
  ) then
    execute $fn$
create or replace function public.redeem_reward(p_reward uuid, p_child uuid, p_cost integer default null)
returns public.reward_redemptions language plpgsql security invoker set search_path = ''
as $body$
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
$body$;
    $fn$;
  end if;

  if exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'resolve_redemption'
  ) and exists (
    select 1 from information_schema.columns
     where table_schema = 'public' and table_name = 'reward_redemptions' and column_name = 'fund_id'
  ) then
    execute $fn$
create or replace function public.resolve_redemption(p_redemption uuid, p_action text)
returns public.reward_redemptions language plpgsql security invoker set search_path = ''
as $body$
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
$body$;
    $fn$;
  end if;
end
$outer$;
