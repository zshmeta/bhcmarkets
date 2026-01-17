# Live Trading & Real Data Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Enable "Live Mode" in the frontend that connects to the real Backend API and Market Data Service, while preserving the existing "Paper Mode" for simulation.

**Architecture:**
- **Hybrid Store Design:** The `tradingStore` and `authStore` will handle both simulated and real states.
- **API Client:** A unified `apiClient` will handle JWT injection and base URL configuration.
- **Toggle:** A global toggle in the UI will switch between modes.

**Tech Stack:** TypeScript, Zustand, Fetch API, Vite Proxy.

---

### Task 1: Environment & API Client Configuration

**Files:**
- Modify: `apps/platform/vite.config.ts` (Add proxy for local backend)
- Create: `packages/bhcm-ui/src/platform/components/api/apiClient.ts`

**Step 1: Update Vite Proxy**
Update `vite.config.ts` to proxy `/api` to the backend (default port 3000) and `/ws` to market-data (default port 3001, verify in `config/env.ts` if needed, but safe to assume standard ports or add fallback).

**Step 2: Create API Client**
Create a wrapper around `fetch` that:
- Reads `VITE_API_URL` (or uses relative `/api` path).
- Automatically injects `Authorization: Bearer <token>` from `localStorage`.
- Handles 401 errors (logout trigger).

---

### Task 2: Real Authentication

**Files:**
- Modify: `packages/bhcm-ui/src/platform/components/store/authStore.ts`

**Step 1: Add Real Login Action**
- Update `login` action to call `POST /auth/login`.
- On success, store the JWT in `localStorage` and memory.
- Update `logout` to clear the token.

**Step 2: Add Session Persistence**
- On app load, check for valid JWT (simple expiration check).
- If valid, set `isAuthenticated: true`.

---

### Task 3: Trading Store "Live Mode" Logic

**Files:**
- Modify: `packages/bhcm-ui/src/platform/components/store/tradingStore.ts`

**Step 1: Add Mode Toggle**
- Add `isPaperTrading: boolean` to state.
- Add `toggleTradingMode()` action.

**Step 2: Update Order Placement**
- In `createOrder`:
    - If `isPaperTrading`: Use existing simulation logic.
    - If `!isPaperTrading`: Call `apiClient.post('/orders', order)`.

**Step 3: Update Order Listing**
- Add `fetchOrders()` action.
- Call it when switching to "Live" mode or on interval.
- Fetch from `GET /orders`.

---

### Task 5: Market Data Connection (Bonus/Hybrid)

**Files:**
- Modify: `packages/bhcm-ui/src/platform/components/store/marketStore.ts`

**Step 1: Implement WebSocket Client**
- Add `connectRealFeed()` logic using `WebSocket`.
- URL: `ws://localhost:3001/ws` (proxied via Vite as `/ws-market` maybe?).
- Handle incoming `tick` messages and update `Level2Book` and `metrics`.

**Step 2: Integrate with Toggle**
- If "Live" mode is active, attempt to connect to Real Feed.
- If connection fails, fallback to simulation (with a toast warning).

