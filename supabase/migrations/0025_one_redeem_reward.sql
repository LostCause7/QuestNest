-- PostgREST cannot pick between redeem_reward(uuid, uuid) and
-- redeem_reward(uuid, uuid, integer). Keep the 3-arg form only.
-- Safe to re-run.

drop function if exists public.redeem_reward(uuid, uuid);
