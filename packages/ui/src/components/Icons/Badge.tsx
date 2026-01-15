import { forwardRef, type HTMLAttributes } from "react";
import styled, { css, keyframes } from "styled-components";

type BadgeVariant = "default" | "primary" | "success" | "warning" | "danger" | "accent" | "info";
type BadgeSize = "sm" | "md" | "lg";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
	variant?: BadgeVariant;
	size?: BadgeSize;
	dot?: boolean;
	pulse?: boolean;
	outline?: boolean;
}

const pulse = keyframes`
	0%, 100% {
		opacity: 1;
	}
	50% {
		opacity: 0.5;
	}
`;

const variantStyles = css<{ $variant: BadgeVariant; $outline: boolean }>`
	${({ theme, $variant, $outline }) => {
		const variants = {
			default: {
				bg: "rgba(148, 163, 184, 0.2)",
				color: theme.colors.text.primary,
				border: "rgba(148, 163, 184, 0.4)",
			},
			primary: {
				bg: "rgba(63, 140, 255, 0.2)",
				color: theme.colors.primary,
				border: theme.colors.primary,
			},
			success: {
				bg: "rgba(59, 207, 124, 0.2)",
				color: theme.colors.status.success,
				border: theme.colors.status.success,
			},
			warning: {
				bg: "rgba(255, 179, 71, 0.2)",
				color: theme.colors.status.warning,
				border: theme.colors.status.warning,
			},
			danger: {
				bg: "rgba(255, 90, 95, 0.2)",
				color: theme.colors.status.danger,
				border: theme.colors.status.danger,
			},
			accent: {
				bg: "rgba(0, 209, 178, 0.2)",
				color: theme.colors.accent,
				border: theme.colors.accent,
			},
			info: {
				bg: "rgba(95, 162, 255, 0.2)",
				color: theme.colors.primaryHover,
				border: theme.colors.primaryHover,
			},
		};

		const style = variants[$variant] || variants.default;

		if ($outline) {
			return css`
				background: transparent;
				color: ${style.color};
				border: 1.5px solid ${style.border};
			`;
		}

		return css`
			background: ${style.bg};
			color: ${style.color};
			border: 1px solid ${style.border}30;
			box-shadow: 0 0 0 1px ${style.border}15;
		`;
	}}
`;

const sizeStyles = css<{ $size: BadgeSize }>`
	${({ theme, $size }) => {
		switch ($size) {
			case "sm":
				return css`
					padding: 2px ${theme.spacing.xs};
					font-size: ${theme.typography.sizes.xs};
					height: 20px;
				`;
			case "md":
				return css`
					padding: 4px ${theme.spacing.sm};
					font-size: ${theme.typography.sizes.xs};
					height: 24px;
				`;
			case "lg":
				return css`
					padding: 6px ${theme.spacing.md};
					font-size: ${theme.typography.sizes.sm};
					height: 28px;
				`;
			default:
				return "";
		}
	}}
`;

const Dot = styled.span<{ $variant: BadgeVariant; $pulse: boolean }>`
	display: inline-block;
	width: 6px;
	height: 6px;
	border-radius: 50%;
	margin-right: 6px;
	background: currentColor;

	${({ $pulse }) =>
		$pulse &&
		css`
			animation: ${pulse} 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
		`}
`;

const StyledBadge = styled.span<{
	$variant: BadgeVariant;
	$size: BadgeSize;
	$outline: boolean;
	$pulse: boolean;
}>`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	border-radius: ${({ theme }) => theme.radii.pill};
	font-family: ${({ theme }) => theme.typography.fontFamily};
	font-weight: ${({ theme }) => theme.typography.weightSemiBold};
	letter-spacing: 0.03em;
	text-transform: uppercase;
	line-height: 1;
	white-space: nowrap;
	transition: all 0.2s ease;
	backdrop-filter: blur(4px);

	${variantStyles}
	${sizeStyles}

	&:hover {
		transform: scale(1.05);
	}
`;

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
	(
		{
			children,
			variant = "default",
			size = "md",
			dot = false,
			pulse = false,
			outline = false,
			...props
		},
		ref
	) => (
		<StyledBadge
			ref={ref}
			$variant={variant}
			$size={size}
			$outline={outline}
			$pulse={pulse}
			{...props}
		>
			{dot && <Dot $variant={variant} $pulse={pulse} />}
			{children}
		</StyledBadge>
	)
);

Badge.displayName = "Badge";

export default Badge;