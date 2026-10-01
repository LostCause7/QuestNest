-- Take a returned chip out of the shared pot. Called before Activity undo
-- erases the ledger row. Safe to re-run.

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
  select coalesce(sum(amount), 0) into raised
    from public.reward_fund_pledges
   where fund_id = fund.id;

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

  if raised <= 0 then
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
