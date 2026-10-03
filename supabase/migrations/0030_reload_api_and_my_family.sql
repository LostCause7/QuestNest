-- After 0029, PostgREST can keep a stale schema and table reads look like
-- "no nest". Reload the API, and add a security-definer lookup so an
-- existing family is still found if the families SELECT policy hiccups.
-- Safe to re-run. Does not create or delete nests.

notify pgrst, 'reload schema';

create or replace function public.my_family()
returns public.families
language sql
stable
security definer
set search_path = ''
as $$
  select f.*
    from public.families f
   where f.owner_id = (select auth.uid())
      or f.id in (
        select family_id from public.family_members where user_id = (select auth.uid())
      )
   order by f.created_at
   limit 1;
$$;

grant execute on function public.my_family() to authenticated;
