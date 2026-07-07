-- 0008 — Backtest area: named folders that hold their own trades.
--
-- A folder is a separate space for testing a strategy / a backtest period. Trades
-- with backtest_folder_id = NULL are the live journal; a non-null value puts the
-- trade inside that folder (and out of the live journal views).

create table if not exists public.backtest_folders (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null,
  created_at timestamptz not null default now()
);
create index if not exists backtest_folders_user_idx on public.backtest_folders(user_id);

alter table public.backtest_folders enable row level security;
drop policy if exists "bf_select_own" on public.backtest_folders;
drop policy if exists "bf_insert_own" on public.backtest_folders;
drop policy if exists "bf_update_own" on public.backtest_folders;
drop policy if exists "bf_delete_own" on public.backtest_folders;
create policy "bf_select_own" on public.backtest_folders for select using (auth.uid() = user_id);
create policy "bf_insert_own" on public.backtest_folders for insert with check (auth.uid() = user_id);
create policy "bf_update_own" on public.backtest_folders for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "bf_delete_own" on public.backtest_folders for delete using (auth.uid() = user_id);

-- Link trades to a folder (NULL = live journal). Cascade so deleting a folder
-- removes its trades.
alter table public.trades
  add column if not exists backtest_folder_id bigint references public.backtest_folders(id) on delete cascade;
create index if not exists trades_backtest_folder_idx on public.trades(user_id, backtest_folder_id);

-- The active folder (where TradingView imports land) is stored per user in
-- user_settings.data.active_backtest_folder_id — no schema change needed.
