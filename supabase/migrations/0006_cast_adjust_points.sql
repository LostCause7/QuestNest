-- CASE 'bonus'/'penalty' was inferred as text. With search_path = '',
-- Postgres will not assign that to public.tx_kind.
create or replace function public.adjust_points(p_child uuid, p_amount integer, p_note text default null)
returns public.point_transactions language plpgsql security invoker set search_path = ''
as $$
declare c public.children%rowtype; tx public.point_transactions%rowtype;
begin
  select * into c from public.children where id = p_child;
  if c.id is null then raise exception 'child not found'; end if;
  if p_amount = 0 then raise exception 'amount must be non-zero'; end if;
  insert into public.point_transactions (family_id, child_id, amount, kind, note, created_by)
  values (
    c.family_id,
    p_child,
    p_amount,
    case when p_amount > 0 then 'bonus'::public.tx_kind else 'penalty'::public.tx_kind end,
    p_note,
    (select auth.uid())
  )
  returning * into tx;
  return tx;
end;
$$;
