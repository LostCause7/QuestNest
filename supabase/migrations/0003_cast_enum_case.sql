-- CASE 'approved'/'rejected' was inferred as text, which Postgres
-- cannot assign to completion_status / redemption_status enums.
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
     set status = case when p_approve then 'approved'::public.completion_status else 'rejected'::public.completion_status end,
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
          case when r.requires_approval then 'pending'::public.redemption_status else 'approved'::public.redemption_status end, r.cost,
          case when r.requires_approval then null else now() end)
  returning * into red;

  insert into public.point_transactions (family_id, child_id, amount, kind, ref_id, note, created_by)
  values (r.family_id, p_child, -r.cost, 'reward', red.id, r.title, (select auth.uid()));

  if r.stock is not null then update public.rewards set stock = stock - 1 where id = r.id; end if;
  return red;
end;
$$;
