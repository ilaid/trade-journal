# Trade Journal

A trading journal for futures traders — daily/weekly/monthly calendar with P&L, win-rate and R:R analytics, setup-tag performance breakdown, trade psychology tracking (emotions, mistakes, plan adherence), a backtest mode for logging historical trades, CSV broker import, and chart screenshots per trade. Data is synced to Supabase (Postgres + Auth + Storage) so it's available across devices.

## Stack

- React 18 + Vite
- Supabase (Auth + Postgres + Storage, via `@supabase/supabase-js`)
- PapaParse (CSV import parsing)

## Setup

**New project** (nothing deployed yet):

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a Supabase project, then copy `.env.example` to `.env` and fill in your project URL and anon/publishable key:
   ```bash
   cp .env.example .env
   ```
3. Run `sql/schema.sql` in the Supabase SQL editor. This creates everything: `instruments`/`contracts` (seeded with ES, NQ, CL, GC, YM, RTY, 6E — verify tick sizes/values against exchange specs before relying on them), `trades`, `trade_exits`, `tags`, `trade_tags`, `day_notes`, `trade_screenshots` + a private Storage bucket, and the `save_trade` RPC used for atomic multi-table saves — all with row-level security scoped to `auth.uid()`.
4. Start the dev server:
   ```bash
   npm run dev
   ```

**Upgrading an existing project** that was set up from the older single-JSONB-blob schema:

1. Run `sql/0002_normalize_schema.sql` in the Supabase SQL editor. It renames the old `trades`/`tags` tables to `trades_legacy`/`tags_legacy` (never drops them), creates the normalized tables, and backfills all existing data. Recommended: run it against a Supabase branch first and compare row counts / P&L sums (queries included as comments at the bottom of the file) before applying to production.
2. Run `sql/0003_screenshots.sql` to add the screenshot storage bucket + table (independent of step 1, can be run anytime).
3. Deploy the updated app code.

## Project structure

```
src/
  lib/
    constants.js     shared UI constants (colors, emotions, mistakes, economic events, fallback instrument list)
    calc.js           P&L / R:R calculators, date helpers, blank-trade-form factory
    instruments.js    loads instruments/contracts from Supabase, reshapes to the CT/INST shape used by the form
    csvImport.js      CSV parsing, column-mapping, direction/date normalization, de-dupe detection
    screenshots.js    Supabase Storage upload/list/delete + signed URLs for trade screenshots
    supabase.js       Supabase client
    csv.js            trade export to CSV
  components/
    AuthScreen.jsx        sign in / sign up
    TradeJournal.jsx      main app shell (state, Supabase sync, tabs, modals)
    TradeModal.jsx         4-step add/edit trade form
    DayPopup.jsx           per-day trade list + note
    TagModal.jsx           create setup tag
    ImportModal.jsx        CSV import wizard (upload → map columns → preview/dedupe → confirm)
    ScreenshotUploader.jsx upload/thumbnail/delete widget for chart screenshots
    TRow.jsx               trade list row
    tabs/                  Dashboard, Trades, Analytics, Setups, Settings (incl. instrument management)
sql/
  schema.sql                  target schema for a brand-new project
  0002_normalize_schema.sql   upgrade path from the old JSONB-blob schema
  0003_screenshots.sql        screenshot table + storage bucket (independent add-on)
```

### Data model notes

- The in-memory trade shape used throughout the UI is unchanged from the original version (flat object with an `exits` array, `tags`/`events` name arrays, etc.) — `TradeJournal.jsx` is the adapter boundary that hydrates it from the normalized tables on load and flattens it back into a `save_trade` RPC call on save. Dashboard/Analytics/Setups don't need to know about the relational schema at all.
- CSV import (v1) expects one row per completed round-trip trade (entry + exit + P&L already in the same row) — it does not do execution/fill-level reconciliation across multiple partial-fill rows.
- Screenshots can only be attached to a trade that's already been saved once (save the trade, then reopen it to attach charts).

## Build

```bash
npm run build
npm run preview
```
