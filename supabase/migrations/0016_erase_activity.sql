-- Parent Activity undo erases the ledger row and puts points back.
-- Safe to re-run. Requires 0014 (closet_points).

create or replace function private.revert_transaction()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  root_kind public.tx_kind;
  src_kind public.tx_kind;
  src_ref uuid;
begin
  root_kind := old.kind;
  if old.kind = 'refund' and old.ref_id is not null then
    select kind, ref_id into src_kind, src_ref
      from public.point_transactions
     where id = old.ref_id;
    if src_kind is not null then
      root_kind := src_kind;
      if src_kind = 'refund' and src_ref is not null then
        select kind into root_kind
          from public.point_transactions
         where id = src_ref;
      end if;
    end if;
  end if;

  update public.children
     set points_balance  = points_balance - old.amount,
         lifetime_points = greatest(0, lifetime_points - case when old.amount > 0 and old.kind <> 'refund' then old.amount else 0 end),
         closet_points   = greatest(0, closet_points - case
           when root_kind = 'chore' and old.kind = 'chore' and old.amount > 0 then old.amount
           when root_kind = 'chore' and old.kind = 'refund' then old.amount
           else 0
         end)
   where id = old.child_id;
  return old;
end;
$$;

drop trigger if exists tx_revert on public.point_transactions;
create trigger tx_revert
  before delete on public.point_transactions
  for each row execute function private.revert_transaction();

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'point_transactions'
      and policyname = 'family ledger erase'
  ) then
    create policy "family ledger erase" on public.point_transactions
      for delete to authenticated
      using (family_id in (select private.my_family_ids()));
  end if;
end
$$;

create or replace function public.erase_activity(p_tx uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  tx public.point_transactions%rowtype;
  red public.reward_redemptions%rowtype;
  r public.rewards%rowtype;
  leftover record;
begin
  if (select auth.uid()) is null then raise exception 'not allowed'; end if;

  select * into tx from public.point_transactions where id = p_tx;
  if tx.id is null then raise exception 'that activity was not found'; end if;
  if tx.family_id not in (select private.my_family_ids()) then raise exception 'not allowed'; end if;

  if tx.kind = 'chore' and tx.ref_id is not null then
    update public.chore_completions
       set status = 'rejected'::public.completion_status,
           points_awarded = 0,
           note = null
     where id = tx.ref_id
       and status = 'approved'::public.completion_status;
  end if;

  if tx.kind = 'reward' and tx.ref_id is not null then
    select * into red from public.reward_redemptions where id = tx.ref_id for update;
    if red.id is not null and red.status is distinct from 'rejected'::public.redemption_status then
      update public.reward_redemptions
         set status = 'rejected'::public.redemption_status,
             resolved_at = now(),
             resolved_by = (select auth.uid())
       where id = red.id;
      select * into r from public.rewards where id = red.reward_id;
      if r.id is not null and r.stock is not null then
        update public.rewards set stock = stock + 1 where id = r.id;
      end if;
    end if;
  end if;

  delete from public.point_transactions
   where family_id = tx.family_id
     and kind = 'refund'
     and ref_id = tx.id
     and id <> tx.id;

  if tx.ref_id is not null then
    delete from public.point_transactions
     where family_id = tx.family_id
       and kind = 'refund'
       and ref_id = tx.ref_id
       and id <> tx.id;
  end if;

  delete from public.point_transactions where id = tx.id;

  -- Wipe leftover refund-style undos from the previous Activity undo.
  for leftover in
    select id, ref_id
      from public.point_transactions
     where family_id = tx.family_id
       and kind = 'refund'
       and note like 'Undo:%'
  loop
    delete from public.point_transactions where id = leftover.id;
    if leftover.ref_id is not null then
      delete from public.point_transactions where id = leftover.ref_id;
    end if;
  end loop;
end;
$$;

grant execute on function public.erase_activity(uuid) to authenticated;
