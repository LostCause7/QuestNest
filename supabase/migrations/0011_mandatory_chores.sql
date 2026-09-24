-- Mandatory quests: miss a due day and the assigned kid loses that quest's
-- points. Single-claim quests are safe for everyone if anyone claimed them.
-- Additive. Safe if 0001–0010 already ran. App degrades if this file is missing.

alter table public.chores
  add column if not exists single_claim boolean not null default false,
  add column if not exists mandatory boolean not null default false;

create table if not exists public.chore_miss_penalties (
  id         uuid primary key default gen_random_uuid(),
  family_id  uuid not null references public.families(id) on delete cascade,
  child_id   uuid not null references public.children(id) on delete cascade,
  chore_id   uuid not null references public.chores(id) on delete cascade,
  for_date   date not null,
  points     integer not null,
  created_at timestamptz not null default now(),
  unique (child_id, chore_id, for_date)
);

create index if not exists chore_miss_penalties_family_idx
  on public.chore_miss_penalties (family_id, for_date desc);
create index if not exists chore_miss_penalties_child_idx
  on public.chore_miss_penalties (child_id, for_date desc);

alter table public.chore_miss_penalties enable row level security;

drop policy if exists "family miss penalties" on public.chore_miss_penalties;
create policy "family miss penalties" on public.chore_miss_penalties for select to authenticated
  using (family_id in (select private.my_family_ids()));

grant select on public.chore_miss_penalties to authenticated;

-- Settles missed mandatory quests for dates through p_through (usually yesterday
-- in the family's timezone). Looks back at most 7 days so a weekend without
-- opening the app still applies. Idempotent via the unique key.
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
          ) into anyone;
        else
          select exists (
            select 1 from public.chore_completions
             where chore_id = rec.id
               and for_date = d
               and status in ('pending'::public.completion_status, 'approved'::public.completion_status)
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
                 and status in ('pending'::public.completion_status, 'approved'::public.completion_status)
            ) into already;
          else
            select exists (
              select 1 from public.chore_completions
               where chore_id = rec.id
                 and child_id = kid_id
                 and for_date = d
                 and status in ('pending'::public.completion_status, 'approved'::public.completion_status)
            ) into already;
          end if;
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
