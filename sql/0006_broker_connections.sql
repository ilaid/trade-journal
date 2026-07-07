-- 0006 — Broker connections (real-execution auto-import, e.g. Tradovate).
--
-- Stores one connection per user. Credentials and tokens are written and read
-- ONLY by the server (service role, which bypasses RLS) via /api/tradovate/*.
-- The client gets read access to its own row so the Settings card can show
-- status; that only ever exposes the user's own credentials, never anyone else's.

create table if not exists public.broker_connections (
  user_id          uuid primary key references auth.users(id) on delete cascade,
  broker           text not null default 'tradovate',
  env              text not null default 'demo' check (env in ('live','demo')),
  creds            jsonb not null default '{}'::jsonb,   -- name,password,appId,appVersion,cid,sec,deviceId
  access_token     text,
  token_expires_at timestamptz,
  cursor           jsonb not null default '{}'::jsonb,   -- { lastFillPairId, lastTs }
  status           text not null default 'disconnected', -- disconnected | connected | error
  last_sync_at     timestamptz,
  last_error       text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

alter table public.broker_connections enable row level security;

-- Owner may read their own row (for the status card). All writes go through the
-- server with the service role, so no client insert/update/delete policies.
drop policy if exists "bc_select_own" on public.broker_connections;
create policy "bc_select_own" on public.broker_connections
  for select using (auth.uid() = user_id);
