
/**
 * Fee Schedule
 * ============
 * Simple utility to get fee rates.
 * In a real system, this would likely query the FeeCalculator or DB.
 */

export const getFeeRate = (tier: string = 'standard', role: 'maker' | 'taker'): number => {
  // Simple hardcoded schedule matching FeeCalculator defaults for now
  // standard: 0.10% maker, 0.20% taker
  if (role === 'maker') return 0.0010;
  return 0.0020;
};
