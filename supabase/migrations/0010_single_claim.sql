-- One-kid-per-day quests: first child to tap Done claims it for that date.
-- Additive. Safe if 0001–0009 already ran. App degrades if this file is missing.

alter table public.chores
  add column if not exists single_claim boolean not null default false;

-- First-come lock: serialize claims on the chore row, then refuse a second
-- pending/approved completion for the same date when single_claim is on.
-- Rejected rows do not hold the slot, so another kid (or the same kid) can try.
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
     )
  then
    raise exception 'quest already claimed today';
  end if;

  select * into row from public.chore_completions
   where chore_id = p_chore and child_id = p_child and for_date = p_date;

  if found then
    if row.status = 'rejected' then
      update public.chore_completions
         set status = 'pending'::public.completion_status,
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
    insert into public.chore_completions (family_id, chore_id, child_id, for_date, status)
    values (ch.family_id, p_chore, p_child, p_date, 'pending'::public.completion_status)
    returning * into row;
  end if;

  if not ch.requires_approval then
    update public.chore_completions
       set status = 'approved'::public.completion_status, points_awarded = ch.points, reviewed_at = now()
     where id = row.id returning * into row;
    insert into public.point_transactions (family_id, child_id, amount, kind, ref_id, note, created_by)
    values (ch.family_id, p_child, ch.points, 'chore', row.id, ch.title, (select auth.uid()));
  end if;
  return row;
end;
$$;

-- Perfect-day counts should not require a sibling-claimed exclusive quest.
-- Only rewrite daily_rewards when 0009 already created it (needs bonus columns).
do $outer$
begin
  if exists (
    select 1 from information_schema.columns
     where table_schema = 'public' and table_name = 'families' and column_name = 'perfect_day_points'
  ) and exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'private' and p.proname = 'daily_rewards'
  ) then
    execute $fn$
create or replace function private.daily_rewards()
returns trigger language plpgsql security definer set search_path = ''
as $body$
declare
  f public.families%rowtype;
  c public.children%rowtype;
  approved_today int;
  due_total int;
  due_done int;
  roll int;
  dow smallint;
begin
  if not (new.status = 'approved' and old.status is distinct from 'approved') then
    return new;
  end if;

  select * into f from public.families where id = new.family_id;
  select * into c from public.children where id = new.child_id;
  if f.id is null or c.id is null then return new; end if;

  select count(*) into approved_today
    from public.chore_completions
   where child_id = new.child_id and for_date = new.for_date and status = 'approved';

  if f.daily_bonus_points > 0 and approved_today = 1 then
    insert into public.child_day_awards (family_id, child_id, for_date, kind, points)
    values (new.family_id, new.child_id, new.for_date, 'daily', f.daily_bonus_points)
    on conflict do nothing;
    if found then
      insert into public.point_transactions (family_id, child_id, amount, kind, ref_id, note, created_by)
      values (new.family_id, new.child_id, f.daily_bonus_points, 'bonus'::public.tx_kind, new.id, 'Daily nest bonus', (select auth.uid()));
    end if;
  end if;

  if f.combo_bonus_points > 0 and approved_today = 3 then
    insert into public.child_day_awards (family_id, child_id, for_date, kind, points)
    values (new.family_id, new.child_id, new.for_date, 'combo', f.combo_bonus_points)
    on conflict do nothing;
    if found then
      insert into public.point_transactions (family_id, child_id, amount, kind, ref_id, note, created_by)
      values (new.family_id, new.child_id, f.combo_bonus_points, 'bonus'::public.tx_kind, new.id, 'Combo x3', (select auth.uid()));
    end if;
  end if;

  if f.surprise_chance > 0 and approved_today = 1 and (random() * 100) < f.surprise_chance then
    roll := 1 + floor(random() * greatest(1, new.points_awarded))::int;
    insert into public.child_day_awards (family_id, child_id, for_date, kind, points)
    values (new.family_id, new.child_id, new.for_date, 'mystery', roll)
    on conflict do nothing;
    if found then
      insert into public.point_transactions (family_id, child_id, amount, kind, ref_id, note, created_by)
      values (new.family_id, new.child_id, roll, 'bonus'::public.tx_kind, new.id, 'Nest egg!', (select auth.uid()));
    end if;
  end if;

  if approved_today = 1 and c.current_streak <= 1
     and exists (select 1 from public.chore_completions
                  where child_id = new.child_id and status = 'approved' and for_date <= new.for_date - 2)
     and not exists (select 1 from public.chore_completions
                      where child_id = new.child_id and status = 'approved' and for_date = new.for_date - 1) then
    insert into public.child_day_awards (family_id, child_id, for_date, kind, points)
    values (new.family_id, new.child_id, new.for_date, 'comeback', f.daily_bonus_points)
    on conflict do nothing;
    if found and f.daily_bonus_points > 0 then
      insert into public.point_transactions (family_id, child_id, amount, kind, ref_id, note, created_by)
      values (new.family_id, new.child_id, f.daily_bonus_points, 'bonus'::public.tx_kind, new.id, 'Welcome back!', (select auth.uid()));
    end if;
  end if;

  if f.perfect_day_points > 0 then
    dow := extract(dow from new.for_date)::smallint;
    select count(*) into due_total
      from public.chores ch
      join public.chore_assignments a on a.chore_id = ch.id and a.child_id = new.child_id
     where ch.is_active
       and not (
         coalesce(ch.single_claim, false)
         and exists (
           select 1 from public.chore_completions x
            where x.chore_id = ch.id and x.for_date = new.for_date
              and x.child_id <> new.child_id
              and x.status in ('pending', 'approved')
         )
       )
       and (ch.recurrence = 'daily'
            or (ch.recurrence in ('weekly','custom') and dow = any(ch.days_of_week))
            or (ch.recurrence = 'once' and not exists (
                  select 1 from public.chore_completions x
                   where x.chore_id = ch.id and x.child_id = new.child_id and x.status = 'approved' and x.for_date <> new.for_date)));
    select count(*) into due_done
      from public.chores ch
      join public.chore_assignments a on a.chore_id = ch.id and a.child_id = new.child_id
      join public.chore_completions cc on cc.chore_id = ch.id and cc.child_id = new.child_id
                                       and cc.for_date = new.for_date and cc.status = 'approved'
     where ch.is_active
       and (ch.recurrence = 'daily'
            or (ch.recurrence in ('weekly','custom') and dow = any(ch.days_of_week))
            or ch.recurrence = 'once');
    if due_total >= 1 and due_done >= due_total then
      insert into public.child_day_awards (family_id, child_id, for_date, kind, points)
      values (new.family_id, new.child_id, new.for_date, 'perfect_day', f.perfect_day_points)
      on conflict do nothing;
      if found then
        insert into public.point_transactions (family_id, child_id, amount, kind, ref_id, note, created_by)
        values (new.family_id, new.child_id, f.perfect_day_points, 'bonus'::public.tx_kind, new.id, 'Perfect day', (select auth.uid()));
      end if;
    end if;
  end if;

  perform private.check_badges(new.child_id);
  return new;
end;
$body$;
    $fn$;
  end if;
end
$outer$;
