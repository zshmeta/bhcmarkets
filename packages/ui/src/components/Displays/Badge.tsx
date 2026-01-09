/**
 * Badge Component
 *
 * Status indicators, count badges, and labels.
 * Supports dot mode, pulse animation, and various styles.
 */

import styled, { css, keyframes } from "styled-components";
import type { HTMLAttributes, ReactNode } from "react";
import React from "react";

type BadgeVariant = "solid" | "soft" | "outline" | "dot";
type BadgeColor = "primary" | "secondary" | "success" | "warning" | "danger" | "info";
type BadgeSize = "sm" | "md" | "lg";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
	/** Visual variant */
	variant?: BadgeVariant;
	/** Color scheme */
	color?: BadgeColor;
	/** Size */
	size?: BadgeSize;
	/** Content (number will be formatted) */
	children?: ReactNode;
	/** Maximum count before showing max+ */
	max?: number;
	/** Show as dot only */
	dot?: boolean;
	/** Pulse animation (for notifications) */
	pulse?: boolean;
	/** Pill shape */
	pill?: boolean;
	/** Icon */
	icon?: ReactNode;
}

export interface BadgeContainerProps {
	/** Content to attach badge to */
	children: ReactNode;
	/** Badge props */
	badge: BadgeProps;
	/** Badge position */
	position?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
	/** Offset from corner */
	offset?: number;
}

const pulseAnimation = keyframes`
	0% {
		transform: scale(1);
		opacity: 1;
	}
	50% {
		transform: scale(1.5);
		opacity: 0;
	}
	100% {
		transform: scale(1);
		opacity: 0;
	}
`;

const colorMap = {
	primary: {
		solid: { bg: "primary", text: "onAccent" },
		soft: { bg: "primarySoft", text: "primary" },
	},
	secondary: {
		solid: { bg: "neutral600", text: "neutral50" },
		soft: { bg: "elevated", text: "secondary" },
	},
	success: {
		solid: { bg: "success", text: "onAccent" },
		soft: { bg: "successSoft", text: "success" },
	},
	warning: {
		solid: { bg: "warning", text: "background" },
		soft: { bg: "warningSoft", text: "warning" },
	},
	danger: {
		solid: { bg: "danger", text: "onAccent" },
		soft: { bg: "dangerSoft", text: "danger" },
	},
	info: {
		solid: { bg: "primary", text: "onAccent" },
		soft: { bg: "primarySoft", text: "primary" },
	},
};

const sizeStyles = {
	sm: { height: "18px", minWidth: "18px", padding: "0 6px", fontSize: "0.65rem", dotSize: "6px" },
	md: { height: "22px", minWidth: "22px", padding: "0 8px", fontSize: "0.75rem", dotSize: "8px" },
	lg: { height: "26px", minWidth: "26px", padding: "0 10px", fontSize: "0.85rem", dotSize: "10px" },
};

