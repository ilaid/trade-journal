-- Trade Journal — migration 0003: trade screenshots
-- Independent of 0002; can be applied any time after the base schema exists.

create table if not exists public.trade_screenshots (
  id bigint generated always as identity primary key,
  trade_id bigint not null references public.trades(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  storage_path text not null,
  file_name text not null,
  content_type text,
  size_bytes bigint,
  caption text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists trade_screenshots_trade_id_idx on public.trade_screenshots(trade_id);
create index if not exists trade_screenshots_user_id_idx on public.trade_screenshots(user_id);

alter table public.trade_screenshots enable row level security;
create policy "trade_screenshots_select_own" on public.trade_screenshots for select using (auth.uid() = user_id);
create policy "trade_screenshots_insert_own" on public.trade_screenshots for insert with check (auth.uid() = user_id);
create policy "trade_screenshots_delete_own" on public.trade_screenshots for delete using (auth.uid() = user_id);

-- Private bucket — files are only reachable via short-lived signed URLs
-- generated for the owning user, never a public URL.
insert into storage.buckets (id, name, public)
  values ('trade-screenshots', 'trade-screenshots', false)
  on conflict (id) do nothing;

-- Path convention enforced by the app: {user_id}/{trade_id}/{timestamp}-{filename}
-- storage.foldername(name)[1] is the first path segment, i.e. the user_id.
create policy "screenshots_select_own" on storage.objects for select
  using (bucket_id = 'trade-screenshots' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "screenshots_insert_own" on storage.objects for insert
  with check (bucket_id = 'trade-screenshots' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "screenshots_update_own" on storage.objects for update
  using (bucket_id = 'trade-screenshots' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "screenshots_delete_own" on storage.objects for delete
  using (bucket_id = 'trade-screenshots' and (storage.foldername(name))[1] = auth.uid()::text);
