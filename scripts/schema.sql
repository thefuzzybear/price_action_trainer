-- ─────────────────────────────────────────────────────────────────────────────
-- Price Action Trainer — Supabase Schema
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor → New query)
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Extensions ────────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ── Datasets ──────────────────────────────────────────────────────────────────
-- Curated OHLCV datasets. Only you (service role) can insert/update/delete.
-- Users can only read rows where is_public = true (anon) or all rows (authed).
create table if not exists datasets (
  id           uuid primary key default uuid_generate_v4(),
  symbol       text not null,
  interval     text not null,            -- '1d', '1wk', '1mo', '1h' etc.
  period_start date not null,
  period_end   date not null,
  label        text,                     -- human readable e.g. "AAPL Daily 2020-2025"
  bar_count    integer not null default 0,
  bars         jsonb not null,           -- [{time, open, high, low, close, volume}]
  is_public    boolean not null default true,
  created_at   timestamptz not null default now()
);

-- Index for fast label/symbol searches
create index if not exists datasets_symbol_idx on datasets(symbol);
create index if not exists datasets_public_idx on datasets(is_public);

-- Unique constraint so ingest script can upsert safely
-- (onConflict: 'symbol,interval,period_start,period_end')
alter table datasets
  drop constraint if exists datasets_unique_series;
alter table datasets
  add constraint datasets_unique_series
  unique (symbol, interval, period_start, period_end);

-- ── Sessions ──────────────────────────────────────────────────────────────────
-- One session row per (user, dataset). Upserted on every save.
create table if not exists sessions (
  id                  uuid primary key default uuid_generate_v4(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  dataset_id          uuid not null references datasets(id) on delete cascade,
  visible_n           integer not null default 50,
  prediction_results  jsonb not null default '[]',
  resolved_trades     jsonb not null default '[]',
  notes               jsonb not null default '{}',
  active_trade        jsonb,
  saved_at            timestamptz not null default now(),
  unique(user_id, dataset_id)
);

create index if not exists sessions_user_idx on sessions(user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────────────────────────────────────────
alter table datasets enable row level security;
alter table sessions  enable row level security;

-- datasets: anonymous users see only public rows
create policy "anon_read_public_datasets"
  on datasets for select
  to anon
  using (is_public = true);

-- datasets: authenticated users see all rows
create policy "auth_read_all_datasets"
  on datasets for select
  to authenticated
  using (true);

-- datasets: only service role can write (no user-facing insert/update/delete)
-- (service role bypasses RLS by default — no explicit policy needed)

-- sessions: users can only see/write their own rows
create policy "users_own_sessions_select"
  on sessions for select
  to authenticated
  using (auth.uid() = user_id);

create policy "users_own_sessions_insert"
  on sessions for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "users_own_sessions_update"
  on sessions for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users_own_sessions_delete"
  on sessions for delete
  to authenticated
  using (auth.uid() = user_id);
