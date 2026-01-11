-- BHC Markets — vNext Blueprint Schema (PostgreSQL)
-- =================================================
--
-- This file is a *guideline schema* derived from docs/DATA_MODEL.md.
-- It intentionally includes tables beyond what is implemented today.
--
-- Notes:
-- - This is designed for PostgreSQL.
-- - Uses gen_random_uuid() from pgcrypto.
-- - Some columns are placeholders for encrypted/tokenized data.
-- - You will likely split this into migrations and iterate by phase.

BEGIN;

-- Extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------------
-- 1) ENUMS
-- ---------------------------------------------------------------------------
-- NOTE: Many SQL runners/parsers (and some VS Code extensions) do not support
-- Postgres procedural blocks like `DO $$ ... $$;`. To keep this file portable,
-- enums are defined with plain `CREATE TYPE ... AS ENUM`.
--
-- This means the file is intended to be run once on a fresh DB.
-- If you need to re-run it, drop these types first (careful: this can cascade):
--   DROP TYPE user_status, user_role, session_status, session_invalidation_reason,
--            account_type, account_status, order_side, order_type, order_status,
--            circuit_breaker_trigger, ledger_transaction_type, ledger_transaction_status,
--            asset_type, venue_type, instrument_type, kyc_status, order_event_type,
--            liquidity_role, withdrawal_status, deposit_status, notification_channel,
--            notification_status, support_ticket_status, payment_rail_type CASCADE;

CREATE TYPE user_status AS ENUM ('active','pending','suspended','deleted');
CREATE TYPE user_role AS ENUM ('user','admin','support');
CREATE TYPE session_status AS ENUM ('active','revoked','expired','replaced');
CREATE TYPE session_invalidation_reason AS ENUM (
  'manual','password_rotated','refresh_rotated','session_limit','suspicious_activity',
  'user_disabled','logout_all','expired'
);
CREATE TYPE account_type AS ENUM ('spot','margin','futures','demo');
CREATE TYPE account_status AS ENUM ('active','locked','closed');
CREATE TYPE order_side AS ENUM ('buy','sell');
CREATE TYPE order_type AS ENUM ('market','limit','stop','stop_limit','take_profit');
CREATE TYPE order_status AS ENUM ('new','open','partially_filled','filled','cancelled','rejected','expired');
CREATE TYPE circuit_breaker_trigger AS ENUM ('manual','house_exposure','price_volatility','system_error','external_event');
CREATE TYPE ledger_transaction_type AS ENUM (
  'deposit','withdrawal','trade_buy','trade_sell','fee','fee_rebate','transfer_in','transfer_out',
  'adjustment','hold','release','margin_call','funding','bonus','referral'
);
CREATE TYPE ledger_transaction_status AS ENUM ('pending','completed','failed','cancelled','reversed');

-- vNext enums
CREATE TYPE asset_type AS ENUM ('fiat','crypto','equity','commodity','fx');
CREATE TYPE venue_type AS ENUM ('internal_matching','external_broker','external_exchange');
CREATE TYPE instrument_type AS ENUM ('spot','margin','perpetual','futures','cfd');
CREATE TYPE kyc_status AS ENUM ('not_started','pending','approved','rejected','expired');
CREATE TYPE order_event_type AS ENUM ('created','accepted','rejected','amended','partially_filled','filled','cancelled','expired');
CREATE TYPE liquidity_role AS ENUM ('maker','taker');
CREATE TYPE withdrawal_status AS ENUM ('requested','approved','sent','confirmed','failed','cancelled');
CREATE TYPE deposit_status AS ENUM ('created','pending','confirmed','credited','failed');
CREATE TYPE notification_channel AS ENUM ('email','sms','push','webhook');
CREATE TYPE notification_status AS ENUM ('queued','sent','delivered','failed');
CREATE TYPE support_ticket_status AS ENUM ('open','pending','resolved','closed');
CREATE TYPE payment_rail_type AS ENUM ('ach','sepa','wire','card','crypto');

