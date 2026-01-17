# Refactor OrderForm to Data/Actions Pattern

## Context
The `OrderForm.view.tsx` component currently takes ~50 individual props. This "Prop Explosion" makes it difficult to maintain, test, and use in Storybook. The user has requested a refactor to decompose the component and fix Storybook usage.

## Objective
Refactor the `OrderForm` component pair (Container/View) to use a "Grouped Props" pattern, separating read-only data from actions.

## detailed Design

### 1. New Interfaces
We will define two main interfaces (likely in `OrderForm.types.ts` or exported from `OrderForm.view.tsx`):

```typescript
export interface OrderFormData {
    // Form State
    form: OrderFormFormState;
    
    // Market & User Context
    baseAsset: string;
    quoteAsset: string;
    balances: BalanceInfo;
    dataConfidence: DataConfidenceInfo;
    estimated: EstimatedValues;
    
    // UI State
    focusMode: boolean;
    isSubmitDisabled: boolean;
    showDegradedConfirm: boolean;
    showConfirmModal: boolean;
    
    // External Data
    bestBidPrice: string;
    bestAskPrice: string;
    
    // Refs (MutableRefObject needs to be in Data or separate? Data is fine)
    refs: {
        price: React.RefObject<HTMLInputElement | null>;
        quantity: React.RefObject<HTMLInputElement | null>;
        tp: React.RefObject<HTMLInputElement | null>;
        sl: React.RefObject<HTMLInputElement | null>;
    };

    // I18n
    translations: OrderFormTranslations;
    commonConfirm: string;
    commonCancel: string;
}

export interface OrderFormActions {
    // Field Updates
    onSideChange: (side: OrderSide) => void;
    onOrderCategoryChange: (cat: OrderCategory) => void;
    onTypeChange: (type: OrderType) => void;
    // ... all other field setters
    
    // Quick Actions
    onSetFromBestBid: () => void;
    onSetFromBestAsk: () => void;
    onStepUp: () => void;
    onStepDown: () => void;
    
    // UI Actions
    onInputFocus: (inputName: string) => () => void;
    onInputBlur: () => void;
    onShowDegradedConfirm: (show: boolean) => void;
    onShowConfirmModal: (show: boolean) => void;
    
    // Submission
    onSubmit: (e: React.FormEvent) => void;
    onConfirmOrder: () => void;
}
```

### 2. `OrderForm.view.tsx` Refactor
The component signature will change to:
```typescript
export const OrderFormView = ({ data, actions }: { data: OrderFormData; actions: OrderFormActions }) => {
    // Destructure for ease of use
    const { form, translations: t } = data;
    // ...
}
```

### 3. `OrderForm.tsx` (Container) Refactor
The container will wrap the hook result into these two objects.

### 4. Component Decomposition (Phase 2)
Once the props are grouped, we can easily extract sub-components:
- `OrderFormHeader` (uses `data.translations`)
- `OrderTypeSelector` (uses `data.form`, `actions.onTypeChange`)
- `OrderInputs` (uses `data`, `actions`)
- `OrderSummary` (uses `data.estimated`, `data.balances`)

## Plan Steps
1. Create `OrderForm.types.ts` and define the interfaces.
2. Update `OrderForm.view.tsx` to accept the new props structure.
3. Update `OrderForm.tsx` to construct and pass the new props.
4. Update `OrderForm.stories.tsx` to reflect the changes.
