-- Extra parent profiles (after the nest owner). Each has their own PIN.
-- Additive. Safe if 0001–0007 already ran.

create table if not exists public.parent_profiles (
  id         uuid primary key default gen_random_uuid(),
  family_id  uuid not null references public.families(id) on delete cascade,
  name       text not null,
  avatar     text not null default 'fox',
  color      text not null default 'slate',
  motto      text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.parent_profile_pins (
  parent_id uuid primary key references public.parent_profiles(id) on delete cascade,
  pin_hash  text not null
);

create index if not exists parent_profiles_family_idx on public.parent_profiles (family_id);

alter table public.parent_profiles enable row level security;
alter table public.parent_profile_pins enable row level security;

drop policy if exists "family parent profiles" on public.parent_profiles;
create policy "family parent profiles" on public.parent_profiles for all to authenticated
  using (family_id in (select private.my_family_ids()))
  with check (family_id in (select private.my_family_ids()));

create or replace function public.set_parent_profile_pin(p_parent uuid, p_pin text)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  if p_pin !~ '^[0-9]{4}$' then raise exception 'PIN must be exactly 4 digits'; end if;
  if not exists (
    select 1 from public.parent_profiles p
    where p.id = p_parent and p.family_id in (select private.my_family_ids())
  ) then raise exception 'not allowed'; end if;
  insert into public.parent_profile_pins (parent_id, pin_hash)
  values (p_parent, extensions.crypt(p_pin, extensions.gen_salt('bf')))
  on conflict (parent_id) do update set pin_hash = excluded.pin_hash;
end;
$$;

create or replace function public.verify_parent_profile_pin(p_parent uuid, p_pin text)
returns boolean language plpgsql security definer set search_path = ''
as $$
declare h text;
begin
  if not exists (
    select 1 from public.parent_profiles p
    where p.id = p_parent and p.family_id in (select private.my_family_ids())
  ) then return false; end if;
  select pin_hash into h from public.parent_profile_pins where parent_id = p_parent;
  return h is not null and h = extensions.crypt(p_pin, h);
end;
$$;

grant select, insert, update, delete on public.parent_profiles to authenticated;
grant execute on function public.set_parent_profile_pin(uuid, text) to authenticated;
grant execute on function public.verify_parent_profile_pin(uuid, text) to authenticated;
