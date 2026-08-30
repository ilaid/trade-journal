-- 0010 — Investing / Swing portfolio: a separate space from day-trading.
--
-- Long-term & swing positions live in their own table (not `trades`), because
-- they are price/quantity based (no futures contracts / ticks) and need
-- qualitative fields (thesis, market context, review). P&L is computed in the
-- app: ($ = (exit-entry)*qty*dir - fees ; % = (exit-entry)/entry*dir*100).
-- An open position has exit_date / exit_price = NULL.

create table if not exists public.investments (
  id             bigint generated always as identity primary key,
  user_id        uuid not null references auth.users(id) on delete cascade,
  symbol         text not null,                       -- free-form ticker: AAPL, SPY, BTC, EURUSD
  asset_type     text not null default 'stock',       -- stock | etf | crypto | forex
  direction      text not null default 'Long',        -- Long | Short
  entry_date     date not null,
  entry_price    numeric not null,
  quantity       numeric not null default 1,          -- shares / units
  exit_date      date,                                -- NULL = open position
  exit_price     numeric,                             -- NULL = open position
  fees           numeric not null default 0,
  target         numeric,
  stop           numeric,                             -- stop / planned exit
  time_horizon   text,                                -- swing | months | long
  conviction     int,                                 -- 1..5
  thesis         text,                                -- why entered
  market_context text,                                -- macro / market backdrop
  review         text,                                -- lessons after close
  tags           text[] not null default '{}',
  notes          text,
  created_at     timestamptz not null default now()
);
create index if not exists investments_user_idx on public.investments(user_id, entry_date desc);

alter table public.investments enable row level security;
drop policy if exists "inv_select_own" on public.investments;
drop policy if exists "inv_insert_own" on public.investments;
drop policy if exists "inv_update_own" on public.investments;
drop policy if exists "inv_delete_own" on public.investments;
create policy "inv_select_own" on public.investments for select using (auth.uid() = user_id);
create policy "inv_insert_own" on public.investments for insert with check (auth.uid() = user_id);
create policy "inv_update_own" on public.investments for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "inv_delete_own" on public.investments for delete using (auth.uid() = user_id);
