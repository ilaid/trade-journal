-- 0009 — Add Silver (SI) as a built-in instrument with its two contracts.
--
-- Values per the exchange:
--   SI  (5,000 oz):  tick 0.005 = $25.00   (1.00 move = $5,000)
--   SIL (1,000 oz):  tick 0.01  = $10.00   (1.00 move = $1,000)
-- Idempotent — safe to run more than once.

insert into public.instruments (symbol, label, asset_class, exchange, color)
select 'SI', 'Silver', 'futures', 'COMEX', '#94a3b8'
where not exists (
  select 1 from public.instruments where symbol = 'SI' and user_id is null
);

insert into public.contracts (instrument_id, legacy_code, label, tick_size, tick_value)
select i.id, v.legacy_code, v.label, v.tick_size, v.tick_value
from public.instruments i
join (values
  ('SI', 'SI_full',   'Silver (SI)',        0.005, 25.0),
  ('SI', 'SIL_micro', 'Micro Silver (SIL)', 0.01,  10.0)
) as v(symbol, legacy_code, label, tick_size, tick_value) on v.symbol = i.symbol
where i.user_id is null
  and not exists (
    select 1 from public.contracts c where c.instrument_id = i.id and c.legacy_code = v.legacy_code
  );
