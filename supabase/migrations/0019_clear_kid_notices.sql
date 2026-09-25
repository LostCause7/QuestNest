-- Wipe yesterday's kid kudos after the family day rolls over.
-- Does not touch point_transactions or chore_miss_penalties.
-- Miss rows are the "already charged" key for mandatory quests — do not delete them.
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
