# 2026-01-17 — Architecture Hardening Plan

## Goal
Reduce correctness/security risk and eliminate cross-service drift by standardizing **symbols**, **money/precision**, and **service boundaries** (who owns what) before adding more product surface.

This is written as a sequence of small PRs that can ship independently.

---

## PR0 (This PR / already started): Symbol consistency + URL safety

### Why
- The repo currently mixes `BTC/USD` and `BTC-USD` in different places.
- Some components reject the canonical symbol format (`OrderValidator` rejected `/`).
- Some HTTP routes use symbols in path params but did not URL-decode (so `BTC%2FUSD` wouldn’t work).

### Deliverables
- Canonical symbol acceptance for trading paths (`BTC/USD`, `AIR.PA`, etc.)
- URL-decoding of path params where symbols are used
- Update unit tests to match canonical symbol format
- Decide and document how symbols are transported over HTTP paths (encoded) vs JSON bodies

### Acceptance
- `packages/order-engine` tests pass and accept `BTC/USD`.
- `/orderbook/BTC%2FUSD` returns a snapshot with `symbol: "BTC/USD"`.

---

## PR1: Introduce a single symbol normalization API (no behavior change yet)

### Why
Even if we standardize on `BTC/USD`, we still must interface with:
- external feeds (`BTC-USD`, `btcUSD`)
- URL path params (encoded)
- storage/query conventions

### Deliverables
Add `@repo/sdk` helpers (or a new tiny `@repo/symbols` package) like:
- `toCanonicalSymbol(input: string): string | null` (accepts `BTC/USD`, `BTC-USD`, maybe `BTCUSD` if needed)
- `toUrlSymbol(canonical: string): string` (e.g. `encodeURIComponent(canonical)`)
- `isCanonicalSymbol(s: string): boolean`

### Acceptance
- All apps/services that accept a `symbol` either:
  - require canonical format, or
  - normalize at the boundary

---

## PR2: Money/precision policy (strings/Decimal or integer atoms)

### Why
Trading correctness can’t tolerate JS `number` floats. Today we use `parseFloat`, `toFixed`, and arithmetic in multiple hot paths.

### Decision
Pick ONE:
1) **Decimal strings + decimal library** (fast to adopt; easiest migration)
2) **Integer atoms** (most robust; more invasive)

### Deliverables (recommended staged)
- Define `MoneyAmount` / `Price` / `Quantity` types and constructors.
- Migrate `TradingService.calculateLockAmount` to non-float.
- Migrate order-engine matching math away from floats.

### Acceptance
- No float arithmetic in order placement + settlement paths.
- New types prevent accidental mixing.

---

## PR3: Clarify service boundaries and ownership

### Why
Currently:
- Backend both exposes trading routes and also implies clients may call order-engine directly.
- Holds/locks are performed in multiple places.
- Order-engine trusts `X-Account-ID`.

### Deliverables
Pick one architecture and enforce it:

**Option A (recommended)**: Clients talk to Backend only.
- Backend authenticates users and authorizes account access.
- Backend calls order-engine on behalf of users using service-to-service auth.
- order-engine is private (network + auth), no browser access.

**Option B**: Clients talk to order-engine.
- order-engine must do authN/authZ (JWT validation, account ownership), rate limits, etc.

### Acceptance
- Single entrypoint for user traffic.
- Single owner for ledger holds and rollback semantics.

---

## PR4: Standardize HTTP plumbing & error shapes

### Why
Backend, order-engine, market-data each have different routers, CORS defaults, and error payload shapes.

### Deliverables
- Shared minimal router/middleware or adopt Fastify uniformly.
- Standard error envelope `{ error: { code, message, details? } }`.
- Standard CORS configuration (no `*` on authenticated routes).

---

## PR5: Documentation drift cleanup

### Deliverables
- Update docs that claim Socket.IO for market-data (it’s `ws`).
- Fix API docs discrepancies where endpoints exist but docs say missing.
- Add “symbol transport” section describing canonical vs url-encoding.

---

## Notes
This plan intentionally starts with low-risk consistency fixes (symbols) and then tackles correctness/security fundamentals (money + service boundaries).
