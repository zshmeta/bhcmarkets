/**
 * Animation Utilities
 *
 * Consistent enter/exit animations for the design system.
 * Can be composed with styled-components or used directly.
 */

import { keyframes, css } from "styled-components";

// ---------------------------------------------------------------------------
// Keyframes Library
// ---------------------------------------------------------------------------

export const animations = {
	// Fade
	fadeIn: keyframes`
		from { opacity: 0; }
		to { opacity: 1; }
	`,
	fadeOut: keyframes`
		from { opacity: 1; }
		to { opacity: 0; }
	`,

	// Scale
	scaleIn: keyframes`
		from {
			opacity: 0;
			transform: scale(0.95);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	`,
	scaleOut: keyframes`
		from {
			opacity: 1;
			transform: scale(1);
		}
		to {
			opacity: 0;
			transform: scale(0.95);
		}
	`,

	// Slide
	slideInUp: keyframes`
		from {
			opacity: 0;
			transform: translateY(16px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	`,
	slideOutUp: keyframes`
		from {
			opacity: 1;
			transform: translateY(0);
		}
		to {
			opacity: 0;
			transform: translateY(-16px);
		}
	`,
	slideInDown: keyframes`
		from {
			opacity: 0;
			transform: translateY(-16px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	`,
	slideOutDown: keyframes`
		from {
			opacity: 1;
			transform: translateY(0);
		}
		to {
			opacity: 0;
			transform: translateY(16px);
		}
	`,
	slideInLeft: keyframes`
		from {
			opacity: 0;
			transform: translateX(-100%);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	`,
	slideOutLeft: keyframes`
		from {
			opacity: 1;
			transform: translateX(0);
		}
		to {
			opacity: 0;
			transform: translateX(-100%);
		}
	`,
	slideInRight: keyframes`
		from {
			opacity: 0;
			transform: translateX(100%);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	`,
	slideOutRight: keyframes`
		from {
			opacity: 1;
			transform: translateX(0);
		}
		to {
			opacity: 0;
			transform: translateX(100%);
		}
	`,

	// Bounce
	bounceIn: keyframes`
		0% {
			opacity: 0;
			transform: scale(0.3);
		}
		50% {
			opacity: 1;
			transform: scale(1.05);
		}
		70% {
			transform: scale(0.9);
		}
		100% {
			transform: scale(1);
		}
	`,

	// Shake (for errors)
	shake: keyframes`
		0%, 100% { transform: translateX(0); }
		10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
		20%, 40%, 60%, 80% { transform: translateX(4px); }
	`,

	// Pulse (for attention)
	pulse: keyframes`
		0%, 100% {
			opacity: 1;
			transform: scale(1);
		}
		50% {
			opacity: 0.8;
			transform: scale(1.05);
		}
	`,

	// Spin
	spin: keyframes`
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	`,

	// Shimmer (for skeletons)
	shimmer: keyframes`
		0% { background-position: -200% 0; }
		100% { background-position: 200% 0; }
	`,

	// Expand
	expandHeight: keyframes`
		from {
			opacity: 0;
			max-height: 0;
		}
		to {
			opacity: 1;
			max-height: 500px;
		}
	`,
	collapseHeight: keyframes`
		from {
			opacity: 1;
			max-height: 500px;
		}
		to {
			opacity: 0;
			max-height: 0;
		}
	`,
};

// ---------------------------------------------------------------------------
// Timing Functions
// ---------------------------------------------------------------------------

export const easings = {
	/** Standard ease for most animations */
	default: "cubic-bezier(0.4, 0, 0.2, 1)",
	/** Accelerate from rest */
	easeIn: "cubic-bezier(0.4, 0, 1, 1)",
	/** Decelerate to rest */
	easeOut: "cubic-bezier(0, 0, 0.2, 1)",
	/** Sharp movement */
	sharp: "cubic-bezier(0.4, 0, 0.6, 1)",
	/** Overshoot slightly */
	bounce: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
	/** Smooth and gentle */
	smooth: "cubic-bezier(0.25, 0.1, 0.25, 1)",
	/** Spring-like */
	spring: "cubic-bezier(0.175, 0.885, 0.32, 1.275)",
};