-- ---------------------------------------------------------------------------
-- 2) IDENTITY & SECURITY
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email varchar(255) NOT NULL UNIQUE,
  status user_status NOT NULL DEFAULT 'pending',
  role user_role NOT NULL DEFAULT 'user',
  last_login_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_credentials (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  password_hash text NOT NULL,
  version int NOT NULL DEFAULT 1,
  failed_attempt_count int NOT NULL DEFAULT 0,
  locked_until timestamptz,
  password_updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS auth_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  refresh_token_hash text NOT NULL,
  refresh_token_version int NOT NULL DEFAULT 1,
  password_version int NOT NULL DEFAULT 1,
  status session_status NOT NULL DEFAULT 'active',
  user_agent text,
  ip_address varchar(45),
  device_fingerprint text,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  revoked_reason session_invalidation_reason,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_auth_sessions_refresh_token_hash ON auth_sessions(refresh_token_hash);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_user ON auth_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_status_expires ON auth_sessions(status, expires_at);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id bigserial PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  used boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user ON password_reset_tokens(user_id);

-- Used by backend repo today but missing in Drizzle: blueprint includes it.
CREATE TABLE IF NOT EXISTS auth_codes (
  code varchar(128) PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  used_at timestamptz
);

-- vNext identity
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  legal_name text,
  date_of_birth date,
  residency_country varchar(2),
  tax_residency_country varchar(2),
  address_json jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_contact_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type varchar(32) NOT NULL, -- email/phone
  value text NOT NULL,
  verified boolean NOT NULL DEFAULT false,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_user_contact_methods_user ON user_contact_methods(user_id);

CREATE TABLE IF NOT EXISTS user_2fa_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type varchar(32) NOT NULL, -- totp/webauthn/sms
  secret_ref text, -- pointer to encrypted secret
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_user_2fa_methods_user ON user_2fa_methods(user_id);

CREATE TABLE IF NOT EXISTS api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name varchar(200),
  key_hash text NOT NULL,
  scopes text NOT NULL DEFAULT '',
  ip_allowlist jsonb,
  last_used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_user ON api_keys(user_id);

CREATE TABLE IF NOT EXISTS user_security_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  event_type varchar(64) NOT NULL,
  ip_address varchar(45),
  user_agent text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_user_security_events_user ON user_security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_user_security_events_time ON user_security_events(created_at);

-- ---------------------------------------------------------------------------
-- 3) COMPLIANCE (KYC/AML)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS kyc_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status kyc_status NOT NULL DEFAULT 'not_started',
  provider varchar(64),
  provider_reference varchar(128),
  review_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_kyc_cases_user ON kyc_cases(user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_cases_status ON kyc_cases(status);

CREATE TABLE IF NOT EXISTS kyc_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kyc_case_id uuid NOT NULL REFERENCES kyc_cases(id) ON DELETE CASCADE,
  document_type varchar(64) NOT NULL,
  storage_ref text NOT NULL,
  expires_on date,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_kyc_documents_case ON kyc_documents(kyc_case_id);

CREATE TABLE IF NOT EXISTS aml_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  severity int NOT NULL DEFAULT 1,
  reason_code varchar(64) NOT NULL,
  details jsonb,
  resolved_at timestamptz,
  resolved_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_aml_flags_user ON aml_flags(user_id);

CREATE TABLE IF NOT EXISTS sanctions_screenings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider varchar(64),
  match_score numeric(10,4),
  matched_entity jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sanctions_screenings_user ON sanctions_screenings(user_id);

-- ---------------------------------------------------------------------------
-- 4) REFERENCE DATA (ASSETS / INSTRUMENTS / VENUES)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS assets (
  code varchar(20) PRIMARY KEY,
  type asset_type NOT NULL,
  name varchar(200),
  decimals int NOT NULL DEFAULT 8,
  display_decimals int NOT NULL DEFAULT 2,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS venues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(200) NOT NULL,
  type venue_type NOT NULL,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS instruments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol varchar(64) NOT NULL UNIQUE,
  venue_id uuid REFERENCES venues(id) ON DELETE SET NULL,
  venue_symbol varchar(64),
  base_asset_code varchar(20) NOT NULL REFERENCES assets(code),
  quote_asset_code varchar(20) NOT NULL REFERENCES assets(code),
  instrument_type instrument_type NOT NULL DEFAULT 'spot',
  trading_enabled boolean NOT NULL DEFAULT true,
  tick_size numeric(30,10) NOT NULL DEFAULT 0.01,
  lot_size numeric(30,10) NOT NULL DEFAULT 0.0001,
  min_order_size numeric(30,10) NOT NULL DEFAULT 0.0001,
  max_order_size numeric(30,10) NOT NULL DEFAULT 1000,
  price_decimals int NOT NULL DEFAULT 2,
  quantity_decimals int NOT NULL DEFAULT 8,
  maker_fee_bps numeric(10,4) NOT NULL DEFAULT 10, -- 10 bps = 0.10%
  taker_fee_bps numeric(10,4) NOT NULL DEFAULT 20,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (venue_id, venue_symbol)
);

