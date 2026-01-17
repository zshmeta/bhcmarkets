# Watchlist Improvements Design

## Context
The current Watchlist uses a simple dropdown/list to navigate assets, which is impractical for a large number of assets (full list in `packages/market-data`). The user finds it difficult to navigate.

## Objective
Improve the asset navigation experience within the Watchlist component, making it easier to find and manage assets.

## Proposed Approaches

### 1. Grouped Virtualized List with Quick Filters
-   **Concept**: Keep the list but make it highly performant (virtualized) and add "Quick Filters" (e.g., "Defi", "L1", "Gaming") at the top.
-   **Pros**: Fast, familiar mobile-like UX.
-   **Cons**: Still a long list if filters aren't good.

### 2. Asset Explorer Modal (Recommended)
-   **Concept**: Instead of trying to fit everything into the side panel, clicking "Add Symbol" opens a dedicated Modal.
-   **Modal Features**:
    -   **Tabs/Categories**: "Spot", "Futures", "Favorites", "Top Gainers".
    -   **Search**: robust fuzzy search.
    -   **Grid/Table View**: More data (volume, 24h change) to help decision-making.
-   **Pros**: Best for discovery, uses full screen real estate.
-   **Cons**: Adds a modal step (but worth it for "adding" workflows).

### 3. Tree/Hierarchy View (Current direction but needs polish)
-   **Concept**: The current code *tries* to do categories (`CategorySection`), but maybe the UX is clunky.
-   **Improvement**: Make categories collapsible accordions that are *closed* by default, or use a "Miller Columns" (macOS Finder style) approach.

## Recommendation: Approach 2 (Asset Explorer Modal) + Polish Approach 1 (Quick Filters)
For the *main* watchlist view, we should keep it tight (favorites only or active list). For *finding* assets, we should use a modal.

However, since the user specifically mentioned the "dropdown" being impractical, they might be referring to a specific "Select Asset" interaction.

Let's stick to improving the **existing side panel** first before building a huge modal, as it's lower friction.

### Redesigning the Side Panel Navigation
1.  **Tabs**: The current "Watchlists | All Symbols" tabs are good, but "All Symbols" is likely overwhelming.
2.  **Asset Class Chips**: Add horizontal scrollable chips below the search bar: [All] [Favorites] [Crypto] [Forex] [Stocks].
3.  **Keyboard Navigation**: Ensure Up/Down arrows work perfectly (seems implemented but maybe buggy?).
4.  **Virtualized List**: If the list has >100 items, we *must* use `react-window` or `react-virtualized` to ensure smooth scrolling.

## Design for this session
I will focus on **better filtering and organization** within the existing component to avoid massive structural changes unless necessary.

1.  **Filter Chips**: Add a row of filter chips.
2.  **Virtualization**: Check if `FilteredCategories` is too heavy.
3.  **Sticky Headers**: Keep category headers visible while scrolling.

Let's start by clarifying with the user if they want a **Modal** (better for discovery) or just a **Better List** (better for speed).
