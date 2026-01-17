/**
 * UUID Generation Utility
 * Provides a cross-environment UUID generator that works in both
 * secure (HTTPS/localhost) and non-secure (HTTP) contexts.
 */

/**
 * Generates a UUID v4 string.
 * Uses crypto.randomUUID() in secure contexts, falls back to Math.random() otherwise.
 */
export const generateUUID = (): string => {
	if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
		return crypto.randomUUID();
	}
	// Fallback using Math.random() for non-secure contexts
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
		const r = (Math.random() * 16) | 0;
		const v = c === 'x' ? r : (r & 0x3) | 0x8;
		return v.toString(16);
	});
};
