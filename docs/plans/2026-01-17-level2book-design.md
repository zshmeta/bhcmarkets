# Level2Book Design Improvements

## Context
The Level2Book is a critical component for traders, providing visibility into market depth and liquidity. The current implementation is functional but could be enhanced to provide better visual cues and interactivity.

## Objectives
1.  **Visual Depth Bars**: Ensure the depth bars (colored backgrounds indicating volume) are rendering correctly and are scaled appropriately.
2.  **Spread Visualization**: Improve the spread display to make it more prominent and informative.
3.  **Click-to-Fill**: Implement functionality where clicking a price level populates the OrderForm.
4.  **Performance**: Optimize for high-frequency updates.

## Detailed Design

### 1. Visual Depth Bars
*   **Current State**: `DepthBar` component exists and uses `$width` prop.
*   **Improvement**: Ensure `maxQuantity` calculation is robust. It should be the maximum of the *visible* levels, not the entire book, to maximize contrast.
*   **Styling**: Use a subtle gradient or opacity to make the text readable over the bar.

### 2. Spread Visualization
*   **Current State**: `SpreadSection` shows value and bps.
*   **Improvement**:
    *   Add a visual indicator of the spread width relative to price volatility? (Maybe too complex for now).
    *   Ensure the spread text color reflects the market state (tight spread = good = green/neutral, wide spread = warning = orange/red).

### 3. Click-to-Fill (Interaction)
*   **Current State**: `onPriceClick` prop exists in `Level2BookView`.
*   **Implementation**:
    *   In `Level2Book.tsx` (Container), define the handler.
    *   When a user clicks a **BID** (someone buying), they likely want to **SELL** to them. So clicking a Bid price should set the OrderForm to **SELL** at that price.
    *   Conversely, clicking an **ASK** (someone selling) means the user wants to **BUY** from them. Set OrderForm to **BUY**.
    *   **Action**: Use `useOrderForm` store actions (if available globally) or dispatch an event. Since `OrderForm` and `Level2Book` are siblings, we might need a shared store or context. The `tradingStore` or `useOrderForm` hook logic might need to be exposed.
    *   *Correction*: `useOrderForm` logic is local to the component. We need a way to communicate.
    *   *Solution*: We can use the `useTradingStore` or a simple event bus. Or, if `OrderForm` exposes a way to set values via the store...
    *   *Check*: `useOrderForm` reads from `useMarketStore` (best bid/ask) but doesn't seem to have a "set form values" global action.
    *   *Refined Solution*: The `OrderForm` likely accepts `price` and `quantity` as props or reads them from a store. Wait, `useOrderForm` has local state.
    *   *Alternative*: We can use the `eventBus` pattern or a small slice in `tradingStore` for "pre-filled order".
    *   *Simpler*: Use `useTradingStore` to hold a `selectedPrice` state that `OrderForm` listens to.

### 4. Performance
*   **Optimization**: Ensure `PriceLevel` is strictly memoized. The `prevPriceMap` is good for detecting changes.
*   **Throttling**: The `useLevel2Book` hook likely handles throttling.

## Plan
1.  **Review `useLevel2Book.ts`**: Check how it handles data updates and if `maxQuantities` is calculated correctly.
2.  **Verify Click Handler**: See where `onPriceClick` goes.
3.  **Update `Level2Book.styles.ts`**: Refine the visual style of depth bars.
4.  **Connect Click to OrderForm**: This is the tricky part. We might need to add a `setOrderInput` action to `tradingStore`.

Let's start by looking at `useLevel2Book.ts`.
