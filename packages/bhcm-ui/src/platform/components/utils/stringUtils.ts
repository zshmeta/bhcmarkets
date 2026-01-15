/* ═══════════════════════════════════════════════════════════
 * STRING UTILITIES
 * ═══════════════════════════════════════════════════════════
 * Common string manipulation functions.
 */

/**
 * Truncate a crypto address showing first and last characters.
 * @param address - Full address string
 * @param startChars - Characters to show at start (default: 8)
 * @param endChars - Characters to show at end (default: 6)
 */
export const truncateAddress = (
    address: string,
    startChars: number = 8,
    endChars: number = 6
): string => {
    if (!address) return '';
    if (address.length <= startChars + endChars + 3) return address;
    return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
};

/**
 * Truncate text with ellipsis at end.
 * @param text - Input text
 * @param maxLength - Maximum length before truncation
 */
export const truncateText = (text: string, maxLength: number): string => {
    if (!text || text.length <= maxLength) return text;
    return `${text.slice(0, maxLength)}...`;
};
