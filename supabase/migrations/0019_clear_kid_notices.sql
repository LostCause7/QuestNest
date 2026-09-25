-- Wipe kid-only notice rows after the family day rolls over.
-- Does not touch point_transactions (points stay). Safe to re-run.

grant delete on public.chore_miss_penalties to authenticated;

drop policy if exists "family miss penalties write" on public.chore_miss_penalties;
create policy "family miss penalties write" on public.chore_miss_penalties
  for delete to authenticated
  using (family_id in (select private.my_family_ids()));

create or replace function public.clear_kid_notices(p_family uuid, p_today date)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then raise exception 'not allowed'; end if;
  if p_family not in (select private.my_family_ids()) then raise exception 'not allowed'; end if;

  -- Banner rows only. Ledger deductions stay on point_transactions.
  delete from public.chore_miss_penalties
   where family_id = p_family
     and for_date < p_today;

  delete from public.child_kudos k
   using public.families f
   where k.family_id = p_family
     and f.id = p_family
     and (timezone(f.timezone, k.created_at))::date < p_today;
end;
$$;

grant execute on function public.clear_kid_notices(uuid, date) to authenticated;
