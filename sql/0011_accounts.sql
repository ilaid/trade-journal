-- 0011 — Trading accounts (prop / personal) with a risk plan per account.
--
-- Each account carries the rules the trader must respect: size, profit target,
-- max drawdown (trailing or static), a daily loss limit and an optional
-- consistency rule. Trades link to an account so the journal can show live
-- progress against the plan. account_id NULL = not assigned to any account.

create table if not exists public.accounts (
  id               bigint generated always as identity primary key,
  user_id          uuid not null references auth.users(id) on delete cascade,
  name             text not null,                     -- "Lucid 25K #1"
  firm             text,                              -- prop firm, e.g. "Lucid"
  size             numeric not null,                  -- starting balance, e.g. 25000
  profit_target    numeric,                           -- to pass / to payout
  max_drawdown     numeric,                           -- total allowed loss, e.g. 1000
  drawdown_type    text not null default 'trailing',  -- trailing | static
  daily_loss_limit numeric,                           -- absolute $ per day
  daily_loss_pct   numeric,                           -- or % of max_drawdown per day
  consistency_pct  numeric,                           -- max % of total profit in one day
  status           text not null default 'active',    -- active | passed | failed | archived
  start_date       date,
  notes            text,
  created_at       timestamptz not null default now()
);
create index if not exists accounts_user_idx on public.accounts(user_id, created_at desc);

alter table public.accounts enable row level security;
drop policy if exists "acc_select_own" on public.accounts;
drop policy if exists "acc_insert_own" on public.accounts;
drop policy if exists "acc_update_own" on public.accounts;
drop policy if exists "acc_delete_own" on public.accounts;
create policy "acc_select_own" on public.accounts for select using (auth.uid() = user_id);
create policy "acc_insert_own" on public.accounts for insert with check (auth.uid() = user_id);
create policy "acc_update_own" on public.accounts for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "acc_delete_own" on public.accounts for delete using (auth.uid() = user_id);

-- Link trades to an account. Deleting an account keeps its trades (unassigned).
alter table public.trades
  add column if not exists account_id bigint references public.accounts(id) on delete set null;
create index if not exists trades_account_idx on public.trades(user_id, account_id);

-- The active account (where new trades land) is stored per user in
-- user_settings.data.active_account_id — no schema change needed.
