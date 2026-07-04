# Trade Journal

A trading journal for futures traders (ES / NQ) — daily/weekly/monthly calendar with P&L, win-rate and R:R analytics, setup-tag performance breakdown, trade psychology tracking (emotions, mistakes, plan adherence), and a backtest mode for logging historical trades. Data is synced to Supabase (Postgres + Auth) so it's available across devices.

## Stack

- React 18 + Vite
- Supabase (Auth + Postgres, via `@supabase/supabase-js`)

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a Supabase project, then copy `.env.example` to `.env` and fill in your project URL and anon/publishable key:
   ```bash
   cp .env.example .env
   ```
3. Run `sql/schema.sql` in the Supabase SQL editor to create the `trades`, `tags`, and `day_notes` tables with row-level security scoped to `auth.uid()`.
4. Start the dev server:
   ```bash
   npm run dev
   ```

## Project structure

```
src/
  lib/            constants, P&L/R:R calculators, CSV export, Supabase client
  components/
    AuthScreen.jsx      sign in / sign up
    TradeJournal.jsx    main app shell (state, Supabase sync, tabs, modals)
    TradeModal.jsx       4-step add/edit trade form
    DayPopup.jsx         per-day trade list + note
    TagModal.jsx         create setup tag
    TRow.jsx             trade list row
    tabs/                Dashboard, Trades, Analytics, Setups, Settings
sql/schema.sql    Supabase table + RLS definitions
```

## Build

```bash
npm run build
npm run preview
```
