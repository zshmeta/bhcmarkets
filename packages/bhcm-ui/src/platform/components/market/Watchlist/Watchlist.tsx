import { useWatchlist } from './useWatchlist';
import { WatchlistView } from './Watchlist.view';

/* ═══════════════════════════════════════════════════════════
 * WATCHLIST CONTAINER
 * ═══════════════════════════════════════════════════════════
 * Smart component connecting store via useWatchlist hook
 * to the pure WatchlistView presentational component.
 */

interface WatchlistProps {
  onSymbolChange?: (symbol: string) => void;
  isCollapsed?: boolean;
  compact?: boolean;
}

const Watchlist = ({ onSymbolChange, isCollapsed = false, compact: _compact = false }: WatchlistProps) => {
  const {
    symbols,
    categories,
    selectedSymbol,
    favorites,
    pinned,
    searchQuery,
    showFavoritesOnly,
    activeFilter,
    expandedCategories,
    activeTab,
    getPosition,
    translations,
    inputRef,
    handleSymbolSelect,
    handleSearchChange,
    handleClearSearch,
    handleToggleFavoritesFilter,
    handleFilterChange,
    toggleFavorite,
    handleToggleCategory,
    handleTabChange,
    handleKeyDown,
  } = useWatchlist(onSymbolChange);

  return (
    <WatchlistView
      symbols={symbols}
      categories={categories}
      selectedSymbol={selectedSymbol}
      favorites={favorites}
      searchQuery={searchQuery}
      expandedCategories={expandedCategories}
      activeTab={activeTab}
      activeFilter={activeFilter}
      getPosition={getPosition}
      translations={translations}
      inputRef={inputRef}
      onSymbolSelect={handleSymbolSelect}
      onSearchChange={handleSearchChange}
      onClearSearch={handleClearSearch}
      onToggleFavorite={toggleFavorite}
      onToggleCategory={handleToggleCategory}
      onTabChange={handleTabChange}
      onFilterChange={handleFilterChange}
      onKeyDown={handleKeyDown}
      isCollapsed={isCollapsed}
    />
  );
}

export { Watchlist };
