// Small, local validation helpers.
// We keep these minimal to avoid duplicating backend policy.

export function isLikelyEmail(value: string): boolean {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function isAcceptablePassword(value: string): boolean {
	// Frontend validation is UX only; backend remains the source of truth.
	// Backend default policy is stricter (currently 12+), so we mirror the baseline.
	return value.length >= 12;
}