const StyledBadge = styled.span<{
	$variant: BadgeVariant;
	$color: BadgeColor;
	$size: BadgeSize;
	$pill: boolean;
	$pulse: boolean;
	$isDot: boolean;
	$hasContent: boolean;
}>`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	gap: ${({ theme }) => theme.spacing.xxs};
	font-family: ${({ theme }) => theme.typography.fontFamily};
	font-weight: ${({ theme }) => theme.typography.weightSemiBold};
	white-space: nowrap;
	vertical-align: middle;
	transition: all 0.2s ease;

	${({ $isDot, $size }) =>
		$isDot
			? css`
					width: ${sizeStyles[$size].dotSize};
					height: ${sizeStyles[$size].dotSize};
					min-width: unset;
					padding: 0;
					border-radius: 50%;
			  `
			: css`
					height: ${sizeStyles[$size].height};
					min-width: ${sizeStyles[$size].height};
					padding: ${sizeStyles[$size].padding};
					font-size: ${sizeStyles[$size].fontSize};
			  `}

	border-radius: ${({ $pill, $isDot, theme }) =>
		$isDot ? "50%" : $pill ? theme.radii.pill : theme.radii.sm};

	${({ $variant, $color, theme }) => {
		switch ($variant) {
			case "solid":
				return css`
					background: ${$color === "primary"
						? theme.gradients.primary
						: $color === "success"
						? theme.colors.status.success
						: $color === "warning"
						? theme.colors.status.warning
						: $color === "danger"
						? theme.colors.status.danger
						: theme.colors.backgrounds.elevated};
					color: ${$color === "warning"
						? theme.colors.backgrounds.app
						: theme.colors.text.onAccent};
				`;

			case "soft":
				return css`
					background: ${$color === "primary"
						? `${theme.colors.primary}20`
						: $color === "success"
						? `${theme.colors.status.success}20`
						: $color === "warning"
						? `${theme.colors.status.warning}20`
						: $color === "danger"
						? `${theme.colors.status.danger}20`
						: `${theme.colors.backgrounds.elevated}`};
					color: ${$color === "primary"
						? theme.colors.primary
						: $color === "success"
						? theme.colors.status.success
						: $color === "warning"
						? theme.colors.status.warning
						: $color === "danger"
						? theme.colors.status.danger
						: theme.colors.text.secondary};
				`;

			case "outline":
				return css`
					background: transparent;
					border: 1.5px solid
						${$color === "primary"
							? theme.colors.primary
							: $color === "success"
							? theme.colors.status.success
							: $color === "warning"
							? theme.colors.status.warning
							: $color === "danger"
							? theme.colors.status.danger
							: theme.colors.border.default};
					color: ${$color === "primary"
						? theme.colors.primary
						: $color === "success"
						? theme.colors.status.success
						: $color === "warning"
						? theme.colors.status.warning
						: $color === "danger"
						? theme.colors.status.danger
						: theme.colors.text.secondary};
				`;

			case "dot":
				return css`
					background: ${$color === "primary"
						? theme.colors.primary
						: $color === "success"
						? theme.colors.status.success
						: $color === "warning"
						? theme.colors.status.warning
						: $color === "danger"
						? theme.colors.status.danger
						: theme.colors.text.muted};
				`;
		}
	}}

	${({ $pulse, $color, theme }) =>
		$pulse &&
		css`
			position: relative;

			&::after {
				content: "";
				position: absolute;
				inset: 0;
				border-radius: inherit;
				background: ${$color === "primary"
					? theme.colors.primary
					: $color === "success"
					? theme.colors.status.success
					: $color === "warning"
					? theme.colors.status.warning
					: $color === "danger"
					? theme.colors.status.danger
					: theme.colors.text.muted};
				animation: ${pulseAnimation} 1.5s ease-out infinite;
			}
		`}
`;

const IconWrapper = styled.span`
	display: inline-flex;
	align-items: center;

	svg {
		width: 1em;
		height: 1em;
	}
`;

const BadgeWrapper = styled.div`
	position: relative;
	display: inline-flex;
`;

const PositionedBadge = styled.div<{
	$position: string;
	$offset: number;
}>`
	position: absolute;
	${({ $position, $offset }) => {
		switch ($position) {
			case "top-right":
				return css`
					top: ${-$offset}px;
					right: ${-$offset}px;
				`;
			case "top-left":
				return css`
					top: ${-$offset}px;
					left: ${-$offset}px;
				`;
			case "bottom-right":
				return css`
					bottom: ${-$offset}px;
					right: ${-$offset}px;
				`;
			case "bottom-left":
				return css`
					bottom: ${-$offset}px;
					left: ${-$offset}px;
				`;
		}
	}}
`;

function formatCount(count: number, max?: number): string {
	if (max && count > max) {
		return `${max}+`;
	}
	return String(count);
}

export const Badge = ({
	variant = "solid",
	color = "primary",
	size = "md",
	children,
	max = 99,
	dot = false,
	pulse = false,
	pill = true,
	icon,
	...props
}: BadgeProps) => {
	const isDot = dot || variant === "dot";
	const hasContent = !isDot && (children !== undefined || icon);

	let displayContent = children;
	if (typeof children === "number") {
		displayContent = formatCount(children, max);
	}

	return (
		<StyledBadge
			$variant={isDot ? "dot" : variant}
			$color={color}
			$size={size}
			$pill={pill}
			$pulse={pulse}
			$isDot={isDot}
			$hasContent={Boolean(hasContent)}
			{...props}
		>
			{!isDot && (
				<>
					{icon && <IconWrapper>{icon}</IconWrapper>}
					{displayContent}
				</>
			)}
		</StyledBadge>
	);
};

export const BadgeContainer = ({
	children,
	badge,
	position = "top-right",
	offset = 4,
}: BadgeContainerProps) => {
	return (
		<BadgeWrapper>
			{children}
			<PositionedBadge $position={position} $offset={offset}>
				<Badge {...badge} />
			</PositionedBadge>
		</BadgeWrapper>
	);
};

export default Badge;
