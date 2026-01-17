# OrderForm UI Improvements Design

## Context
The `OrderForm` has been refactored to use a clean `data`/`actions` prop pattern. The user now requests three specific UI improvements: Inline Validation, Visual Grouping for Advanced Fields, and a Spread Indicator.

## Objectives
1.  **Inline Validation**: Provide immediate feedback on invalid inputs (e.g., insufficient balance).
2.  **Visual Grouping**: Distinctly separate conditional/advanced inputs from standard ones.
3.  **Spread Indicator**: Show the spread between Best Bid and Best Ask.
4.  **Cleanup**: Remove dead code from styles.

## Detailed Design

### 1. Inline Validation
We need to calculate errors in the hook and pass them to the view.

**New Interface Property:**
`data.errors: { [key: string]: string | null }`

**Validation Logic (in `useOrderForm`):**
-   `quantity`: check `> 0` and `<= maxAvailable`.
-   `price`: check `> 0`.
-   `triggerPrice`: check `> 0` (if conditional).
-   `trailingValue`: check `> 0` (if trailing).

**UI Update (`OrderForm.view.tsx`):**
-   Update `InputWrapper` to accept an `$error` prop (changes border color to red).
-   Add a small `<ErrorText>` component below the input group to display the message.

### 2. Visual Grouping ("Advanced Mode")
Conditional orders and Trailing stops are "advanced."

**UI Update:**
-   Create a new styled component `<AdvancedSection>` (a `div` with a subtle background color, e.g., `rgba(255, 255, 255, 0.03)`, and a dashed border).
-   Move the Conditional/Trailing inputs inside this section.
-   Add a small header/label "Condition" to this section.

### 3. Spread Indicator
**Calculation:**
`spread = bestAsk - bestBid`
`spreadPercent = (spread / bestAsk) * 100`

**UI Update:**
-   Insert a `<SpreadBadge>` between the "Sell" and "Buy" PriceBoxes.
-   Display the absolute value and percentage (e.g., "0.50 (0.01%)").

### 4. Cleanup
-   Delete `QuickFillButtons`, `SideToggle`, `SideBtn`, `QuickActions`, `QuickBtn`, `OcoSection` from `OrderForm.styles.ts`.

## Implementation Plan
1.  **Update Types**: Add `errors` to `OrderFormData`.
2.  **Update Logic**: Implement real-time validation in `useOrderForm`.
3.  **Update Styles**: Add `AdvancedSection`, `SpreadBadge`, `ErrorText`. Remove dead code.
4.  **Update View**: Integrate the new components and error states.
