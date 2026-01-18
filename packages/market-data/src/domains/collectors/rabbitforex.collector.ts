/**
 * RabbitForex Collector
 * =====================
 *
 * Uses a self-hosted RabbitForexAPI instance for:
 * - Forex rates (USD-based table)
 * - Metals rates (USD-based table)
 *
 * Notes:
 * - These endpoints are snapshots; we treat timestamp defensively to avoid
 *   dropping ticks due to strict validator windows.
 * - Energy commodities (WTI/BRENT/NATGAS) are not provided by Rabbit and are
 *   handled elsewhere (yfinance-service).
 */

import { BaseCollector } from './base.collector.js';
import {
  COMMODITY_SYMBOLS,
  FOREX_SYMBOLS,
  getSymbolDef,
  type AssetKind,
  type SymbolDefinition,
} from '../../config/symbols.js';
import { env } from '../../config/env.js';
import type { CollectorConfig, NormalizedTick } from '@repo/sdk';

type RabbitRatesResponse = {
  base?: string;
  rates?: Record<string, number>;
  timestamps?: Record<string, string | undefined>;
};

const FOREX_SYMBOL_SET = new Set(FOREX_SYMBOLS.map(s => s.symbol));

const METAL_SYMBOLS: SymbolDefinition[] = COMMODITY_SYMBOLS.filter(
  s => s.base === 'XAU' || s.base === 'XAG'
);

const METAL_SYMBOL_SET = new Set(METAL_SYMBOLS.map(s => s.symbol));

const METAL_BASE_TO_RABBIT = new Map<string, string>([
  ['XAU', 'GOLD'],
  ['XAG', 'SILVER'],
]);

function createAbortSignal(timeoutMs: number): AbortSignal {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (timeout as any).unref?.();
  return controller.signal;
}

function parseTimestamp(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return undefined;
}

function safeTickTimestamp(providerTs: number | undefined): number {
  const now = Date.now();
  if (!providerTs) return now;

  // Keep it within validator bounds (5m old, 30s future) with a little cushion.
  const maxFutureMs = 25_000;
  const maxAgeMs = 4 * 60_000;

  if (providerTs > now + maxFutureMs) return now;
  if (providerTs < now - maxAgeMs) return now;
  return providerTs;
}

export class RabbitForexCollector extends BaseCollector {
  readonly name = 'rabbitforex';
  readonly supportedKinds: AssetKind[] = ['forex', 'commodity'];

  private pollTimer: NodeJS.Timeout | null = null;
  private polledSymbols = new Set<string>();

  private cooldownUntilMs = 0;

  private pollQueue: Promise<void> = Promise.resolve();
  private pollInFlight = false;
  private pendingPollSymbols: string[] | null = null;

  constructor(config?: CollectorConfig) {
    super(config);
  }

  protected async doConnect(): Promise<void> {
    this.log.info({ baseUrl: env.RABBITFOREX_BASE_URL }, 'Verifying RabbitForexAPI accessibility...');

    const fxOk = await this.tryFetchRates();
    const metalsOk = await this.tryFetchMetals();

    if (!fxOk && !metalsOk) {
      throw new Error('RabbitForexAPI rates endpoints are unreachable');
    }

    this.log.info({ fxOk, metalsOk }, 'Upstream connectivity verified');
  }

  protected async doDisconnect(): Promise<void> {
    this.stopPolling();
    this.polledSymbols.clear();
  }

  protected async doSubscribe(symbols: string[]): Promise<void> {
    symbols.forEach(s => this.polledSymbols.add(s));

    if (!this.pollTimer) {
      this.startPolling();
    }

    await this.queuePoll(symbols);
  }

  protected async doUnsubscribe(symbols: string[]): Promise<void> {
    symbols.forEach(s => this.polledSymbols.delete(s));

    if (this.polledSymbols.size === 0) {
      this.stopPolling();
    }
  }

  private startPolling(): void {
    if (this.pollTimer) return;

    this.log.info({ intervalMs: env.RABBITFOREX_POLL_INTERVAL_MS }, 'Starting poll loop');

    this.pollTimer = setInterval(() => {
      if (this.polledSymbols.size === 0) return;
      void this.queuePoll(Array.from(this.polledSymbols));
    }, env.RABBITFOREX_POLL_INTERVAL_MS);
  }

  private stopPolling(): void {
    if (!this.pollTimer) return;
    clearInterval(this.pollTimer);
    this.pollTimer = null;
    this.log.info('Stopped poll loop');
  }

  private queuePoll(internalSymbols: string[]): Promise<void> {
    this.pendingPollSymbols = internalSymbols;

    if (this.pollInFlight) return this.pollQueue;

    this.pollInFlight = true;
    this.pollQueue = (async () => {
      while (this.pendingPollSymbols) {
        const symbols = this.pendingPollSymbols;
        this.pendingPollSymbols = null;
        try {
          await this.pollSymbols(symbols);
        } catch {
          // pollSymbols is defensive.
        }
      }
    })().finally(() => {
      this.pollInFlight = false;
    });

    return this.pollQueue;
  }

