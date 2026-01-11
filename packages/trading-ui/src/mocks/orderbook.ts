/**
 * Mock Order Book Generator
 * 
 * Generates realistic order book data with depth visualization.
 */

import type { OrderBookData, OrderBookLevel } from '../types';
import { getInstrumentBySymbol, INITIAL_PRICES } from './symbols';

/** Order book configuration */
interface OrderBookConfig {
    /** Number of levels on each side */
    levels: number;
    /** Base quantity per level */
    baseQuantity: number;
    /** Quantity variance (0-1) */
    quantityVariance: number;
    /** Price step multiplier */
    priceStepMultiplier: number;
}

/** Default configuration */
const DEFAULT_CONFIG: OrderBookConfig = {
    levels: 15,
    baseQuantity: 10,
    quantityVariance: 0.8,
    priceStepMultiplier: 1,
};

/**
 * Generate random quantity with variance.
 */
function randomQuantity(base: number, variance: number): number {
    const factor = 1 + (Math.random() - 0.5) * 2 * variance;
    return Math.max(0.1, base * factor);
}

/**
 * Generate bid levels for order book.
 */
function generateBidLevels(
    midPrice: number,
    priceStep: number,
    config: OrderBookConfig,
    decimals: number
): OrderBookLevel[] {
    const levels: OrderBookLevel[] = [];
    let cumulative = 0;

    for (let i = 0; i < config.levels; i++) {
        const price = midPrice - priceStep * (i + 1) * config.priceStepMultiplier;
        const quantity = randomQuantity(config.baseQuantity * (1 + i * 0.1), config.quantityVariance);
        cumulative += quantity;

        levels.push({
            price: Number(price.toFixed(decimals)),
            quantity: Number(quantity.toFixed(4)),
            cumulative: Number(cumulative.toFixed(4)),
            total: Number((price * quantity).toFixed(2)),
        });
    }

    return levels;
}

/**
 * Generate ask levels for order book.
 */
function generateAskLevels(
    midPrice: number,
    priceStep: number,
    config: OrderBookConfig,
    decimals: number
): OrderBookLevel[] {
    const levels: OrderBookLevel[] = [];
    let cumulative = 0;

    for (let i = 0; i < config.levels; i++) {
        const price = midPrice + priceStep * (i + 1) * config.priceStepMultiplier;
        const quantity = randomQuantity(config.baseQuantity * (1 + i * 0.1), config.quantityVariance);
        cumulative += quantity;

        levels.push({
            price: Number(price.toFixed(decimals)),
            quantity: Number(quantity.toFixed(4)),
            cumulative: Number(cumulative.toFixed(4)),
            total: Number((price * quantity).toFixed(2)),
        });
    }

    return levels;
}

/**
 * Generate a complete order book for a symbol.
 */
export function generateOrderBook(
    symbol: string,
    config: Partial<OrderBookConfig> = {}
): OrderBookData {
    const fullConfig = { ...DEFAULT_CONFIG, ...config };
    const instrument = getInstrumentBySymbol(symbol);

    // Get base price and calculate spread
    const basePrice = INITIAL_PRICES[symbol] || 100;
    const decimals = instrument?.decimals || 2;

    // Calculate price step based on instrument type
    let priceStep: number;
    if (instrument?.category === 'fx') {
        priceStep = decimals === 5 ? 0.00001 : 0.001;
    } else if (instrument?.category === 'crypto') {
        priceStep = basePrice > 1000 ? 1 : 0.01;
    } else {
        priceStep = 0.01;
    }

    // Calculate spread
    const spreadAmount = instrument?.typicalSpread
        ? instrument.typicalSpread * (instrument.category === 'fx' && decimals === 5 ? 0.0001 : 1)
        : priceStep * 2;

    const midPrice = basePrice;
    const bestBid = midPrice - spreadAmount / 2;
    const bestAsk = midPrice + spreadAmount / 2;

    // Generate levels
    const bids = generateBidLevels(bestBid, priceStep, fullConfig, decimals);
    const asks = generateAskLevels(bestAsk, priceStep, fullConfig, decimals);

    // Add best bid/ask as first levels
    bids.unshift({
        price: Number(bestBid.toFixed(decimals)),
        quantity: randomQuantity(fullConfig.baseQuantity, fullConfig.quantityVariance),
        cumulative: 0,
        total: 0,
    });
    if (bids[0]) {
        bids[0].cumulative = bids[0].quantity;
        bids[0].total = bids[0].price * bids[0].quantity;
    }

    // Recalculate cumulative for bids
    let cumBid = 0;
    for (const level of bids) {
        cumBid += level.quantity;
        level.cumulative = Number(cumBid.toFixed(4));
    }

    asks.unshift({
        price: Number(bestAsk.toFixed(decimals)),
        quantity: randomQuantity(fullConfig.baseQuantity, fullConfig.quantityVariance),
        cumulative: 0,
        total: 0,
    });
    if (asks[0]) {
        asks[0].cumulative = asks[0].quantity;
        asks[0].total = asks[0].price * asks[0].quantity;
    }

    // Recalculate cumulative for asks
    let cumAsk = 0;
    for (const level of asks) {
        cumAsk += level.quantity;
        level.cumulative = Number(cumAsk.toFixed(4));
    }

    return {
        symbol,
        bids,
        asks,
        bestBid: Number(bestBid.toFixed(decimals)),
        bestAsk: Number(bestAsk.toFixed(decimals)),
        spread: Number((bestAsk - bestBid).toFixed(decimals)),
        midPrice: Number(midPrice.toFixed(decimals)),
        timestamp: Date.now(),
    };
}

/**
 * Update order book with small random changes (simulates real-time updates).
 */
export function updateOrderBook(orderBook: OrderBookData): OrderBookData {
    const instrument = getInstrumentBySymbol(orderBook.symbol);
    const decimals = instrument?.decimals || 2;

    // Randomly update some quantities
    const updatedBids = orderBook.bids.map(level => {
        const change = (Math.random() - 0.5) * level.quantity * 0.2;
        const newQuantity = Math.max(0.1, level.quantity + change);
        return {
            ...level,
            quantity: Number(newQuantity.toFixed(4)),
            total: Number((level.price * newQuantity).toFixed(2)),
        };
    });

    const updatedAsks = orderBook.asks.map(level => {
        const change = (Math.random() - 0.5) * level.quantity * 0.2;
        const newQuantity = Math.max(0.1, level.quantity + change);
        return {
            ...level,
            quantity: Number(newQuantity.toFixed(4)),
            total: Number((level.price * newQuantity).toFixed(2)),
        };
    });

    // Recalculate cumulative
    let cumBid = 0;
    for (const level of updatedBids) {
        cumBid += level.quantity;
        level.cumulative = Number(cumBid.toFixed(4));
    }

    let cumAsk = 0;
    for (const level of updatedAsks) {
        cumAsk += level.quantity;
        level.cumulative = Number(cumAsk.toFixed(4));
    }

    return {
        ...orderBook,
        bids: updatedBids,
        asks: updatedAsks,
        timestamp: Date.now(),
    };
}

/**
 * Create an order book stream that updates at a specified interval.
 */
export function createOrderBookStream(
    symbol: string,
    callback: (orderBook: OrderBookData) => void,
    intervalMs: number = 250
): () => void {
    let orderBook = generateOrderBook(symbol);
    callback(orderBook);

    const intervalId = setInterval(() => {
        orderBook = updateOrderBook(orderBook);
        callback(orderBook);
    }, intervalMs);

    return () => clearInterval(intervalId);
}
