-- Trade Journal — Supabase schema
-- Run this once in the Supabase SQL editor for your project.

create table if not exists public.trades (
  id bigint primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  data jsonb not null,
  created_at timestamptz not null default now()
);
create index if not exists trades_user_id_idx on public.trades(user_id);

create table if not exists public.tags (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.day_notes (
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  note text not null,
  primary key (user_id, date)
);

alter table public.trades enable row level security;
alter table public.tags enable row level security;
alter table public.day_notes enable row level security;

create policy "trades_select_own" on public.trades for select using (auth.uid() = user_id);
create policy "trades_insert_own" on public.trades for insert with check (auth.uid() = user_id);
create policy "trades_update_own" on public.trades for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "trades_delete_own" on public.trades for delete using (auth.uid() = user_id);

create policy "tags_select_own" on public.tags for select using (auth.uid() = user_id);
create policy "tags_insert_own" on public.tags for insert with check (auth.uid() = user_id);
create policy "tags_update_own" on public.tags for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "tags_delete_own" on public.tags for delete using (auth.uid() = user_id);

create policy "day_notes_select_own" on public.day_notes for select using (auth.uid() = user_id);
create policy "day_notes_insert_own" on public.day_notes for insert with check (auth.uid() = user_id);
create policy "day_notes_update_own" on public.day_notes for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "day_notes_delete_own" on public.day_notes for delete using (auth.uid() = user_id);
