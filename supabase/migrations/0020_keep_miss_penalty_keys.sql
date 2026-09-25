-- 0019 deleted chore_miss_penalties as "notices", but those rows are the
-- unique key that keeps settle_mandatory_penalties from charging twice.
-- Every page load then re-applied last week's misses to every kid.
-- Safe to re-run.

create or replace function public.clear_kid_notices(p_family uuid, p_today date)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then raise exception 'not allowed'; end if;
  if p_family not in (select private.my_family_ids()) then raise exception 'not allowed'; end if;

  delete from public.child_kudos k
   using public.families f
   where k.family_id = p_family
     and f.id = p_family
     and (timezone(f.timezone, k.created_at))::date < p_today;
end;
$$;

grant execute on function public.clear_kid_notices(uuid, date) to authenticated;

drop policy if exists "family miss penalties write" on public.chore_miss_penalties;
revoke delete on public.chore_miss_penalties from authenticated;

-- Put back the extra Missed: charges from the leak (last 8 days = settle window).
-- Deleting a ledger row runs tx_revert, so balances go back up.
-- The next settle then applies each miss once.
delete from public.point_transactions
 where kind = 'penalty'
   and note like 'Missed:%'
   and created_at >= (current_timestamp - interval '8 days');

delete from public.chore_miss_penalties
 where for_date >= (current_date - 8);
