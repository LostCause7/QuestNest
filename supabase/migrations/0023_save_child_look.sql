-- Closet Face/Color/Frame/Aura/Name must land on the kid row so every device
-- in the nest sees the same look. Safe to re-run.

alter table public.children
  add column if not exists style jsonb not null default '{}'::jsonb;

create or replace function public.save_child_look(
  p_child uuid,
  p_avatar text default null,
  p_color text default null,
  p_style jsonb default null
)
returns public.children
language plpgsql
security definer
set search_path = ''
as $$
declare
  c public.children%rowtype;
begin
  if (select auth.uid()) is null then raise exception 'not allowed'; end if;

  select * into c
    from public.children
   where id = p_child
     and family_id in (select private.my_family_ids())
   for update;
  if not found then raise exception 'Kid not found.'; end if;

  update public.children
     set avatar = coalesce(nullif(trim(p_avatar), ''), avatar),
         color = coalesce(nullif(trim(p_color), ''), color),
         style = coalesce(p_style, style)
   where id = p_child
  returning * into c;

  return c;
end;
$$;

grant execute on function public.save_child_look(uuid, text, text, jsonb) to authenticated;