CREATE TABLE IF NOT EXISTS instrument_trading_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instrument_id uuid NOT NULL REFERENCES instruments(id) ON DELETE CASCADE,
  timezone varchar(64) NOT NULL,
  schedule jsonb NOT NULL, -- holidays/market hours
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_instrument_trading_sessions_instrument ON instrument_trading_sessions(instrument_id);

-- Backward-compatible table name currently in Drizzle: symbols
CREATE TABLE IF NOT EXISTS symbols (
  symbol varchar(20) PRIMARY KEY,
  base_currency varchar(10) NOT NULL,
  quote_currency varchar(10) NOT NULL,
  trading_enabled boolean NOT NULL DEFAULT true,
  min_order_size numeric(24,8) NOT NULL DEFAULT 0.0001,
  max_order_size numeric(24,8) NOT NULL DEFAULT 1000,
  maker_fee numeric(8,6) NOT NULL DEFAULT 0.001,
  taker_fee numeric(8,6) NOT NULL DEFAULT 0.002,
  price_decimals int NOT NULL DEFAULT 2,
  quantity_decimals int NOT NULL DEFAULT 8,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 5) ACCOUNTS & LEDGER
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  currency varchar(10) NOT NULL,
  balance numeric(30,10) NOT NULL DEFAULT 0,
  locked numeric(30,10) NOT NULL DEFAULT 0,
  account_type account_type NOT NULL DEFAULT 'spot',
  status account_status NOT NULL DEFAULT 'active',
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_accounts_user ON accounts(user_id);

-- vNext account hierarchy
CREATE TABLE IF NOT EXISTS trading_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product account_type NOT NULL DEFAULT 'spot',
  status account_status NOT NULL DEFAULT 'active',
  risk_tier varchar(50),
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_trading_accounts_user ON trading_accounts(user_id);

CREATE TABLE IF NOT EXISTS subaccounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trading_account_id uuid NOT NULL REFERENCES trading_accounts(id) ON DELETE CASCADE,
  name varchar(200) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (trading_account_id, name)
);

CREATE TABLE IF NOT EXISTS ledger_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trading_account_id uuid REFERENCES trading_accounts(id) ON DELETE CASCADE,
  subaccount_id uuid REFERENCES subaccounts(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (
    (trading_account_id IS NOT NULL) OR (subaccount_id IS NOT NULL)
  )
);

