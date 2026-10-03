-- Fix: column "kind" is of type public.tx_kind but expression is of type text.
-- Adds an assignment cast so PostgREST / plpgsql text can write the ledger.
--
-- Safe to re-run. Does NOT delete, update, or replace:
--   auth.users, families, family_members, children, profiles, or nest rows.
-- Does NOT replace complete_chore / review_completion / redeem_reward.

do $$
begin
  if not exists (
    select 1
      from pg_cast c
      join pg_type src on src.oid = c.castsource
      join pg_type dst on dst.oid = c.casttarget
      join pg_namespace n on n.oid = dst.typnamespace
     where src.typname = 'text'
       and dst.typname = 'tx_kind'
       and n.nspname = 'public'
  ) then
    create cast (text as public.tx_kind) with inout as assignment;
  end if;

  if not exists (
    select 1
      from pg_cast c
      join pg_type src on src.oid = c.castsource
      join pg_type dst on dst.oid = c.casttarget
      join pg_namespace n on n.oid = dst.typnamespace
     where src.typname = 'varchar'
       and dst.typname = 'tx_kind'
       and n.nspname = 'public'
  ) then
    create cast (varchar as public.tx_kind) with inout as assignment;
  end if;
end
$$;

-- Small helper only. Same row insert as the app already does.
create or replace function public.record_points(
  p_family uuid,
  p_child uuid,
  p_amount integer,
  p_kind text,
  p_ref uuid default null,
  p_note text default null
)
returns public.point_transactions
language plpgsql
security invoker
set search_path = ''
as $$
declare tx public.point_transactions%rowtype;
begin
  if p_kind is null or p_kind not in ('chore','reward','refund','bonus','penalty','adjustment') then
    raise exception 'invalid tx kind';
  end if;
  insert into public.point_transactions (family_id, child_id, amount, kind, ref_id, note, created_by)
  values (
    p_family,
    p_child,
    p_amount,
    p_kind::public.tx_kind,
    p_ref,
    p_note,
    (select auth.uid())
  )
  returning * into tx;
  return tx;
end;
$$;

grant execute on function public.record_points(uuid, uuid, integer, text, uuid, text) to authenticated;

notify pgrst, 'reload schema';
