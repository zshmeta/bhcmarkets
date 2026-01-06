/**
 * Fee Calculator
 * ==============
 *
 * Calculates trading fees based on maker/taker model.
 *
 * FEE STRUCTURE:
 * - Maker fee: Lower fee for providing liquidity
 * - Taker fee: Higher fee for taking liquidity
 * - Volume discounts: Reduced fees for high volume traders
 * - VIP tiers: Special rates for VIP accounts
 */

import type { FeeCalculation } from './trade.types.js';
import { logger } from '../../utils/logger.js';

const log = logger.child({ component: 'fee-calculator' });

// Default fee rates (in basis points, 1 bp = 0.01%)
const DEFAULT_MAKER_FEE_BPS = 10; // 0.10%
const DEFAULT_TAKER_FEE_BPS = 20; // 0.20%

/**
 * Fee tier based on 30-day trading volume.
 */
export interface FeeTier {
  minVolume: number;
  makerFeeBps: number;
  takerFeeBps: number;
}

/**
 * Default fee tiers.
 */
const DEFAULT_FEE_TIERS: FeeTier[] = [
  { minVolume: 0, makerFeeBps: 10, takerFeeBps: 20 },           // Tier 0: 0.10% / 0.20%
  { minVolume: 100_000, makerFeeBps: 8, takerFeeBps: 16 },      // Tier 1: 0.08% / 0.16%
  { minVolume: 500_000, makerFeeBps: 6, takerFeeBps: 12 },      // Tier 2: 0.06% / 0.12%
  { minVolume: 1_000_000, makerFeeBps: 4, takerFeeBps: 10 },    // Tier 3: 0.04% / 0.10%
  { minVolume: 5_000_000, makerFeeBps: 2, takerFeeBps: 8 },     // Tier 4: 0.02% / 0.08%
  { minVolume: 10_000_000, makerFeeBps: 0, takerFeeBps: 6 },    // Tier 5: 0.00% / 0.06%
];

export interface FeeOverride {
  accountId: string;
  makerFeeBps: number;
  takerFeeBps: number;
  expiresAt?: Date;
}

export class FeeCalculator {
  private feeTiers: FeeTier[];
  private accountVolumes: Map<string, number> = new Map(); // 30-day volume cache
  private feeOverrides: Map<string, FeeOverride> = new Map();

  constructor(feeTiers?: FeeTier[]) {
    this.feeTiers = feeTiers ?? DEFAULT_FEE_TIERS;
    // Sort tiers by volume descending for lookup
    this.feeTiers.sort((a, b) => b.minVolume - a.minVolume);
  }

  // ===========================================================================
  // FEE CALCULATION
  // ===========================================================================

  /**
   * Calculate fees for a trade.
   */
  calculateFees(
    makerAccountId: string,
    takerAccountId: string,
    tradeValue: number
  ): FeeCalculation {
    // Check for overrides first
    const makerOverride = this.getOverride(makerAccountId);
    const takerOverride = this.getOverride(takerAccountId);

    let makerFeeBps: number;
    let takerFeeBps: number;

    if (makerOverride) {
      makerFeeBps = makerOverride.makerFeeBps;
    } else {
      const makerVolume = this.accountVolumes.get(makerAccountId) ?? 0;
      makerFeeBps = this.getTierFees(makerVolume).makerFeeBps;
    }

    if (takerOverride) {
      takerFeeBps = takerOverride.takerFeeBps;
    } else {
      const takerVolume = this.accountVolumes.get(takerAccountId) ?? 0;
      takerFeeBps = this.getTierFees(takerVolume).takerFeeBps;
    }

    const makerFee = (tradeValue * makerFeeBps) / 10000;
    const takerFee = (tradeValue * takerFeeBps) / 10000;

    return {
      makerFee,
      takerFee,
      makerFeeRate: makerFeeBps / 10000,
      takerFeeRate: takerFeeBps / 10000,
    };
  }

