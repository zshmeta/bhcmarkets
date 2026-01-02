import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import styled, { css } from "styled-components";

type CardVariant = "default" | "elevated" | "glass" | "bordered" | "gradient";
type CardPadding = "none" | "sm" | "md" | "lg" | "xl";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
	variant?: CardVariant;
	padding?: CardPadding;
	header?: ReactNode;
	footer?: ReactNode;
	hoverable?: boolean;
	clickable?: boolean;
	loading?: boolean;
	disabled?: boolean;
}

const StyledCard = styled.div<{
	$variant: CardVariant;
	$padding: CardPadding;
	$hoverable: boolean;
	$clickable: boolean;
	$loading: boolean;
	$disabled: boolean;
}>`
	position: relative;
	border-radius: ${({ theme }) => theme.radii.lg};
	transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
	overflow: hidden;
	isolation: isolate;
	user-select: ${({ $clickable }) => ($clickable ? "none" : "auto")};
	pointer-events: ${({ $disabled }) => ($disabled ? "none" : "auto")};
	opacity: ${({ $disabled }) => ($disabled ? 0.5 : 1)};

	/* Variant styles */
	${({ theme, $variant }) => {
		switch ($variant) {
			case "elevated":
				return css`
					background: ${theme.colors.backgrounds.elevated};
					box-shadow: ${theme.elevations.raised};
					border: 1px solid ${theme.colors.border.subtle};
				`;
			case "glass":
				return css`
					background: linear-gradient(
						135deg,
						rgba(255, 255, 255, 0.1) 0%,
						rgba(255, 255, 255, 0.05) 100%
					);
					backdrop-filter: blur(20px) saturate(180%);
					border: 1px solid rgba(255, 255, 255, 0.18);
					box-shadow: 0 8px 32px rgba(0, 0, 0, 0.37);
					&::before {
						content: "";
						position: absolute;
						top: 0;
						left: 0;
						right: 0;
						height: 1px;
						background: linear-gradient(
							90deg,
							transparent,
							rgba(255, 255, 255, 0.3),
							transparent
						);
					}
				`;
			case "bordered":
				return css`
					background: ${theme.colors.backgrounds.surface};
					border: 2px solid ${theme.colors.border.default};
				`;
			case "gradient":
				return css`
					background: linear-gradient(
						135deg,
						${theme.colors.backgrounds.elevated} 0%,
						${theme.colors.backgrounds.surface} 100%
					);
					border: 1px solid ${theme.colors.border.accent};
					box-shadow: ${theme.shadows.soft};
				`;
			default:
				return css`
					background: ${theme.colors.backgrounds.surface};
					border: 1px solid ${theme.colors.border.subtle};
				`;
		}
	}}

	/* Hover effects */
	${({ $hoverable, $clickable, theme }) =>
		($hoverable || $clickable) &&
		css`
			cursor: pointer;
			&:hover {
				transform: translateY(-4px);
				box-shadow: ${theme.elevations.overlay};
				border-color: ${theme.colors.border.accent};
			}
			&:active {
				transform: translateY(-2px);
			}
		`}

	/* Loading state */
	${({ $loading }) =>
		$loading &&
		css`
			&::after {
				content: "";
				position: absolute;
				top: 0;
				left: -100%;
				width: 100%;
				height: 100%;
				background: linear-gradient(
					90deg,
					transparent,
					rgba(255, 255, 255, 0.1),
					transparent
				);
				animation: shimmer 1.5s infinite;
			}

			@keyframes shimmer {
				0% {
					left: -100%;
				}
				100% {
					left: 100%;
				}
			}
		`}
`;

const CardHeader = styled.div<{ $padding: string }>`
	padding: ${({ $padding }) => $padding};
	border-bottom: 1px solid ${({ theme }) => theme.colors.border.subtle};
	font-weight: ${({ theme }) => theme.typography.weightSemiBold};
	font-size: ${({ theme }) => theme.typography.sizes.md};
	color: ${({ theme }) => theme.colors.text.primary};
	display: flex;
	align-items: center;
	justify-content: space-between;
	background: linear-gradient(
		180deg,
		rgba(255, 255, 255, 0.02) 0%,
		transparent 100%
	);
`;

const CardContent = styled.div<{ $padding: string }>`
	padding: ${({ $padding }) => $padding};
	color: ${({ theme }) => theme.colors.text.secondary};
	font-size: ${({ theme }) => theme.typography.sizes.base};
	line-height: ${({ theme }) => theme.typography.lineHeights.relaxed};
`;

const CardFooter = styled.div<{ $padding: string }>`
	padding: ${({ $padding }) => $padding};
	border-top: 1px solid ${({ theme }) => theme.colors.border.subtle};
	color: ${({ theme }) => theme.colors.text.tertiary};
	font-size: ${({ theme }) => theme.typography.sizes.sm};
	display: flex;
	align-items: center;
	justify-content: space-between;
	background: linear-gradient(
		0deg,
		rgba(255, 255, 255, 0.02) 0%,
		transparent 100%
	);
`;

const paddingMap: Record<CardPadding, string> = {
	none: "0",
	sm: "12px",
	md: "20px",
	lg: "28px",
	xl: "36px",
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
	(
		{
			variant = "default",
			padding = "md",
			header,
			footer,
			hoverable = false,
			clickable = false,
			loading = false,
			disabled = false,
			children,
			...props
		},
		ref
	) => {
		const paddingValue = paddingMap[padding];

		return (
			<StyledCard
				ref={ref}
				$variant={variant}
				$padding={padding}
				$hoverable={hoverable}
				$clickable={clickable}
				$loading={loading}
				$disabled={disabled}
				{...props}
			>
				{header && <CardHeader $padding={paddingValue}>{header}</CardHeader>}
				<CardContent $padding={paddingValue}>{children}</CardContent>
				{footer && <CardFooter $padding={paddingValue}>{footer}</CardFooter>}
			</StyledCard>
		);
	}
);

Card.displayName = "Card";

export default Card;
