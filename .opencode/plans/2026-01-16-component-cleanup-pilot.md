# Component Cleanup Plan: `RiskBanner` Refactor

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Consolidate the fragmented file structure of the `RiskBanner` component into a single, cohesive file. This will serve as a pilot for cleaning up the rest of the UI codebase.

**Current State (6 files):**
- `RiskBanner.tsx` (Container)
- `RiskBanner.view.tsx` (Presentational)
- `useRiskBanner.ts` (Logic Hook)
- `RiskBanner.styles.ts`
- `RiskBanner.stories.tsx`
- `index.ts`

**Target State (3 files):**
- `RiskBanner.tsx` (Contains Logic + View)
    - Export `RiskBanner` (Default, Smart)
    - Export `RiskBannerView` (Named, Dumb - for Storybook)
- `RiskBanner.styles.ts` (Styles)
- `RiskBanner.stories.tsx` (Documentation)
- *Note: `index.ts` will be removed.*

**Strategy:** Co-locate the "View" and "Container" in the same file to reduce sprawl while maintaining testability.

---

### Task 1: Consolidate Logic and View

**Files:**
- Modify: `packages/bhcm-ui/src/platform/components/account/RiskBanner/RiskBanner.tsx`
- Modify: `packages/bhcm-ui/src/platform/components/account/RiskBanner/RiskBanner.stories.tsx`
- Delete: `packages/bhcm-ui/src/platform/components/account/RiskBanner/RiskBanner.view.tsx`
- Delete: `packages/bhcm-ui/src/platform/components/account/RiskBanner/useRiskBanner.ts`
- Delete: `packages/bhcm-ui/src/platform/components/account/RiskBanner/index.ts`

**Step 1: Create `RiskBannerView` in `RiskBanner.tsx`**
- Copy the `RiskBannerView` component code (and `RiskBannerViewProps` interface) from `RiskBanner.view.tsx` into `RiskBanner.tsx`.
- Ensure it is a named export: `export const RiskBannerView = ...`

**Step 2: Migrate Logic**
- Copy all logic from `useRiskBanner.ts` into the main `RiskBanner` component in `RiskBanner.tsx`.
- Remove the `useRiskBanner` hook call.
- Pass the calculated data to the local `RiskBannerView` component.

**Step 3: Update Storybook**
- Update `RiskBanner.stories.tsx` to import `{ RiskBannerView }` from `./RiskBanner` instead of the deleted file.

**Step 4: Cleanup**
- Delete `RiskBanner.view.tsx`, `useRiskBanner.ts`, and `index.ts`.
