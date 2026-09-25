-- Closet Points (CP): earned 1:1 with chore points, spent to buy locked looks.

alter table public.children
  add column if not exists closet_points integer not null default 0;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'children_closet_points_nonneg'
      and conrelid = 'public.children'::regclass
  ) then
    alter table public.children
      add constraint children_closet_points_nonneg check (closet_points >= 0);
  end if;
end
$$;

update public.children c
   set closet_points = greatest(0, coalesce((
     select sum(t.amount)
       from public.point_transactions t
      where t.child_id = c.id
        and t.kind = 'chore'
        and t.amount > 0
   ), 0));

create or replace function private.apply_transaction()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  update public.children
     set points_balance  = points_balance + new.amount,
         lifetime_points = lifetime_points + case when new.amount > 0 and new.kind <> 'refund' then new.amount else 0 end,
         closet_points   = closet_points + case when new.amount > 0 and new.kind = 'chore' then new.amount else 0 end
   where id = new.child_id;
  perform private.check_badges(new.child_id);
  return new;
end;
$$;

create or replace function public.buy_closet_item(p_child uuid, p_item_key text, p_cost integer)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  c public.children%rowtype;
begin
  if p_cost is null or p_cost < 1 or p_cost > 1000000 then
    raise exception 'invalid cost';
  end if;
  if p_item_key is null or length(p_item_key) < 3 or length(p_item_key) > 64 then
    raise exception 'invalid item';
  end if;

  select * into c from public.children where id = p_child for update;
  if not found then raise exception 'kid not found'; end if;
  if c.closet_points < p_cost then raise exception 'not enough closet points'; end if;

  update public.children
     set closet_points = closet_points - p_cost
   where id = p_child;

  insert into public.child_unlock_gifts (family_id, child_id, item_key)
  values (c.family_id, p_child, p_item_key)
  on conflict (child_id, item_key) do nothing;

  return c.closet_points - p_cost;
end;
$$;

grant execute on function public.buy_closet_item(uuid, text, integer) to authenticated;
