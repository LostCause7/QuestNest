-- ============================================================
-- Fix: "Launch my nest" failed with
--   new row violates row-level security policy for table "families"
--
-- INSERT ... RETURNING must also pass the SELECT policy. That policy
-- only allowed family members, and my_family_ids() was STABLE so it
-- could not see the membership row the trigger inserted in the same
-- statement. Owners can now read their own family, and the helper
-- is VOLATILE so it sees the new membership immediately.
-- ============================================================

create or replace function private.my_family_ids()
returns setof uuid
language sql volatile security definer set search_path = ''
as $$
  select family_id from public.family_members where user_id = (select auth.uid());
$$;

drop policy if exists "members read family" on public.families;
create policy "members read family" on public.families for select to authenticated
  using (owner_id = (select auth.uid()) or id in (select private.my_family_ids()));

drop policy if exists "owner adds members" on public.family_members;
create policy "owner adds members" on public.family_members for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and family_id in (select id from public.families where owner_id = (select auth.uid()))
  );
