# Headless Integration Preparation Plan (UI-Free)

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Implement all the necessary logic, state management, and network plumbing for "Live Trading" without modifying any UI components or disrupting the current "Paper/Simulated" default behavior.

**Strategy:** "The Adapter Pattern" - We will build the connections to the backend and expose them via the Stores, but keep them inactive by default. The Frontend Designer can then simply toggle a flag or call a method to "plug in" the real system when ready.

**Architecture:**
- **Infrastructure:** Vite Proxy & Base API Client.
- **Stores:** Logic branching (Simulated vs. Real) handled internally within `authStore`, `tradingStore`, and `marketStore`.
- **Default State:** `isPaperTrading = true`.

**Tech Stack:** TypeScript, Zustand, Fetch, WebSocket.

---

### Task 1: Plumbing & Infrastructure

**Files:**
- Modify: `apps/platform/vite.config.ts` (Setup Proxy)
- Create: `packages/bhcm-ui/src/platform/components/api/apiClient.ts` (Unified Client)

**Step 1: Configure Proxy**
- Map `/api` -> `http://localhost:3000` (Backend)
- Map `/ws-market` -> `ws://localhost:3001` (Market Data)

**Step 2: Build API Client**
- Create a `fetch` wrapper that handles:
    - Base URL management.
    - JWT Injection (Bearer token).
    - Standardized error handling.

---

### Task 2: Hybrid Authentication Store

**Files:**
- Modify: `packages/bhcm-ui/src/platform/components/store/authStore.ts`

**Step 1: Add Real Login Capability**
- Enhance the `login` action to attempt a real API call to `/auth/login`.
- **Fallback/Safety:** If the API call fails (e.g., backend down), or if specific "demo" credentials are used, strictly maintain the current mock behavior to ensure the UI design workflow is never blocked.

---

### Task 3: Hybrid Trading Store

**Files:**
- Modify: `packages/bhcm-ui/src/platform/components/store/tradingStore.ts`

**Step 1: Add Mode Switch**
- Add state: `isPaperTrading: boolean` (Default: `true`).
- Add action: `setTradingMode(isPaper: boolean)`.

**Step 2: Branch Order Logic**
- Update `createOrder`:
    - **If Paper:** Run existing simulation logic.
    - **If Real:** Call `apiClient.post('/orders', ...)` and handle the async response.

**Step 3: Add Data Fetching**
- Add `fetchRealOrders()` and `fetchRealPositions()` actions (to be called when in Live mode).

---

### Task 4: Hybrid Market Data Store

**Files:**
- Modify: `packages/bhcm-ui/src/platform/components/store/marketStore.ts`

**Step 1: WebSocket Client**
- Implement a robust WebSocket client inside the store (or as a helper in `services/`).
- Handle connection, reconnection, and subscription messages (`{ type: "subscribe", symbols: [...] }`).

**Step 2: Branch Subscription Logic**
- Update `subscribe(symbol)`:
    - **If Paper:** Run existing `setInterval` mock generator.
    - **If Real:** Open WebSocket connection and send subscribe message.

---

### Summary of "Plug Points"
Once this plan is executed, the integration will be ready. To "Plug" it in, you will only need to:
1.  Call `useTradingStore.getState().setTradingMode(false)`.
2.  Call `useMarketStore.getState().setLiveMode(true)` (or similar).
3.  Use valid credentials in the Login form.