// ---------------------------------------------------------------------------
// Duration Constants
// ---------------------------------------------------------------------------

export const durations = {
	instant: "75ms",
	fast: "150ms",
	normal: "200ms",
	slow: "300ms",
	slower: "400ms",
	slowest: "500ms",
};

// ---------------------------------------------------------------------------
// CSS Mixins for styled-components
// ---------------------------------------------------------------------------

export const animationMixins = {
	fadeIn: (duration = durations.normal, easing = easings.default) => css`
		animation: ${animations.fadeIn} ${duration} ${easing} forwards;
	`,

	fadeOut: (duration = durations.normal, easing = easings.default) => css`
		animation: ${animations.fadeOut} ${duration} ${easing} forwards;
	`,

	scaleIn: (duration = durations.normal, easing = easings.bounce) => css`
		animation: ${animations.scaleIn} ${duration} ${easing} forwards;
	`,

	slideUp: (duration = durations.normal, easing = easings.easeOut) => css`
		animation: ${animations.slideInUp} ${duration} ${easing} forwards;
	`,

	slideDown: (duration = durations.normal, easing = easings.easeOut) => css`
		animation: ${animations.slideInDown} ${duration} ${easing} forwards;
	`,

	slideLeft: (duration = durations.slow, easing = easings.easeOut) => css`
		animation: ${animations.slideInLeft} ${duration} ${easing} forwards;
	`,

	slideRight: (duration = durations.slow, easing = easings.easeOut) => css`
		animation: ${animations.slideInRight} ${duration} ${easing} forwards;
	`,

	shake: (duration = durations.slow) => css`
		animation: ${animations.shake} ${duration} ease-in-out;
	`,

	pulse: (duration = "2s") => css`
		animation: ${animations.pulse} ${duration} ease-in-out infinite;
	`,

	spin: (duration = "1s") => css`
		animation: ${animations.spin} ${duration} linear infinite;
	`,

	shimmer: (duration = "1.5s") => css`
		background: linear-gradient(
			90deg,
			rgba(255, 255, 255, 0.05) 25%,
			rgba(255, 255, 255, 0.1) 50%,
			rgba(255, 255, 255, 0.05) 75%
		);
		background-size: 200% 100%;
		animation: ${animations.shimmer} ${duration} infinite;
	`,
};

// ---------------------------------------------------------------------------
// Transition Helpers
// ---------------------------------------------------------------------------

type TransitionProperty =
	| "all"
	| "opacity"
	| "transform"
	| "background"
	| "border"
	| "box-shadow"
	| "color"
	| "width"
	| "height"
	| "max-height";

export function transition(
	properties: TransitionProperty | TransitionProperty[] = "all",
	duration = durations.normal,
	easing = easings.default
): string {
	const props = Array.isArray(properties) ? properties : [properties];
	return props.map((prop) => `${prop} ${duration} ${easing}`).join(", ");
}

// ---------------------------------------------------------------------------
// Reduced Motion Support
// ---------------------------------------------------------------------------

export const prefersReducedMotion = css`
	@media (prefers-reduced-motion: reduce) {
		animation: none !important;
		transition: none !important;
	}
`;

export const withReducedMotion = (styles: ReturnType<typeof css>) => css`
	${styles}

	@media (prefers-reduced-motion: reduce) {
		animation-duration: 0.01ms !important;
		animation-iteration-count: 1 !important;
		transition-duration: 0.01ms !important;
	}
`;

export default {
	animations,
	easings,
	durations,
	animationMixins,
	transition,
	prefersReducedMotion,
	withReducedMotion,
};
