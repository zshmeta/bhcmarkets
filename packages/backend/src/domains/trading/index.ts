/**
 * Trading Domain - Barrel Export
 *
 * Provides user-facing trading routes for orders and positions.
 */

export { registerTradingRoutes, type TradingRouteDependencies } from "./routes/trading.routes.js";
export { TradingService } from "./core/trading.service.js";
import { TradingService } from "./core/trading.service.js";
import { HttpEngineClient } from "./core/engine.client.js";
import { AccountServiceInterface } from "@repo/sdk";

export interface TradingServiceDependencies {
  accountService: AccountServiceInterface;
  engineBaseUrl: string;
}

export function createTradingService(deps: TradingServiceDependencies): TradingService {
  const engineClient = new HttpEngineClient(deps.engineBaseUrl);
  return new TradingService(deps.accountService, engineClient);
}
