-- 0007 — Always-on Tradovate sync via Supabase pg_cron + pg_net.
--
-- Vercel's free cron only runs daily, so we poll from Supabase instead.
-- Before running: replace the two placeholders below with your deployed URL
-- and the SYNC_SECRET you set in Vercel env vars. Runs every minute.
--
-- (Optional — the "Sync now" button in Settings works without this; this is
--  what makes trades import automatically without the app being open.)

create extension if not exists pg_cron;
create extension if not exists pg_net;

do $$
begin
  if exists (select 1 from cron.job where jobname = 'tradovate-sync') then
    perform cron.unschedule('tradovate-sync');
  end if;
end$$;

select cron.schedule('tradovate-sync', '* * * * *', $cron$
  select net.http_post(
    url     := 'https://trade-method.vercel.app/api/tradovate/sync',
    headers := jsonb_build_object(
                 'Content-Type', 'application/json',
                 'x-sync-secret', 'REPLACE_WITH_SYNC_SECRET'
               ),
    body    := '{}'::jsonb
  );
$cron$);
