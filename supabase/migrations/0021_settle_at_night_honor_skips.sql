-- Mandatory misses: only the one day that just hit 11:50pm (p_through).
-- Approved or pending "Can't Today" never charges that kid.
-- Safe to re-run.

create or replace function public.settle_mandatory_penalties(p_family uuid, p_through date)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  f public.families%rowtype;
  rec record;
  d date;
  dow smallint;
  created_on date;
  kid_id uuid;
  anyone boolean;
  already boolean;
  miss_id uuid;
  applied int := 0;
begin
  if p_family is null or p_through is null then return 0; end if;
  if not (p_family in (select private.my_family_ids())) then
    raise exception 'not allowed';
  end if;

  select * into f from public.families where id = p_family;
  if f.id is null then return 0; end if;

  d := p_through;
  dow := extract(dow from d)::smallint;

  for rec in
    select ch.*
      from public.chores ch
     where ch.family_id = p_family
       and ch.is_active
       and coalesce(ch.mandatory, false)
       and ch.points > 0
  loop
    created_on := (rec.created_at at time zone f.timezone)::date;
    if created_on > d then continue; end if;

    if rec.recurrence = 'once' then
      if d <> created_on then continue; end if;
    elsif rec.recurrence in ('weekly', 'custom') then
      if not (dow = any (rec.days_of_week)) then continue; end if;
    elsif rec.recurrence <> 'daily' then
      continue;
    end if;

    -- Someone actually did it (not a skip) — single-claim is safe for everyone.
    if coalesce(rec.single_claim, false) then
      if rec.recurrence = 'once' then
        select exists (
          select 1 from public.chore_completions
           where chore_id = rec.id
             and status in ('pending'::public.completion_status, 'approved'::public.completion_status)
             and not coalesce(excuse, false)
        ) into anyone;
      else
        select exists (
          select 1 from public.chore_completions
           where chore_id = rec.id
             and for_date = d
             and status in ('pending'::public.completion_status, 'approved'::public.completion_status)
             and not coalesce(excuse, false)
        ) into anyone;
      end if;
      if anyone then continue; end if;
    end if;

    for kid_id in
      select a.child_id
        from public.chore_assignments a
        join public.children c on c.id = a.child_id
       where a.chore_id = rec.id
         and c.is_active
         and (c.created_at at time zone f.timezone)::date <= d
    loop
      -- Done, waiting on approval, pending Can't Today, or parent said that's okay.
      if rec.recurrence = 'once' then
        select exists (
          select 1 from public.chore_completions
           where chore_id = rec.id
             and child_id = kid_id
             and status is distinct from 'rejected'::public.completion_status
             and (
               status = 'excused'::public.completion_status
               or coalesce(excuse, false)
               or status in ('pending'::public.completion_status, 'approved'::public.completion_status)
             )
        ) into already;
      else
        select exists (
          select 1 from public.chore_completions
           where chore_id = rec.id
             and child_id = kid_id
             and for_date = d
             and status is distinct from 'rejected'::public.completion_status
             and (
               status = 'excused'::public.completion_status
               or coalesce(excuse, false)
               or status in ('pending'::public.completion_status, 'approved'::public.completion_status)
             )
        ) into already;
      end if;
      if already then continue; end if;

      miss_id := null;
      insert into public.chore_miss_penalties (family_id, child_id, chore_id, for_date, points)
      values (p_family, kid_id, rec.id, d, rec.points)
      on conflict do nothing
      returning id into miss_id;

      if miss_id is not null then
        insert into public.point_transactions (family_id, child_id, amount, kind, ref_id, note, created_by)
        values (
          p_family,
          kid_id,
          -rec.points,
          'penalty'::public.tx_kind,
          miss_id,
          'Missed: ' || rec.title,
          null
        );
        applied := applied + 1;
      end if;
    end loop;
  end loop;

  return applied;
end;
$$;

grant execute on function public.settle_mandatory_penalties(uuid, date) to authenticated;

-- Undo the afternoon leak burst (same title charged over and over today).
delete from public.point_transactions
 where kind = 'penalty'
   and note like 'Missed:%'
   and created_at >= (current_timestamp - interval '24 hours');

delete from public.chore_miss_penalties
 where created_at >= (current_timestamp - interval '24 hours');
