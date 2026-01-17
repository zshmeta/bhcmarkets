#!/usr/bin/env tsx
/**
 * Historical Data Backfill Script
 * ================================
 * 
 * Run this separately from the main server to backfill historical data.
 * 
 * Usage:
 *   bun run backfill           # Backfill all symbols
 *   bun run backfill crypto    # Backfill only crypto
 *   bun run backfill forex     # Backfill only forex
 */

import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { getDbClient, closeDb } from '@repo/database';
import { HistoricalService } from './domains/historical/historical.service.js';
import { ALL_SYMBOLS, CRYPTO_SYMBOLS, FOREX_SYMBOLS, STOCK_SYMBOLS, INDEX_SYMBOLS, COMMODITY_SYMBOLS } from './config/symbols.js';

const log = logger.child({ component: 'backfill-script' });

async function main() {
    const arg = process.argv[2] || 'all';

    log.info({ arg }, '📊 Starting historical backfill...');

    // Initialize database
    log.info('Connecting to database...');
    await getDbClient({ connectionString: env.DATABASE_URL });

    // Initialize historical service
    const historicalService = new HistoricalService();
    await historicalService.initialize();

    // Select symbols based on argument
    let symbols: string[];
    switch (arg.toLowerCase()) {
        case 'crypto':
            symbols = CRYPTO_SYMBOLS.map(s => s.symbol);
            break;
        case 'forex':
            symbols = FOREX_SYMBOLS.map(s => s.symbol);
            break;
        case 'stocks':
            symbols = STOCK_SYMBOLS.map(s => s.symbol);
            break;
        case 'indices':
            symbols = INDEX_SYMBOLS.map(s => s.symbol);
            break;
        case 'commodities':
            symbols = COMMODITY_SYMBOLS.map(s => s.symbol);
            break;
        case 'all':
        default:
            symbols = ALL_SYMBOLS.map(s => s.symbol);
    }

    log.info({ count: symbols.length, category: arg }, 'Backfilling symbols...');

    // Run backfill with small batch size to avoid rate limits
    const results = await historicalService.backfillSymbols(symbols, 10);

    // Summary
    let totalCandles = 0;
    results.forEach((count, symbol) => {
        if (count > 0) {
            totalCandles += count;
            log.info({ symbol, count }, 'Backfilled');
        }
    });

    log.info({ totalCandles, symbols: symbols.length }, '✅ Backfill complete!');

    // Cleanup
    await closeDb();
    process.exit(0);
}

main().catch((error) => {
    log.error({ error }, '❌ Backfill failed');
    process.exit(1);
});
