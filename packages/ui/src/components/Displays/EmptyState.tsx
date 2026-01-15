/**
 * EmptyState Component
 *
 * Placeholder for empty data states with illustration, title, description, and action.
 * Essential for good UX when lists/tables have no data.
 */

import styled from "styled-components";
import type { HTMLAttributes, ReactNode } from "react";

export interface EmptyStateProps extends HTMLAttributes<HTMLDivElement> {
	/** Icon or illustration */
	icon?: ReactNode;
	/** Main title */
	title: string;
	/** Descriptive text */
	description?: string;
	/** Primary action button */
	action?: ReactNode;
	/** Secondary action */
	secondaryAction?: ReactNode;
	/** Size variant */
	size?: "sm" | "md" | "lg";
	/** Visual variant */
	variant?: "default" | "minimal" | "card";
}

const sizeStyles = {
	sm: {
		padding: "24px",
		iconSize: "48px",
		titleSize: "1rem",
		descSize: "0.8rem",
		gap: "12px",
	},
	md: {
		padding: "40px",
		iconSize: "72px",
		titleSize: "1.25rem",
		descSize: "0.9rem",
		gap: "16px",
	},
	lg: {
		padding: "64px",
		iconSize: "96px",
		titleSize: "1.5rem",
		descSize: "1rem",
		gap: "20px",
	},
};

const Container = styled.div<{
	$size: "sm" | "md" | "lg";
	$variant: "default" | "minimal" | "card";
}>`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	text-align: center;
	padding: ${({ $size }) => sizeStyles[$size].padding};
	gap: ${({ $size }) => sizeStyles[$size].gap};
	width: 100%;
	max-width: 420px;
	margin: 0 auto;

	${({ $variant, theme }) => {
		switch ($variant) {
			case "card":
				return `
					background: ${theme.colors.backgrounds.elevated};
					border-radius: ${theme.radii.lg};
					border: 1px solid ${theme.colors.border.subtle};
				`;
			case "minimal":
				return `
					padding: 16px;
				`;
			default:
				return "";
		}
	}}
`;

const IconWrapper = styled.div<{ $size: "sm" | "md" | "lg" }>`
	width: ${({ $size }) => sizeStyles[$size].iconSize};
	height: ${({ $size }) => sizeStyles[$size].iconSize};
	display: flex;
	align-items: center;
	justify-content: center;
	color: ${({ theme }) => theme.colors.text.muted};
	opacity: 0.6;

	svg {
		width: 100%;
		height: 100%;
	}
`;

const Title = styled.h3<{ $size: "sm" | "md" | "lg" }>`
	margin: 0;
	font-family: ${({ theme }) => theme.typography.fontFamily};
	font-size: ${({ $size }) => sizeStyles[$size].titleSize};
	font-weight: ${({ theme }) => theme.typography.weightSemiBold};
	color: ${({ theme }) => theme.colors.text.primary};
	line-height: 1.3;
`;

const Description = styled.p<{ $size: "sm" | "md" | "lg" }>`
	margin: 0;
	font-family: ${({ theme }) => theme.typography.fontFamily};
	font-size: ${({ $size }) => sizeStyles[$size].descSize};
	color: ${({ theme }) => theme.colors.text.tertiary};
	line-height: 1.5;
	max-width: 320px;
`;

const Actions = styled.div`
	display: flex;
	align-items: center;
	gap: ${({ theme }) => theme.spacing.sm};
	margin-top: ${({ theme }) => theme.spacing.sm};
`;

// Default icons for common empty states
export const EmptyStateIcons = {
	noData: (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
			<path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
		</svg>
	),
	noSearch: (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
			<circle cx="11" cy="11" r="8" />
			<path d="m21 21-4.35-4.35M11 8v6M8 11h6" />
		</svg>
	),
	noNotifications: (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
			<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" />
		</svg>
	),
	noMessages: (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
			<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
		</svg>
	),
	error: (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
			<circle cx="12" cy="12" r="10" />
			<path d="M12 8v4M12 16h.01" />
		</svg>
	),
	noAccess: (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
			<rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
			<path d="M7 11V7a5 5 0 0 1 10 0v4" />
		</svg>
	),
};

export const EmptyState = ({
	icon,
	title,
	description,
	action,
	secondaryAction,
	size = "md",
	variant = "default",
	...props
}: EmptyStateProps) => {
	return (
		<Container $size={size} $variant={variant} {...props}>
			{icon && <IconWrapper $size={size}>{icon}</IconWrapper>}
			<Title $size={size}>{title}</Title>
			{description && <Description $size={size}>{description}</Description>}
			{(action || secondaryAction) && (
				<Actions>
					{action}
					{secondaryAction}
				</Actions>
			)}
		</Container>
	);
};

export default EmptyState;
