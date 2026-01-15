/**
 * VisuallyHidden Component
 *
 * Hides content visually but keeps it accessible to screen readers.
 * Essential for accessibility (e.g., skip links, icon button labels).
 */

import styled from "styled-components";

export const VisuallyHidden = styled.span`
	position: absolute;
	width: 1px;
	height: 1px;
	padding: 0;
	margin: -1px;
	overflow: hidden;
	clip: rect(0, 0, 0, 0);
	white-space: nowrap;
	border: 0;
`;

/**
 * Skip Link Component
 *
 * Allows keyboard users to skip navigation and go directly to main content.
 */
export const SkipLink = styled.a`
	position: absolute;
	top: -40px;
	left: 0;
	padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md}`};
	background: ${({ theme }) => theme.colors.primary};
	color: ${({ theme }) => theme.colors.text.onAccent};
	font-family: ${({ theme }) => theme.typography.fontFamily};
	font-weight: ${({ theme }) => theme.typography.weightMedium};
	z-index: ${({ theme }) => theme.zIndices.toast};
	border-radius: ${({ theme }) => theme.radii.md};
	text-decoration: none;
	transition: top 0.2s ease;

	&:focus {
		top: ${({ theme }) => theme.spacing.sm};
		left: ${({ theme }) => theme.spacing.sm};
		outline: 2px solid ${({ theme }) => theme.colors.primary};
		outline-offset: 2px;
	}
`;

/**
 * FocusTrap utility hook
 *
 * Traps focus within a container (for modals, dialogs, etc.)
 */
export function useFocusTrap(
	containerRef: React.RefObject<HTMLElement>,
	isActive: boolean = true
) {
	const focusableSelectors = [
		'a[href]',
		'button:not([disabled])',
		'input:not([disabled])',
		'select:not([disabled])',
		'textarea:not([disabled])',
		'[tabindex]:not([tabindex="-1"])',
	].join(', ');

	const handleKeyDown = (e: KeyboardEvent) => {
		if (!isActive || e.key !== 'Tab' || !containerRef.current) return;

		const focusableElements = containerRef.current.querySelectorAll(focusableSelectors);
		const firstElement = focusableElements[0] as HTMLElement;
		const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

		if (e.shiftKey && document.activeElement === firstElement) {
			e.preventDefault();
			lastElement?.focus();
		} else if (!e.shiftKey && document.activeElement === lastElement) {
			e.preventDefault();
			firstElement?.focus();
		}
	};

	// Note: Caller should use useEffect to add/remove event listener
	return { handleKeyDown, focusableSelectors };
}

export default VisuallyHidden;
