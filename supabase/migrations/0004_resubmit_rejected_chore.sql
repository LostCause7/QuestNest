-- Kids can tap Done again after a parent sends a quest back.
-- Reuses today's rejected row instead of inserting a duplicate.
create or replace function public.complete_chore(p_chore uuid, p_child uuid, p_date date default current_date)
returns public.chore_completions language plpgsql security invoker set search_path = ''
as $$
declare ch public.chores%rowtype; row public.chore_completions%rowtype;
begin
  select * into ch from public.chores where id = p_chore and is_active;
  if ch.id is null then raise exception 'chore not found'; end if;
  if not exists (select 1 from public.chore_assignments where chore_id = p_chore and child_id = p_child)
    then raise exception 'chore not assigned to this child'; end if;

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
