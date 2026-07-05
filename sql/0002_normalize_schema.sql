-- Trade Journal — migration 0002: normalize schema
--
-- Upgrades an EXISTING live project (created from the original single-JSONB
-- version of sql/schema.sql: trades.data jsonb, tags.data jsonb) to the
-- normalized relational schema. Safe to run once. Does NOT drop any data —
-- the old trades/tags tables are renamed to *_legacy, never dropped, so this
-- is reversible by simply reverting the app code back to reading *_legacy.
--
-- Recommended: run this against a Supabase branch first (mcp Supabase
-- create_branch / the Supabase dashboard) and verify the count/sum checks at
-- the bottom before running it against production.

begin;

-- ── 1. Reference data: instruments & contracts ──────────────────────────────
create table if not exists public.instruments (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete cascade,
  symbol text not null,
  label text not null,
  asset_class text not null default 'futures',
  exchange text,
  color text not null default '#3b82f6',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create unique index if not exists instruments_global_symbol_uq on public.instruments(symbol) where user_id is null;
create unique index if not exists instruments_user_symbol_uq on public.instruments(user_id, symbol) where user_id is not null;

create table if not exists public.contracts (
  id bigint generated always as identity primary key,
  instrument_id bigint not null references public.instruments(id) on delete cascade,
  legacy_code text, -- temporary, used only to backfill trades.contractTypeId below; dropped at the end of this migration
  label text not null,
  tick_size numeric not null check (tick_size > 0),
  tick_value numeric not null check (tick_value > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists contracts_instrument_id_idx on public.contracts(instrument_id);

alter table public.instruments enable row level security;
alter table public.contracts enable row level security;

create policy "instruments_select" on public.instruments for select
  using (user_id is null or auth.uid() = user_id);
create policy "instruments_insert_own" on public.instruments for insert
  with check (auth.uid() = user_id);
create policy "instruments_update_own" on public.instruments for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "instruments_delete_own" on public.instruments for delete
  using (auth.uid() = user_id);

create policy "contracts_select" on public.contracts for select using (
  exists (select 1 from public.instruments i where i.id = contracts.instrument_id
          and (i.user_id is null or i.user_id = auth.uid())));
create policy "contracts_insert_own" on public.contracts for insert with check (
  exists (select 1 from public.instruments i where i.id = contracts.instrument_id
          and i.user_id = auth.uid()));
create policy "contracts_update_own" on public.contracts for update using (
  exists (select 1 from public.instruments i where i.id = contracts.instrument_id
          and i.user_id = auth.uid()))
  with check (exists (select 1 from public.instruments i where i.id = contracts.instrument_id
          and i.user_id = auth.uid()));
create policy "contracts_delete_own" on public.contracts for delete using (
  exists (select 1 from public.instruments i where i.id = contracts.instrument_id
          and i.user_id = auth.uid()));

insert into public.instruments (symbol, label, asset_class, exchange, color) values
  ('ES', 'E-mini S&P 500', 'futures', 'CME', '#60a5fa'),
  ('NQ', 'E-mini Nasdaq-100', 'futures', 'CME', '#a78bfa'),
  ('CL', 'Crude Oil', 'futures', 'NYMEX', '#f59e0b'),
  ('GC', 'Gold', 'futures', 'COMEX', '#eab308'),
  ('YM', 'E-mini Dow', 'futures', 'CBOT', '#34d399'),
  ('RTY', 'E-mini Russell 2000', 'futures', 'CME', '#f472b6'),
  ('6E', 'Euro FX', 'futures', 'CME', '#22d3ee')
on conflict do nothing;

insert into public.contracts (instrument_id, legacy_code, label, tick_size, tick_value)
select i.id, c.legacy_code, c.label, c.tick_size, c.tick_value from public.instruments i
join (values
  ('ES', 'ES_mini', 'E-mini ES', 0.25, 12.5),
  ('ES', 'MES_micro', 'Micro MES', 0.25, 1.25),
  ('NQ', 'NQ_mini', 'E-mini NQ', 0.25, 5.0),
  ('NQ', 'MNQ_micro', 'Micro MNQ', 0.25, 0.5),
  ('CL', 'CL_mini', 'E-mini CL', 0.01, 10.0),
  ('CL', 'MCL_micro', 'Micro MCL', 0.01, 1.0),
  ('GC', 'GC_mini', 'E-mini GC', 0.10, 10.0),
  ('GC', 'MGC_micro', 'Micro MGC', 0.10, 1.0),
  ('YM', 'YM_mini', 'E-mini YM', 1.0, 5.0),
  ('YM', 'MYM_micro', 'Micro MYM', 1.0, 0.5),
  ('RTY', 'RTY_mini', 'E-mini RTY', 0.10, 5.0),
  ('RTY', 'M2K_micro', 'Micro M2K', 0.10, 0.5),
  ('6E', '6E_mini', 'E-mini 6E', 0.00005, 6.25)
) as c(symbol, legacy_code, label, tick_size, tick_value) on c.symbol = i.symbol
where i.user_id is null
on conflict do nothing;

-- ── 2. Rename old tables out of the way (never dropped) ─────────────────────
alter table if exists public.trades rename to trades_legacy;
alter table if exists public.tags rename to tags_legacy;

-- ── 3. Create new normalized tables ──────────────────────────────────────────
create table public.trades (
  id bigint primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  is_historical boolean not null default false,
  trade_date date not null,
  trade_time time,
  instrument_id bigint not null references public.instruments(id),
  contract_id bigint not null references public.contracts(id),
  direction text not null check (direction in ('Long','Short')),
  entry_price numeric not null,
  total_contracts numeric not null check (total_contracts > 0),
  stop_loss numeric,
  take_profit numeric,
  risk_reward numeric,
  pnl numeric not null default 0,
  emotion_before text,
  emotion_during text,
  followed_plan boolean,
  mistakes text[] not null default '{}',
  events text[] not null default '{}',
  what_went_well text,
  what_to_improve text,
  notes text,
  source text not null default 'manual' check (source in ('manual','import','api')),
  broker text,
  external_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index trades_user_id_idx on public.trades(user_id);
create index trades_user_date_idx on public.trades(user_id, trade_date);
create index trades_user_instrument_idx on public.trades(user_id, instrument_id);
create unique index trades_user_external_id_uq on public.trades(user_id, broker, external_id)
  where external_id is not null;

alter table public.trades enable row level security;
create policy "trades_select_own" on public.trades for select using (auth.uid() = user_id);
create policy "trades_insert_own" on public.trades for insert with check (auth.uid() = user_id);
create policy "trades_update_own" on public.trades for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "trades_delete_own" on public.trades for delete using (auth.uid() = user_id);

create table public.trade_exits (
  id bigint generated always as identity primary key,
  trade_id bigint not null references public.trades(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  exit_price numeric not null,
  contracts numeric not null check (contracts > 0),
  pnl numeric not null,
  exit_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index trade_exits_trade_id_idx on public.trade_exits(trade_id);
create index trade_exits_user_id_idx on public.trade_exits(user_id);

alter table public.trade_exits enable row level security;
create policy "trade_exits_select_own" on public.trade_exits for select using (auth.uid() = user_id);
create policy "trade_exits_insert_own" on public.trade_exits for insert with check (auth.uid() = user_id);
create policy "trade_exits_update_own" on public.trade_exits for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "trade_exits_delete_own" on public.trade_exits for delete using (auth.uid() = user_id);

create table public.tags (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  color text not null,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);
create index tags_user_id_idx on public.tags(user_id);

alter table public.tags enable row level security;
create policy "tags_select_own" on public.tags for select using (auth.uid() = user_id);
create policy "tags_insert_own" on public.tags for insert with check (auth.uid() = user_id);
create policy "tags_update_own" on public.tags for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "tags_delete_own" on public.tags for delete using (auth.uid() = user_id);

create table public.trade_tags (
  trade_id bigint not null references public.trades(id) on delete cascade,
  tag_id bigint not null references public.tags(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  primary key (trade_id, tag_id)
);
create index trade_tags_tag_id_idx on public.trade_tags(tag_id);
create index trade_tags_user_id_idx on public.trade_tags(user_id);

alter table public.trade_tags enable row level security;
create policy "trade_tags_select_own" on public.trade_tags for select using (auth.uid() = user_id);
create policy "trade_tags_insert_own" on public.trade_tags for insert with check (auth.uid() = user_id);
create policy "trade_tags_delete_own" on public.trade_tags for delete using (auth.uid() = user_id);

alter table public.day_notes add column if not exists updated_at timestamptz not null default now();

-- ── 4. Backfill from legacy JSONB blobs ──────────────────────────────────────

-- 4a. tags: union of names found inside trades_legacy.data->'tags' and the
-- legacy per-user tags blob, deduped per (user_id, name), keeping colors from
-- the legacy blob where available.
insert into public.tags (user_id, name, color)
select distinct on (user_id, name) user_id, name, color from (
  select tl.user_id, (tag->>'name') as name, coalesce(tag->>'color', '#3b82f6') as color
  from public.tags_legacy tl, jsonb_array_elements(tl.data) as tag
  union all
  select t.user_id, jsonb_array_elements_text(coalesce(t.data->'tags', '[]'::jsonb)) as name, '#3b82f6' as color
  from public.trades_legacy t
) all_tags
on conflict (user_id, name) do nothing;

-- 4b. trades: resolve instrument_id / contract_id via the legacy string codes.
insert into public.trades (
  id, user_id, is_historical, trade_date, trade_time, instrument_id, contract_id,
  direction, entry_price, total_contracts, stop_loss, take_profit, risk_reward, pnl,
  emotion_before, emotion_during, followed_plan, mistakes, events, what_went_well,
  what_to_improve, notes, source, created_at, updated_at
)
select
  t.id,
  t.user_id,
  coalesce((t.data->>'isHistorical')::boolean, false),
  coalesce(nullif(t.data->>'date', '')::date, t.created_at::date),
  nullif(t.data->>'time', '')::time,
  i.id,
  c.id,
  t.data->>'direction',
  (t.data->>'entryPrice')::numeric,
  coalesce(nullif(t.data->>'totalContracts','')::numeric, 1),
  nullif(t.data->>'sl','')::numeric,
  nullif(t.data->>'tp','')::numeric,
  (t.data->>'rr')::numeric,
  coalesce((t.data->>'pnl')::numeric, 0),
  nullif(t.data->>'emotion_before',''),
  nullif(t.data->>'emotion_during',''),
  (t.data->>'followed_plan')::boolean,
  array(select jsonb_array_elements_text(coalesce(t.data->'mistakes','[]'::jsonb))),
  array(select jsonb_array_elements_text(coalesce(t.data->'events','[]'::jsonb))),
  nullif(t.data->>'what_went_well',''),
  nullif(t.data->>'what_to_improve',''),
  nullif(t.data->>'notes',''),
  'manual',
  t.created_at,
  now()
from public.trades_legacy t
join public.instruments i on i.symbol = t.data->>'instrument' and i.user_id is null
join public.contracts c on c.legacy_code = t.data->>'contractTypeId' and c.instrument_id = i.id;

-- 4c. trade_exits: unnest each trade's exits array, skipping placeholder rows
-- that were never filled in (empty exitPrice).
insert into public.trade_exits (trade_id, user_id, exit_price, contracts, pnl, exit_order)
select
  t.id,
  t.user_id,
  (e->>'exitPrice')::numeric,
  coalesce(nullif(e->>'contracts','')::numeric, 1),
  coalesce((e->>'pnl')::numeric, 0),
  (ord - 1)::int
from public.trades_legacy t
join public.trades nt on nt.id = t.id
cross join lateral jsonb_array_elements(coalesce(t.data->'exits', '[]'::jsonb)) with ordinality as x(e, ord)
where nullif(e->>'exitPrice', '') is not null;

-- 4d. trade_tags: join each trade's tag names back to the now-populated tags table.
insert into public.trade_tags (trade_id, tag_id, user_id)
select t.id, tg.id, t.user_id
from public.trades_legacy t
join public.trades nt on nt.id = t.id
cross join lateral jsonb_array_elements_text(coalesce(t.data->'tags', '[]'::jsonb)) as tag_name
join public.tags tg on tg.user_id = t.user_id and tg.name = tag_name
on conflict do nothing;

-- 4e. drop the temporary legacy_code column now that backfill is done.
alter table public.contracts drop column legacy_code;

-- ── 5. Atomic multi-table trade save (trades + exits + tags in one call) ────
create or replace function public.save_trade(
  p_id bigint,
  p_is_historical boolean,
  p_trade_date date,
  p_trade_time time,
  p_instrument_id bigint,
  p_contract_id bigint,
  p_direction text,
  p_entry_price numeric,
  p_total_contracts numeric,
  p_stop_loss numeric,
  p_take_profit numeric,
  p_risk_reward numeric,
  p_pnl numeric,
  p_emotion_before text,
  p_emotion_during text,
  p_followed_plan boolean,
  p_mistakes text[],
  p_events text[],
  p_what_went_well text,
  p_what_to_improve text,
  p_notes text,
  p_source text,
  p_broker text,
  p_external_id text,
  p_exits jsonb,
  p_tag_ids bigint[]
) returns bigint
language plpgsql
security invoker
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  insert into public.trades (
    id, user_id, is_historical, trade_date, trade_time, instrument_id, contract_id,
    direction, entry_price, total_contracts, stop_loss, take_profit, risk_reward, pnl,
    emotion_before, emotion_during, followed_plan, mistakes, events, what_went_well,
    what_to_improve, notes, source, broker, external_id, updated_at
  ) values (
    p_id, v_uid, p_is_historical, p_trade_date, p_trade_time, p_instrument_id, p_contract_id,
    p_direction, p_entry_price, p_total_contracts, p_stop_loss, p_take_profit, p_risk_reward, p_pnl,
    p_emotion_before, p_emotion_during, p_followed_plan, p_mistakes, p_events, p_what_went_well,
    p_what_to_improve, p_notes, p_source, p_broker, p_external_id, now()
  )
  on conflict (id) do update set
    is_historical = excluded.is_historical,
    trade_date = excluded.trade_date,
    trade_time = excluded.trade_time,
    instrument_id = excluded.instrument_id,
    contract_id = excluded.contract_id,
    direction = excluded.direction,
    entry_price = excluded.entry_price,
    total_contracts = excluded.total_contracts,
    stop_loss = excluded.stop_loss,
    take_profit = excluded.take_profit,
    risk_reward = excluded.risk_reward,
    pnl = excluded.pnl,
    emotion_before = excluded.emotion_before,
    emotion_during = excluded.emotion_during,
    followed_plan = excluded.followed_plan,
    mistakes = excluded.mistakes,
    events = excluded.events,
    what_went_well = excluded.what_went_well,
    what_to_improve = excluded.what_to_improve,
    notes = excluded.notes,
    source = excluded.source,
    broker = excluded.broker,
    external_id = excluded.external_id,
    updated_at = now()
  where trades.user_id = v_uid;

  delete from public.trade_exits where trade_id = p_id and user_id = v_uid;
  if jsonb_array_length(p_exits) > 0 then
    insert into public.trade_exits (trade_id, user_id, exit_price, contracts, pnl, exit_order)
    select p_id, v_uid, (e->>'exit_price')::numeric, (e->>'contracts')::numeric, (e->>'pnl')::numeric, (ord - 1)::int
    from jsonb_array_elements(p_exits) with ordinality as t(e, ord);
  end if;

  delete from public.trade_tags where trade_id = p_id and user_id = v_uid;
  if p_tag_ids is not null and array_length(p_tag_ids, 1) > 0 then
    insert into public.trade_tags (trade_id, tag_id, user_id)
    select p_id, tag_id, v_uid from unnest(p_tag_ids) as tag_id;
  end if;

  return p_id;
end;
$$;

grant execute on function public.save_trade to authenticated;

-- ── 6. Verification (should return matching rows — inspect before relying on
-- the migration; this migration intentionally does not abort automatically
-- so you can inspect a mismatch before deciding whether to fix data or revert
-- to trades_legacy) ──────────────────────────────────────────────────────────
-- select (select count(*) from trades_legacy) as legacy_count,
--        (select count(*) from trades) as new_count;
-- select (select round(sum((data->>'pnl')::numeric),2) from trades_legacy) as legacy_pnl_sum,
--        (select round(sum(pnl),2) from trades) as new_pnl_sum;

commit;