CREATE TABLE IF NOT EXISTS ledger_balances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ledger_account_id uuid REFERENCES ledger_accounts(id) ON DELETE CASCADE,
  -- Backward compatible: some services use account_id directly
  account_id uuid,
  asset varchar(20) NOT NULL,
  available numeric(30,10) NOT NULL DEFAULT 0,
  held numeric(30,10) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((ledger_account_id IS NOT NULL) OR (account_id IS NOT NULL))
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_ledger_balances_ledger_asset ON ledger_balances(ledger_account_id, asset);
CREATE UNIQUE INDEX IF NOT EXISTS uq_ledger_balances_account_asset ON ledger_balances(account_id, asset);
CREATE INDEX IF NOT EXISTS idx_ledger_balances_account ON ledger_balances(account_id);

CREATE TABLE IF NOT EXISTS ledger_holds (
  order_id uuid PRIMARY KEY,
  ledger_account_id uuid REFERENCES ledger_accounts(id) ON DELETE CASCADE,
  account_id uuid,
  asset varchar(20) NOT NULL,
  amount numeric(30,10) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((ledger_account_id IS NOT NULL) OR (account_id IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS idx_ledger_holds_account ON ledger_holds(account_id);
CREATE INDEX IF NOT EXISTS idx_ledger_holds_asset ON ledger_holds(asset);

CREATE TABLE IF NOT EXISTS ledger_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ledger_account_id uuid REFERENCES ledger_accounts(id) ON DELETE SET NULL,
  account_id uuid,
  asset varchar(20) NOT NULL,
  type ledger_transaction_type NOT NULL,
  amount numeric(30,10) NOT NULL,
  balance_after numeric(30,10),
  reference_id varchar(64),
  reference_type varchar(32),
  description text,
  status ledger_transaction_status NOT NULL DEFAULT 'completed',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_account ON ledger_entries(account_id);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_account_asset ON ledger_entries(account_id, asset);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_ref ON ledger_entries(reference_id);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_type ON ledger_entries(type);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_created ON ledger_entries(created_at);

-- ---------------------------------------------------------------------------
-- 6) ORDERS / EXECUTION / POSITIONS
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- vNext prefers trading_account_id + instrument_id
  trading_account_id uuid REFERENCES trading_accounts(id) ON DELETE CASCADE,
  instrument_id uuid REFERENCES instruments(id),
  -- backward-compatible current:
  account_id uuid REFERENCES accounts(id) ON DELETE CASCADE,
  symbol varchar(64) NOT NULL,
  side order_side NOT NULL,
  type order_type NOT NULL,
  time_in_force varchar(50),
  price numeric(30,10),
  stop_price numeric(30,10),
  quantity numeric(30,10) NOT NULL,
  filled_quantity numeric(30,10) NOT NULL DEFAULT 0,
  average_fill_price numeric(30,10),
  status order_status NOT NULL DEFAULT 'new',
  client_order_id varchar(64),
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  cancelled_at timestamptz,
  cancel_reason text,
  CHECK ((trading_account_id IS NOT NULL) OR (account_id IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS idx_orders_account ON orders(account_id);
CREATE INDEX IF NOT EXISTS idx_orders_symbol ON orders(symbol);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE UNIQUE INDEX IF NOT EXISTS uq_orders_account_client_order_id ON orders(account_id, client_order_id);

CREATE TABLE IF NOT EXISTS order_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  event_type order_event_type NOT NULL,
  actor_type varchar(32) NOT NULL DEFAULT 'system', -- user/system/admin
  actor_id uuid,
  reason_code varchar(64),
  before jsonb,
  after jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_order_events_order ON order_events(order_id);
CREATE INDEX IF NOT EXISTS idx_order_events_time ON order_events(created_at);

CREATE TABLE IF NOT EXISTS order_rejections (
  order_id uuid PRIMARY KEY REFERENCES orders(id) ON DELETE CASCADE,
  rejection_code varchar(64) NOT NULL,
  message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS idempotency_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  key varchar(128) NOT NULL,
  request_hash varchar(128),
  status varchar(32) NOT NULL DEFAULT 'completed',
  response_json jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, key)
);

-- Market-level match (maker/taker)
CREATE TABLE IF NOT EXISTS matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instrument_id uuid REFERENCES instruments(id),
  symbol varchar(64) NOT NULL,
  maker_order_id uuid NOT NULL REFERENCES orders(id),
  taker_order_id uuid NOT NULL REFERENCES orders(id),
  price numeric(30,10) NOT NULL,
  quantity numeric(30,10) NOT NULL,
  executed_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_matches_symbol_time ON matches(symbol, executed_at);

-- Per-order execution records
CREATE TABLE IF NOT EXISTS fills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  match_id uuid REFERENCES matches(id) ON DELETE SET NULL,
  liquidity liquidity_role NOT NULL,
  price numeric(30,10) NOT NULL,
  quantity numeric(30,10) NOT NULL,
  fee_asset varchar(20),
  fee_amount numeric(30,10) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_fills_order ON fills(order_id);
CREATE INDEX IF NOT EXISTS idx_fills_time ON fills(created_at);

-- Backward compatible current "trades" table shape (order-id based)
CREATE TABLE IF NOT EXISTS trades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  price numeric(30,10) NOT NULL,
  quantity numeric(30,10) NOT NULL,
  fee numeric(30,10) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_trades_order ON trades(order_id);

-- Optional engine-style trade table (maker/taker). Keep separate to avoid collision.
CREATE TABLE IF NOT EXISTS execution_trades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instrument_id uuid REFERENCES instruments(id),
  symbol varchar(64) NOT NULL,
  maker_order_id uuid NOT NULL,
  taker_order_id uuid NOT NULL,
  maker_account_id uuid,
  taker_account_id uuid,
  price numeric(30,10) NOT NULL,
  quantity numeric(30,10) NOT NULL,
  maker_fee numeric(30,10) NOT NULL DEFAULT 0,
  taker_fee numeric(30,10) NOT NULL DEFAULT 0,
  status varchar(32) NOT NULL DEFAULT 'executed',
  created_at timestamptz NOT NULL DEFAULT now(),
  settled_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_execution_trades_symbol_time ON execution_trades(symbol, created_at);

CREATE TABLE IF NOT EXISTS positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trading_account_id uuid REFERENCES trading_accounts(id) ON DELETE CASCADE,
  instrument_id uuid REFERENCES instruments(id),
  -- backward compatible current:
  account_id uuid REFERENCES accounts(id) ON DELETE CASCADE,
  symbol varchar(64) NOT NULL,
  side varchar(10) NOT NULL,
  quantity numeric(30,10) NOT NULL DEFAULT 0,
  entry_price numeric(30,10),
  average_entry_price numeric(30,10),
  cost_basis numeric(30,10),
  unrealized_pnl numeric(30,10) NOT NULL DEFAULT 0,
  realized_pnl numeric(30,10) NOT NULL DEFAULT 0,
  opened_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((trading_account_id IS NOT NULL) OR (account_id IS NOT NULL))
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_positions_account_symbol ON positions(account_id, symbol);

CREATE TABLE IF NOT EXISTS position_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  position_id uuid NOT NULL REFERENCES positions(id) ON DELETE CASCADE,
  event_type varchar(64) NOT NULL,
  reference_type varchar(32),
  reference_id varchar(64),
  delta_quantity numeric(30,10),
  price numeric(30,10),
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_position_events_position ON position_events(position_id);
CREATE INDEX IF NOT EXISTS idx_position_events_time ON position_events(created_at);

-- Optional tax lots (equities/spot tax accounting)
CREATE TABLE IF NOT EXISTS position_lots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  position_id uuid NOT NULL REFERENCES positions(id) ON DELETE CASCADE,
  opened_at timestamptz NOT NULL,
  quantity numeric(30,10) NOT NULL,
  cost_basis numeric(30,10) NOT NULL,
  metadata jsonb
);
CREATE INDEX IF NOT EXISTS idx_position_lots_position ON position_lots(position_id);

-- Snapshotting (NAV/exposure)
CREATE TABLE IF NOT EXISTS portfolio_snapshots (
  trading_account_id uuid NOT NULL REFERENCES trading_accounts(id) ON DELETE CASCADE,
  snapshot_at timestamptz NOT NULL,
  nav numeric(30,10) NOT NULL,
  total_exposure numeric(30,10) NOT NULL DEFAULT 0,
  margin_used numeric(30,10) NOT NULL DEFAULT 0,
  metadata jsonb,
  PRIMARY KEY (trading_account_id, snapshot_at)
);

-- Optional closed-position history (currently referenced by order-engine)
CREATE TABLE IF NOT EXISTS position_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  symbol varchar(64) NOT NULL,
  side varchar(10) NOT NULL,
  quantity numeric(30,10) NOT NULL,
  entry_price numeric(30,10) NOT NULL,
  exit_price numeric(30,10) NOT NULL,
  realized_pnl numeric(30,10) NOT NULL,
  opened_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_position_history_account_time ON position_history(account_id, closed_at);

-- ---------------------------------------------------------------------------
-- 7) MARKET DATA
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS market_prices (
  id bigserial PRIMARY KEY,
  symbol varchar(32) NOT NULL,
  price numeric(30,10) NOT NULL,
  currency varchar(10),
  source varchar(32),
  "timestamp" timestamptz NOT NULL DEFAULT now(),
  metadata jsonb
);
CREATE INDEX IF NOT EXISTS idx_market_prices_symbol ON market_prices(symbol);
CREATE INDEX IF NOT EXISTS idx_market_prices_timestamp ON market_prices("timestamp");
CREATE INDEX IF NOT EXISTS idx_market_prices_symbol_time ON market_prices(symbol, "timestamp");

CREATE TABLE IF NOT EXISTS candles (
  id serial PRIMARY KEY,
  symbol varchar(20) NOT NULL,
  timeframe varchar(5) NOT NULL,
  open numeric(20,8) NOT NULL,
  high numeric(20,8) NOT NULL,
  low numeric(20,8) NOT NULL,
  close numeric(20,8) NOT NULL,
  volume numeric(20,8) NOT NULL DEFAULT 0,
  tick_count int NOT NULL DEFAULT 0,
  "timestamp" timestamptz NOT NULL,
  UNIQUE(symbol, timeframe, "timestamp")
);
CREATE INDEX IF NOT EXISTS idx_candles_symbol_tf ON candles(symbol, timeframe);
CREATE INDEX IF NOT EXISTS idx_candles_timestamp ON candles("timestamp");

-- vNext derivatives pricing
CREATE TABLE IF NOT EXISTS mark_prices (
  id bigserial PRIMARY KEY,
  instrument_id uuid REFERENCES instruments(id) ON DELETE CASCADE,
  symbol varchar(64) NOT NULL,
  mark_price numeric(30,10) NOT NULL,
  index_price numeric(30,10),
  source varchar(32),
  "timestamp" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_mark_prices_symbol_time ON mark_prices(symbol, "timestamp");

-- ---------------------------------------------------------------------------
-- 8) RISK
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS symbol_risk_limits (
  symbol varchar(32) PRIMARY KEY,
  trading_enabled boolean NOT NULL DEFAULT true,
  min_order_size numeric(28,8) NOT NULL DEFAULT 0.0001,
  max_order_size numeric(28,8) NOT NULL DEFAULT 1000,
  lot_size numeric(28,8) NOT NULL DEFAULT 0.0001,
  max_price_deviation numeric(8,4) NOT NULL DEFAULT 0.05,
  max_user_position numeric(28,8) NOT NULL DEFAULT 100,
  max_house_exposure numeric(28,8) NOT NULL DEFAULT 10000,
  max_house_notional_exposure numeric(28,2) NOT NULL DEFAULT 1000000,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_risk_limits (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  trading_restricted boolean NOT NULL DEFAULT false,
  restriction_reason text,
  max_orders_per_minute int NOT NULL DEFAULT 30,
  daily_loss_limit numeric(28,2) NOT NULL DEFAULT 10000,
  max_symbol_position_value numeric(28,2) NOT NULL DEFAULT 100000,
  max_total_position_value numeric(28,2) NOT NULL DEFAULT 500000,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS circuit_breaker_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol varchar(32),
  trigger circuit_breaker_trigger NOT NULL,
  reason text NOT NULL,
  activated_at timestamptz NOT NULL,
  activated_by uuid REFERENCES users(id) ON DELETE SET NULL,
  deactivated_at timestamptz,
  deactivated_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_circuit_breaker_symbol ON circuit_breaker_events(symbol);
CREATE INDEX IF NOT EXISTS idx_circuit_breaker_active ON circuit_breaker_events(symbol, deactivated_at);

CREATE TABLE IF NOT EXISTS order_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  symbol varchar(32),
  was_approved boolean NOT NULL DEFAULT true,
  rejection_code varchar(32),
  attempted_at timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_order_attempts_user_time ON order_attempts(user_id, attempted_at);

CREATE TABLE IF NOT EXISTS daily_user_pnl (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date date NOT NULL,
  realized_pnl numeric(28,2) NOT NULL DEFAULT 0,
  trading_fees numeric(28,2) NOT NULL DEFAULT 0,
  trade_count int NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

-- ---------------------------------------------------------------------------
-- 9) ADMIN AUDIT & SYSTEM AUDIT
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  admin_email varchar(255),
  action varchar(100) NOT NULL,
  target_type varchar(50) NOT NULL,
  target_id uuid,
  target_identifier varchar(255),
  old_value jsonb,
  new_value jsonb,
  reason varchar(1000) NOT NULL,
  ip_address varchar(45),
  user_agent varchar(500),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_admin_audit_admin ON admin_audit_log(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_action ON admin_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_admin_audit_target ON admin_audit_log(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_time ON admin_audit_log(created_at);

CREATE TABLE IF NOT EXISTS service_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name varchar(100) NOT NULL,
  action varchar(100) NOT NULL,
  target_type varchar(50),
  target_id varchar(64),
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_service_audit_time ON service_audit_log(created_at);

CREATE TABLE IF NOT EXISTS data_corrections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requested_by uuid REFERENCES users(id) ON DELETE SET NULL,
  approved_by uuid REFERENCES users(id) ON DELETE SET NULL,
  reason text NOT NULL,
  correction jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 10) FUNDING (DEPOSITS / WITHDRAWALS / TRANSFERS)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS payment_rails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type payment_rail_type NOT NULL,
  name varchar(200) NOT NULL,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS bank_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rail_id uuid REFERENCES payment_rails(id) ON DELETE SET NULL,
  label varchar(200),
  tokenized_details jsonb NOT NULL, -- store token refs, not raw numbers
  verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_user ON bank_accounts(user_id);

CREATE TABLE IF NOT EXISTS crypto_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  asset_code varchar(20) REFERENCES assets(code),
  network varchar(64) NOT NULL,
  address text NOT NULL,
  label varchar(200),
  whitelisted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, network, address)
);

CREATE TABLE IF NOT EXISTS deposits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  asset_code varchar(20) NOT NULL REFERENCES assets(code),
  amount numeric(30,10) NOT NULL,
  status deposit_status NOT NULL DEFAULT 'created',
  rail_id uuid REFERENCES payment_rails(id) ON DELETE SET NULL,
  bank_account_id uuid REFERENCES bank_accounts(id) ON DELETE SET NULL,
  crypto_address_id uuid REFERENCES crypto_addresses(id) ON DELETE SET NULL,
  external_reference varchar(128),
  txid varchar(200),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_deposits_user_time ON deposits(user_id, created_at);

CREATE TABLE IF NOT EXISTS withdrawals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  asset_code varchar(20) NOT NULL REFERENCES assets(code),
  amount numeric(30,10) NOT NULL,
  fee_amount numeric(30,10) NOT NULL DEFAULT 0,
  status withdrawal_status NOT NULL DEFAULT 'requested',
  rail_id uuid REFERENCES payment_rails(id) ON DELETE SET NULL,
  bank_account_id uuid REFERENCES bank_accounts(id) ON DELETE SET NULL,
  crypto_address_id uuid REFERENCES crypto_addresses(id) ON DELETE SET NULL,
  txid varchar(200),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_withdrawals_user_time ON withdrawals(user_id, created_at);

CREATE TABLE IF NOT EXISTS internal_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_ledger_account_id uuid REFERENCES ledger_accounts(id) ON DELETE SET NULL,
  to_ledger_account_id uuid REFERENCES ledger_accounts(id) ON DELETE SET NULL,
  asset_code varchar(20) NOT NULL REFERENCES assets(code),
  amount numeric(30,10) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 11) FEES / TIERS
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS fee_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(200) NOT NULL,
  instrument_id uuid REFERENCES instruments(id) ON DELETE SET NULL,
  maker_fee_bps numeric(10,4) NOT NULL DEFAULT 10,
  taker_fee_bps numeric(10,4) NOT NULL DEFAULT 20,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS fee_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(200) NOT NULL,
  volume_30d_threshold numeric(30,10) NOT NULL,
  maker_fee_bps numeric(10,4) NOT NULL,
  taker_fee_bps numeric(10,4) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_fee_tier_assignments (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  fee_tier_id uuid NOT NULL REFERENCES fee_tiers(id) ON DELETE RESTRICT,
  effective_from timestamptz NOT NULL DEFAULT now(),
  effective_to timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 12) MARGIN / FUTURES (PLACEHOLDERS)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS margin_requirements (
  instrument_id uuid PRIMARY KEY REFERENCES instruments(id) ON DELETE CASCADE,
  initial_margin_ratio numeric(10,6) NOT NULL,
  maintenance_margin_ratio numeric(10,6) NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS borrow_lend_positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trading_account_id uuid NOT NULL REFERENCES trading_accounts(id) ON DELETE CASCADE,
  asset_code varchar(20) NOT NULL REFERENCES assets(code),
  borrowed_amount numeric(30,10) NOT NULL,
  interest_accrued numeric(30,10) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS funding_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instrument_id uuid NOT NULL REFERENCES instruments(id) ON DELETE CASCADE,
  rate numeric(18,12) NOT NULL,
  effective_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(instrument_id, effective_at)
);

CREATE TABLE IF NOT EXISTS funding_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  position_id uuid REFERENCES positions(id) ON DELETE SET NULL,
  instrument_id uuid REFERENCES instruments(id) ON DELETE SET NULL,
  amount numeric(30,10) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS liquidation_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trading_account_id uuid NOT NULL REFERENCES trading_accounts(id) ON DELETE CASCADE,
  instrument_id uuid REFERENCES instruments(id) ON DELETE SET NULL,
  reason_code varchar(64) NOT NULL,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 13) SUPPORT / NOTIFICATIONS / WEBHOOKS
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  subject varchar(300) NOT NULL,
  status support_ticket_status NOT NULL DEFAULT 'open',
  priority int NOT NULL DEFAULT 3,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS support_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_type varchar(32) NOT NULL, -- user/support/system
  sender_id uuid,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  channel notification_channel NOT NULL,
  template varchar(100),
  payload jsonb,
  status notification_status NOT NULL DEFAULT 'queued',
  provider_message_id varchar(200),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user_time ON notifications(user_id, created_at);

CREATE TABLE IF NOT EXISTS webhook_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  url text NOT NULL,
  secret_ref text,
  events text NOT NULL DEFAULT '',
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid NOT NULL REFERENCES webhook_subscriptions(id) ON DELETE CASCADE,
  event_type varchar(100) NOT NULL,
  payload jsonb NOT NULL,
  status notification_status NOT NULL DEFAULT 'queued',
  attempt_count int NOT NULL DEFAULT 0,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMIT;
