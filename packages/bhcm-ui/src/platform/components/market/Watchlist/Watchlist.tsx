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
    selectedSymbol,
    favorites,
    pinned,
    searchQuery,
    showFavoritesOnly,
    getPosition,
    translations,
    inputRef,
    handleSymbolSelect,
    handleSearchChange,
    handleClearSearch,
    handleToggleFavoritesFilter,
    toggleFavorite,
    handleKeyDown,
  } = useWatchlist(onSymbolChange);

  return (
    <WatchlistView
      symbols={symbols}
      selectedSymbol={selectedSymbol}
      favorites={favorites}
      pinned={pinned}
      searchQuery={searchQuery}
      showFavoritesOnly={showFavoritesOnly}
      getPosition={getPosition}
      translations={translations}
      inputRef={inputRef}
      onSymbolSelect={handleSymbolSelect}
      onSearchChange={handleSearchChange}
      onClearSearch={handleClearSearch}
      onToggleFavoritesFilter={handleToggleFavoritesFilter}
      onToggleFavorite={toggleFavorite}
      onKeyDown={handleKeyDown}
      isCollapsed={isCollapsed}
    />
  );
}

export default Watchlist;
