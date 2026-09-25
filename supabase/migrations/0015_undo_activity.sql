-- Parent Activity undo: refunds of chore earnings also return Closet Points.
-- Safe to re-run. Requires 0014 (closet_points).

create or replace function private.apply_transaction()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  root_kind public.tx_kind;
  src_kind public.tx_kind;
  src_ref uuid;
begin
  root_kind := new.kind;
  if new.kind = 'refund' and new.ref_id is not null then
    select kind, ref_id into src_kind, src_ref
      from public.point_transactions
     where id = new.ref_id;
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
     set points_balance  = points_balance + new.amount,
         lifetime_points = lifetime_points + case when new.amount > 0 and new.kind <> 'refund' then new.amount else 0 end,
         closet_points   = greatest(0, closet_points + case
           when root_kind = 'chore' and new.kind = 'chore' and new.amount > 0 then new.amount
           when root_kind = 'chore' and new.kind = 'refund' then new.amount
           else 0
         end)
   where id = new.child_id;
  perform private.check_badges(new.child_id);
  return new;
end;
$$;
