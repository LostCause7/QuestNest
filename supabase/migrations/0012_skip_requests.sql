-- Kids can ask to skip a quest today. Parent confirms. Confirmed skips
-- award no points and do not trigger a mandatory miss penalty.
-- Additive. Safe if 0001–0011 already ran.

alter type public.completion_status add value if not exists 'excused';

alter table public.chores
  add column if not exists single_claim boolean not null default false,
  add column if not exists mandatory boolean not null default false,
  add column if not exists allow_skip boolean not null default false;

alter table public.chore_completions
  add column if not exists excuse boolean not null default false;

-- Done taps ignore sibling skip-requests so another kid can still claim.
create or replace function public.complete_chore(p_chore uuid, p_child uuid, p_date date default current_date)
returns public.chore_completions language plpgsql security invoker set search_path = ''
as $$
declare ch public.chores%rowtype; row public.chore_completions%rowtype;
begin
  select * into ch from public.chores where id = p_chore and is_active for update;
  if ch.id is null then raise exception 'chore not found'; end if;
  if not exists (select 1 from public.chore_assignments where chore_id = p_chore and child_id = p_child)
    then raise exception 'chore not assigned to this child'; end if;

  if coalesce(ch.single_claim, false)
     and exists (
       select 1 from public.chore_completions
        where chore_id = p_chore
          and for_date = p_date
          and child_id <> p_child
          and status in ('pending'::public.completion_status, 'approved'::public.completion_status)
          and not coalesce(excuse, false)
     )
  then
    raise exception 'quest already claimed today';
  end if;

  select * into row from public.chore_completions
   where chore_id = p_chore and child_id = p_child and for_date = p_date;

  if found then
    if row.status = 'rejected'
       or (row.status = 'pending'::public.completion_status and coalesce(row.excuse, false)) then
      update public.chore_completions
         set status = 'pending'::public.completion_status,
             excuse = false,
             points_awarded = null,
             note = null,
             completed_at = now(),
             reviewed_at = null,
             reviewed_by = null
       where id = row.id returning * into row;
    else
      raise exception 'duplicate key value violates unique constraint chore_completions';
    end if;
  else
    insert into public.chore_completions (family_id, chore_id, child_id, for_date, status, excuse)
    values (ch.family_id, p_chore, p_child, p_date, 'pending'::public.completion_status, false)
    returning * into row;
  end if;

  if not ch.requires_approval then
    update public.chore_completions
       set status = 'approved'::public.completion_status, points_awarded = ch.points, reviewed_at = now(), excuse = false
     where id = row.id returning * into row;
    insert into public.point_transactions (family_id, child_id, amount, kind, ref_id, note, created_by)
    values (ch.family_id, p_child, ch.points, 'chore', row.id, ch.title, (select auth.uid()));
  end if;
  return row;
end;
$$;

-- Mandatory misses: an excused (or pending skip) kid is not charged.
-- A skip is not a claim — single-claim siblings can still lose points if nobody did the quest.
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

  for rec in
    select ch.*
      from public.chores ch
     where ch.family_id = p_family
       and ch.is_active
       and coalesce(ch.mandatory, false)
       and ch.points > 0
  loop
    created_on := (rec.created_at at time zone f.timezone)::date;
    for d in
      select generate_series(greatest(p_through - 6, created_on), p_through, interval '1 day')::date
    loop
      dow := extract(dow from d)::smallint;
      if rec.recurrence = 'once' then
        if d <> created_on then continue; end if;
      elsif rec.recurrence in ('weekly', 'custom') then
        if not (dow = any (rec.days_of_week)) then continue; end if;
      elsif rec.recurrence <> 'daily' then
        continue;
      end if;

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
        if not coalesce(rec.single_claim, false) then
          if rec.recurrence = 'once' then
            select exists (
              select 1 from public.chore_completions
               where chore_id = rec.id
                 and child_id = kid_id
                 and (
                   status = 'excused'::public.completion_status
                   or status in ('pending'::public.completion_status, 'approved'::public.completion_status)
                 )
            ) into already;
          else
            select exists (
              select 1 from public.chore_completions
               where chore_id = rec.id
                 and child_id = kid_id
                 and for_date = d
                 and (
                   status = 'excused'::public.completion_status
                   or status in ('pending'::public.completion_status, 'approved'::public.completion_status)
                 )
            ) into already;
          end if;
          if already then continue; end if;
        else
          -- Single-claim, nobody finished: this kid is safe if they asked to skip.
          select exists (
            select 1 from public.chore_completions
             where chore_id = rec.id
               and child_id = kid_id
               and for_date = d
               and (
                 status = 'excused'::public.completion_status
                 or coalesce(excuse, false)
               )
          ) into already;
          if already then continue; end if;
        end if;

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
  end loop;

  return applied;
end;
$$;

grant execute on function public.settle_mandatory_penalties(uuid, date) to authenticated;
