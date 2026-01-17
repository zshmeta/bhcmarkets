# Headless Integration (Hybrid Mode)

## Overview

We have implemented a **Headless Integration** layer that allows the frontend (`apps/platform` + `packages/bhcm-ui`) to operate in two distinct modes:

1.  **Paper/Simulated Mode (Default):** All trading logic and market data are simulated in-memory. No backend connection is required. This is the default state for development and design.
2.  **Live Mode:** The frontend connects to the real Backend API (`:3000`) and Market Data WebSocket (`:3001`).

This architecture allows frontend development to proceed independently of backend availability while providing a seamless switch to real integration.

## Architecture

The integration uses an **Adapter Pattern** within the Zustand stores. Each store decides whether to use local simulation logic or remote API calls based on its internal mode state.

### Infrastructure

*   **Vite Proxy (`apps/platform/vite.config.ts`):**
    *   `/api` requests are proxied to `http://localhost:3000`.
    *   `/ws-market` requests are proxied to `ws://localhost:3001`.
*   **API Client (`packages/bhcm-ui/.../api/apiClient.ts`):**
    *   A unified wrapper around `fetch`.
    *   Automatically injects the `Authorization: Bearer <token>` header from `localStorage`.
    *   Handles base URL resolution and standard error parsing.

## Store Modifications

### 1. Authentication (`authStore.ts`)
*   **Behavior:** Hybrid with Fallback.
*   **Logic:**
    *   `login()` first attempts a real API call to `POST /auth/login`.
    *   **Success:** Stores the JWT in `localStorage` (`bhcm.accessToken`) and sets the user state.
    *   **Failure:** If the API is down OR if credentials are `demo/demo`, it falls back to the local mock user.
*   **Impact:** Designers can always log in, even if the backend is crashed or not running.

### 2. Trading (`tradingStore.ts`)
*   **State:** `isPaperTrading: boolean` (Default: `true`).
*   **Action:** `setTradingMode(isPaper: boolean)`.
*   **Logic:**
    *   **Paper Mode:** Orders are created and filled immediately in-memory (simulated).
    *   **Live Mode:** `createOrder` calls `POST /api/orders`. It returns a `Promise` that resolves when the API responds.
    *   **Data:** `fetchOrders()` and `fetchPositions()` only trigger network requests in Live Mode.

### 3. Market Data (`marketStore.ts`)
*   **State:** `isLiveMode: boolean` (Default: `false`).
*   **Action:** `setLiveMode(isLive: boolean)`.
*   **Logic:**
    *   **Paper Mode:** Uses `setInterval` to generate random tick data and "fake" WebSocket messages locally.
    *   **Live Mode:** Connects to the real WebSocket (`ws://localhost:3001/ws`). Sends subscription messages and updates the order book from real server events.

## Usage Guide

### How to Enable Live Mode

To switch the application to Live Mode (e.g., for integration testing), you can invoke the store actions directly from the browser console or add a UI toggle.

```typescript
import { useTradingStore, useMarketStore } from '@repo/bhcm-ui/store';

// 1. Switch Trading to Live (sends orders to backend)
useTradingStore.getState().setTradingMode(false);

// 2. Switch Market Data to Live (connects to real WS)
useMarketStore.getState().setLiveMode(true);
```

### Development Workflow

1.  **Start the Backend Stack:**
    ```bash
    # From root
    docker-compose up -d  # (If dockerized)
    # OR run services individually
    bun run dev:backend
    bun run dev:market-data
    ```

2.  **Start Frontend:**
    ```bash
    bun run dev:platform
    ```

3.  **Log In:**
    *   Use a real user (registered in DB) to get a valid JWT.
    *   OR use `demo`/`demo` to enter UI-only mode (note: Live Trading will fail with 401 if you use the demo user, as it has no valid token).

## Testing

Unit tests for the hybrid logic are located in `packages/bhcm-ui`:
*   `src/platform/components/store/authStore.test.ts`
*   `src/platform/components/store/tradingStore.test.ts`
*   `src/platform/components/store/marketStore.test.ts`

Run them via:
```bash
cd packages/bhcm-ui
npm test
```