  /**
   * Get fee rates for display.
   */
  getFeeRates(accountId: string): { makerRate: number; takerRate: number; tier: number } {
    const override = this.getOverride(accountId);

    if (override) {
      return {
        makerRate: override.makerFeeBps / 10000,
        takerRate: override.takerFeeBps / 10000,
        tier: -1, // Custom tier
      };
    }

    const volume = this.accountVolumes.get(accountId) ?? 0;
    const { makerFeeBps, takerFeeBps, tier } = this.getTierFeesWithTier(volume);

    return {
      makerRate: makerFeeBps / 10000,
      takerRate: takerFeeBps / 10000,
      tier,
    };
  }

  // ===========================================================================
  // VOLUME TRACKING
  // ===========================================================================

  /**
   * Update account's 30-day trading volume.
   */
  updateVolume(accountId: string, tradeValue: number): void {
    const current = this.accountVolumes.get(accountId) ?? 0;
    this.accountVolumes.set(accountId, current + tradeValue);
  }

  /**
   * Set account's 30-day volume (for initialization from DB).
   */
  setVolume(accountId: string, volume: number): void {
    this.accountVolumes.set(accountId, volume);
  }

  /**
   * Get account's current volume.
   */
  getVolume(accountId: string): number {
    return this.accountVolumes.get(accountId) ?? 0;
  }

  /**
   * Reset volumes (for testing or daily reset).
   */
  resetVolumes(): void {
    this.accountVolumes.clear();
  }

  // ===========================================================================
  // FEE OVERRIDES
  // ===========================================================================

  /**
   * Set custom fee rates for an account.
   */
  setFeeOverride(override: FeeOverride): void {
    this.feeOverrides.set(override.accountId, override);
    log.info({ override }, 'Fee override set');
  }

  /**
   * Remove fee override.
   */
  removeFeeOverride(accountId: string): boolean {
    const removed = this.feeOverrides.delete(accountId);
    if (removed) {
      log.info({ accountId }, 'Fee override removed');
    }
    return removed;
  }

  /**
   * Get fee override if valid.
   */
  private getOverride(accountId: string): FeeOverride | null {
    const override = this.feeOverrides.get(accountId);

    if (!override) return null;

    // Check expiration
    if (override.expiresAt && override.expiresAt < new Date()) {
      this.feeOverrides.delete(accountId);
      return null;
    }

    return override;
  }

  // ===========================================================================
  // TIER LOOKUP
  // ===========================================================================

  /**
   * Get fee tier for volume.
   */
  private getTierFees(volume: number): { makerFeeBps: number; takerFeeBps: number } {
    for (const tier of this.feeTiers) {
      if (volume >= tier.minVolume) {
        return { makerFeeBps: tier.makerFeeBps, takerFeeBps: tier.takerFeeBps };
      }
    }

    // Default to highest fees
    return { makerFeeBps: DEFAULT_MAKER_FEE_BPS, takerFeeBps: DEFAULT_TAKER_FEE_BPS };
  }

  /**
   * Get fee tier with tier number.
   */
  private getTierFeesWithTier(volume: number): {
    makerFeeBps: number;
    takerFeeBps: number;
    tier: number;
  } {
    for (let i = 0; i < this.feeTiers.length; i++) {
      const tier = this.feeTiers[i]!;
      if (volume >= tier.minVolume) {
        return {
          makerFeeBps: tier.makerFeeBps,
          takerFeeBps: tier.takerFeeBps,
          tier: this.feeTiers.length - 1 - i, // Reverse index for tier number
        };
      }
    }

    return {
      makerFeeBps: DEFAULT_MAKER_FEE_BPS,
      takerFeeBps: DEFAULT_TAKER_FEE_BPS,
      tier: 0,
    };
  }

  /**
   * Get all fee tiers.
   */
  getFeeTiers(): FeeTier[] {
    return [...this.feeTiers].sort((a, b) => a.minVolume - b.minVolume);
  }
}
