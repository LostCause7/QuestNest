-- Nest-owner Your profile (face, color, motto). Safe if 0007 already ran.
-- Reloads PostgREST so avatar_key / color_key / motto are writable.

alter table public.profiles
  add column if not exists avatar_key text,
  add column if not exists color_key text,
  add column if not exists motto text,
  add column if not exists style jsonb not null default '{}'::jsonb;

notify pgrst, 'reload schema';