  private async pollSymbols(internalSymbols: string[]): Promise<void> {
    const now = Date.now();
    if (now < this.cooldownUntilMs) {
      this.log.warn({ cooldownMs: this.cooldownUntilMs - now }, 'In cooldown; skipping poll');
      return;
    }

    const forexSymbols = internalSymbols.filter(s => FOREX_SYMBOL_SET.has(s));
    const metalSymbols = internalSymbols.filter(s => METAL_SYMBOL_SET.has(s));

    // 1) FX rates table
    if (forexSymbols.length > 0) {
      try {
        await this.pollForexRates(forexSymbols);
      } catch (error) {
        this.log.error({ error }, 'Forex poll failed');
      }
    }

    // 2) Metals rates table
    if (metalSymbols.length > 0) {
      try {
        await this.pollMetalRates(metalSymbols);
      } catch (error) {
        this.log.error({ error }, 'Metals poll failed');
      }
    }
  }

  private async pollForexRates(internalSymbols: string[]): Promise<void> {
    const { rates, timestamp } = await this.fetchRates();

    const USDoUsd = rates.USD ?? 1;
    const ts = safeTickTimestamp(timestamp);

    for (const symbol of internalSymbols) {
      const def = getSymbolDef(symbol);
      if (!def) continue;

      const USDoBase = def.base === 'USD' ? USDoUsd : rates[def.base];
      const USDoQuote = def.quote === 'USD' ? USDoUsd : rates[def.quote];

      if (!USDoBase || !USDoQuote) {
        this.log.debug({ symbol, base: def.base, quote: def.quote }, 'Missing Rabbit FX rate for currency');
        continue;
      }

      const last = USDoQuote / USDoBase;

      const tick: NormalizedTick = {
        symbol,
        last,
        timestamp: ts,
        source: this.name,
      };

      this.emitTick(tick);
    }
  }

  private async pollMetalRates(internalSymbols: string[]): Promise<void> {
    const { rates, timestamp } = await this.fetchMetals();

    const USDoUsd = rates.USD ?? 1;
    const ts = safeTickTimestamp(timestamp);

    for (const symbol of internalSymbols) {
      const def = getSymbolDef(symbol);
      if (!def) continue;

      const USDoBase = def.base === 'USD' ? USDoUsd : rates[def.base];
      const USDoQuote = def.quote === 'USD' ? USDoUsd : rates[def.quote];

      if (!USDoBase || !USDoQuote) {
        this.log.debug({ symbol, base: def.base, quote: def.quote }, 'Missing Rabbit metals rate');
        continue;
      }

      const last = USDoQuote / USDoBase;

      const tick: NormalizedTick = {
        symbol,
        last,
        timestamp: ts,
        source: this.name,
      };

      this.emitTick(tick);
    }
  }

  private async tryFetchRates(): Promise<boolean> {
    try {
      await this.fetchRates();
      return true;
    } catch {
      return false;
    }
  }

  private async tryFetchMetals(): Promise<boolean> {
    try {
      await this.fetchMetals();
      return true;
    } catch {
      return false;
    }
  }

  private async fetchRates(): Promise<{ rates: Record<string, number>; timestamp?: number }> {
    const url = new URL('/v1/rates', env.RABBITFOREX_BASE_URL);

    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: { accept: 'application/json' },
      signal: createAbortSignal(8000),
    });

    if (res.status === 429) {
      this.cooldownUntilMs = Date.now() + this.config.rateLimitBackoffMs;
      this.emitError({
        type: 'rate_limited',
        message: 'RabbitForexAPI rate limited (HTTP 429)',
        source: this.name,
        timestamp: Date.now(),
        retryable: true,
      });
      throw new Error('RabbitForexAPI rate limited (HTTP 429)');
    }

    if (!res.ok) {
      throw new Error(`RabbitForexAPI error (HTTP ${res.status})`);
    }

    const data = (await res.json()) as RabbitRatesResponse;
    const rates = data.rates;
    if (!rates || typeof rates !== 'object') {
      throw new Error('RabbitForexAPI /v1/rates returned invalid payload');
    }

    const ts = parseTimestamp(data.timestamps?.currency);

    return { rates, timestamp: ts };
  }

  private async fetchMetals(): Promise<{ rates: Record<string, number>; timestamp?: number }> {
    const url = new URL('/v1/metals/rates', env.RABBITFOREX_BASE_URL);

    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: { accept: 'application/json' },
      signal: createAbortSignal(8000),
    });

    if (res.status === 429) {
      this.cooldownUntilMs = Date.now() + this.config.rateLimitBackoffMs;
      this.emitError({
        type: 'rate_limited',
        message: 'RabbitForexAPI metals rate limited (HTTP 429)',
        source: this.name,
        timestamp: Date.now(),
        retryable: true,
      });
      throw new Error('RabbitForexAPI metals rate limited (HTTP 429)');
    }

    if (!res.ok) {
      throw new Error(`RabbitForexAPI metals error (HTTP ${res.status})`);
    }

    const data = (await res.json()) as RabbitRatesResponse;
    const rawRates = data.rates;
    if (!rawRates || typeof rawRates !== 'object') {
      throw new Error('RabbitForexAPI /v1/metals/rates returned invalid payload');
    }

    const rates: Record<string, number> = { USD: 1 };

    for (const [internalBase, rabbitSymbol] of METAL_BASE_TO_RABBIT.entries()) {
      const v = rawRates[rabbitSymbol];
      if (typeof v === 'number' && Number.isFinite(v)) {
        rates[internalBase] = v;
      }
    }

    const ts = parseTimestamp(data.timestamps?.metal) ?? parseTimestamp(data.timestamps?.currency);

    return { rates, timestamp: ts };
  }
}
