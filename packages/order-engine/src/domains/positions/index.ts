/**
 * Positions Domain Exports
 */

export type {
  Position,
  PositionSide,
  EnginePosition,
  PositionUpdate,
  PositionSnapshot,
  PositionChangeEvent,
  AccountPositionSummary,
} from './position.types.js';

export { PositionManager } from './position-manager.js';

export {
  upsertPosition,
  getPosition,
  getAccountPositions,
  getAllOpenPositions,
  getPositionHistory,
  savePositionHistory,
} from './position-repository.js';

export {
  createPositionEmailHandler,
  type UserResolver,
  type PositionResolver,
  type TradeHistoryResolver,
  type EmailClient as PositionEmailClient,
  type PositionEmailHandlerConfig,
  type TradeOpenedPayload,
  type TradeClosedPayload,
} from './position.emails.js';
