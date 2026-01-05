/**
 * Market Data Service Types
 * =========================
 *
 * Re-export all public types for external consumers.
 */

// Collector types
export type {
  NormalizedTick,
  CollectorState,
  CollectorHealth,
  CollectorError,
  CollectorErrorType,
  ICollector,
} from '../domains/collectors/collector.types.js';

// Normalizer types
export type {
  EnrichedTick,
  TickBatch,
} from '../domains/normalizer/normalizer.types.js';

// Cache types
export type {
  CachedPrice,
  PriceSnapshot,
  CacheStats,
} from '../domains/cache/cache.types.js';

// Historical types
export type {
  Candle,
  CandleQuery,
} from '../domains/historical/historical.types.js';

// Stream types
export type {
  ClientSubscription,
  TickMessage,
  SnapshotMessage,
} from '../domains/stream/stream.types.js';

// Health types
export type {
  ServiceHealth,
  Metrics,
} from '../domains/health/health.types.js';

// Config types
export type {
  AssetKind,
  SymbolDefinition,
} from '../config/symbols.js';
