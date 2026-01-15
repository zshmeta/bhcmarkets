/* ═══════════════════════════════════════════════════════════
 * WATCHLIST - PUBLIC API
 * ═══════════════════════════════════════════════════════════
 */

// Smart container (default)
export { Watchlist } from './Watchlist';

// Dumb presentational component
export { WatchlistView } from './Watchlist.view';
export type { WatchlistViewProps } from './Watchlist.view';

// Business logic hook
export { useWatchlist } from './useWatchlist';
export type { UseWatchlistReturn, WatchlistPosition, WatchlistTranslations } from './useWatchlist';
