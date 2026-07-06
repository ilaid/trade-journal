-- TradeMethod — migration 0005: playbooks (trading strategies)
-- Run once in the Supabase SQL editor.

create table if not exists public.playbooks (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  color text not null default '#5b52e0',
  description text,
  entry_rules text,
  exit_rules text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists playbooks_user_id_idx on public.playbooks(user_id);

alter table public.playbooks enable row level security;
create policy "playbooks_select_own" on public.playbooks for select using (auth.uid() = user_id);
create policy "playbooks_insert_own" on public.playbooks for insert with check (auth.uid() = user_id);
create policy "playbooks_update_own" on public.playbooks for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "playbooks_delete_own" on public.playbooks for delete using (auth.uid() = user_id);
