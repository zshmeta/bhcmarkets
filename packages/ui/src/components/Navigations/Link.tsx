/**
 * Link Component
 *
 * Styled anchor with router integration.
 * Supports internal/external links with proper accessibility.
 */

import { forwardRef, type AnchorHTMLAttributes, type ReactNode } from "react";
import styled, { css } from "styled-components";

type LinkVariant = "default" | "subtle" | "underline" | "button";
type LinkSize = "sm" | "md" | "lg";

export interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
	/** Visual variant */
	variant?: LinkVariant;
	/** Size */
	size?: LinkSize;
	/** Icon to show */
	icon?: ReactNode;
	/** Icon position */
	iconPosition?: "left" | "right";
	/** Use custom color */
	color?: "primary" | "secondary" | "danger" | "inherit";
	/** Disabled state */
	disabled?: boolean;
	/** External link (opens in new tab) */
	external?: boolean;
	/** Show external icon */
	showExternalIcon?: boolean;
}

const sizeStyles = {
	sm: "0.8rem",
	md: "0.95rem",
	lg: "1.1rem",
};

const StyledLink = styled.a<{
	$variant: LinkVariant;
	$size: LinkSize;
	$color: string;
	$disabled: boolean;
}>`
	display: inline-flex;
	align-items: center;
	gap: ${({ theme }) => theme.spacing.xxs};
	font-family: ${({ theme }) => theme.typography.fontFamily};
	font-size: ${({ $size }) => sizeStyles[$size]};
	font-weight: ${({ theme }) => theme.typography.weightMedium};
	text-decoration: none;
	transition: all 0.2s ease;
	cursor: ${({ $disabled }) => ($disabled ? "not-allowed" : "pointer")};
	opacity: ${({ $disabled }) => ($disabled ? 0.5 : 1)};
	pointer-events: ${({ $disabled }) => ($disabled ? "none" : "auto")};

	${({ $variant, $color, theme }) => {
		const colorValue =
			$color === "inherit"
				? "currentColor"
				: $color === "primary"
				? theme.colors.primary
				: $color === "danger"
				? theme.colors.status.danger
				: theme.colors.text.secondary;

		switch ($variant) {
			case "subtle":
				return css`
					color: ${theme.colors.text.tertiary};

					&:hover {
						color: ${colorValue};
					}
				`;

			case "underline":
				return css`
					color: ${colorValue};
					text-decoration: underline;
					text-underline-offset: 3px;

					&:hover {
						text-decoration-thickness: 2px;
					}
				`;

			case "button":
				return css`
					color: ${colorValue};
					padding: ${theme.spacing.xs} ${theme.spacing.md};
					border-radius: ${theme.radii.md};
					background: ${$color === "inherit"
						? "transparent"
						: `${colorValue}15`};

					&:hover {
						background: ${$color === "inherit"
							? "rgba(255, 255, 255, 0.08)"
							: `${colorValue}25`};
					}
				`;

			default:
				return css`
					color: ${colorValue};
					position: relative;

					&::after {
						content: "";
						position: absolute;
						bottom: -2px;
						left: 0;
						width: 0;
						height: 2px;
						background: ${colorValue};
						transition: width 0.2s ease;
					}

					&:hover::after {
						width: 100%;
					}
				`;
		}
	}}

	&:focus-visible {
		outline: 2px solid ${({ theme }) => theme.colors.primary};
		outline-offset: 2px;
		border-radius: ${({ theme }) => theme.radii.xs};
	}
`;

const IconWrapper = styled.span`
	display: inline-flex;
	align-items: center;
	justify-content: center;

	svg {
		width: 1em;
		height: 1em;
	}
`;

const ExternalIcon = () => (
	<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
		<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" />
	</svg>
);

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(
	(
		{
			variant = "default",
			size = "md",
			icon,
			iconPosition = "left",
			color = "primary",
			disabled = false,
			external = false,
			showExternalIcon = true,
			children,
			href,
			...props
		},
		ref
	) => {
		const externalProps = external
			? {
					target: "_blank",
					rel: "noopener noreferrer",
			  }
			: {};

		return (
			<StyledLink
				ref={ref}
				href={disabled ? undefined : href}
				$variant={variant}
				$size={size}
				$color={color}
				$disabled={disabled}
				aria-disabled={disabled}
				{...externalProps}
				{...props}
			>
				{icon && iconPosition === "left" && (
					<IconWrapper>{icon}</IconWrapper>
				)}
				{children}
				{icon && iconPosition === "right" && (
					<IconWrapper>{icon}</IconWrapper>
				)}
				{external && showExternalIcon && (
					<IconWrapper>
						<ExternalIcon />
					</IconWrapper>
				)}
			</StyledLink>
		);
	}
);

Link.displayName = "Link";

export default Link;
