import { forwardRef, useState, type ButtonHTMLAttributes, type ReactNode, type MouseEvent } from "react";
import styled, { css, keyframes } from "styled-components";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "success";
type ButtonSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: ButtonVariant;
	size?: ButtonSize;
	icon?: ReactNode;
	iconPosition?: "left" | "right";
	fullWidth?: boolean;
	loading?: boolean;
	rounded?: boolean;
}

const ripple = keyframes`
	0% {
		transform: scale(0);
		opacity: 0.6;
	}
	100% {
		transform: scale(4);
		opacity: 0;
	}
`;

const spin = keyframes`
	from {
		transform: rotate(0deg);
	}
	to {
		transform: rotate(360deg);
	}
`;

const variantStyles = css<{ $variant: ButtonVariant }>`
	${({ theme, $variant }) => {
		switch ($variant) {
			case "primary":
				return css`
					background: ${theme.gradients.primary};
					color: ${theme.colors.text.onAccent};
					box-shadow: ${theme.shadows.soft}, inset 0 1px 0 rgba(255, 255, 255, 0.1);
					border: none;

					&::before {
						content: "";
						position: absolute;
						inset: 0;
						background: linear-gradient(
							135deg,
							rgba(255, 255, 255, 0.2),
							transparent 50%
						);
						opacity: 0;
						transition: opacity 0.3s ease;
					}

					&:hover::before {
						opacity: 1;
					}

					&:hover {
						box-shadow: ${theme.shadows.medium}, inset 0 1px 0 rgba(255, 255, 255, 0.15);
						transform: translateY(-1px);
					}

					&:active {
						transform: translateY(0);
						box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.2);
					}
				`;
			case "secondary":
				return css`
					background: ${theme.colors.backgrounds.elevated};
					color: ${theme.colors.text.primary};
					border: 1.5px solid ${theme.colors.border.default};
					box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);

					&:hover {
						background: ${theme.colors.backgrounds.surface};
						border-color: ${theme.colors.border.accent};
						box-shadow: 0 0 0 3px ${theme.colors.focus};
					}

					&:active {
						background: ${theme.colors.backgrounds.soft};
					}
				`;
			case "outline":
				return css`
					background: transparent;
					color: ${theme.colors.text.primary};
					border: 2px solid ${theme.colors.border.default};

					&:hover {
						background: rgba(255, 255, 255, 0.05);
						border-color: ${theme.colors.primary};
						color: ${theme.colors.primaryHover};
						box-shadow: 0 0 0 3px ${theme.colors.focus};
					}

					&:active {
						background: rgba(255, 255, 255, 0.08);
					}
				`;
			case "ghost":
				return css`
					background: transparent;
					color: ${theme.colors.text.secondary};
					border: none;

					&:hover {
						background: rgba(255, 255, 255, 0.08);
						color: ${theme.colors.text.primary};
					}

					&:active {
						background: rgba(255, 255, 255, 0.12);
					}
				`;
			case "danger":
				return css`
					background: ${theme.gradients.danger};
					color: ${theme.colors.text.onAccent};
					box-shadow: ${theme.shadows.soft};
					border: none;

					&:hover {
						filter: brightness(1.1);
						box-shadow: ${theme.shadows.medium};
					}

					&:active {
						filter: brightness(0.95);
					}
				`;
			case "success":
				return css`
					background: linear-gradient(135deg, ${theme.colors.status.success}, rgba(59, 207, 124, 0.8));
					color: ${theme.colors.text.onAccent};
					box-shadow: ${theme.shadows.soft};
					border: none;

					&:hover {
						filter: brightness(1.1);
					}
				`;
			default:
				return "";
		}
	}}
`;

const sizeStyles = css<{ $size: ButtonSize }>`
	${({ theme, $size }) => {
		switch ($size) {
			case "xs":
				return css`
					height: 28px;
					padding: 0 ${theme.spacing.sm};
					font-size: ${theme.typography.sizes.xs};
					gap: ${theme.spacing.xxs};
				`;
			case "sm":
				return css`
					height: 36px;
					padding: 0 ${theme.spacing.md};
					font-size: ${theme.typography.sizes.sm};
					gap: ${theme.spacing.xs};
				`;
			case "md":
				return css`
					height: 42px;
					padding: 0 ${theme.spacing.lg};
					font-size: ${theme.typography.sizes.base};
					gap: ${theme.spacing.xs};
				`;
			case "lg":
				return css`
					height: 50px;
					padding: 0 ${theme.spacing.xl};
					font-size: ${theme.typography.sizes.md};
					gap: ${theme.spacing.sm};
				`;
			case "xl":
				return css`
					height: 58px;
					padding: 0 ${theme.spacing.xxl};
					font-size: ${theme.typography.sizes.lg};
					gap: ${theme.spacing.sm};
				`;
			default:
				return "";
		}
	}}
`;

const StyledButton = styled.button<{
	$variant: ButtonVariant;
	$size: ButtonSize;
	$fullWidth: boolean;
	$loading: boolean;
	$rounded: boolean;
}>`
	position: relative;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: ${({ $fullWidth }) => ($fullWidth ? "100%" : "auto")};
	border-radius: ${({ theme, $rounded }) => ($rounded ? theme.radii.pill : theme.radii.md)};
	cursor: pointer;
	font-family: ${({ theme }) => theme.typography.fontFamily};
	font-weight: ${({ theme }) => theme.typography.weightSemiBold};
	line-height: 1;
	transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
	overflow: hidden;
	isolation: isolate;
	user-select: none;
	text-decoration: none;
	white-space: nowrap;
	outline: none;

	${variantStyles}
	${sizeStyles}

	&:disabled {
		cursor: not-allowed;
		opacity: 0.5;
		pointer-events: none;
		box-shadow: none;
	}

	&:focus-visible {
		outline: none;
		box-shadow: 0 0 0 4px ${({ theme }) => theme.colors.focus}, 
					 inset 0 0 0 1px rgba(255, 255, 255, 0.1);
	}

	${({ $loading }) =>
		$loading &&
		css`
			pointer-events: none;
		`}
`;

const LoadingSpinner = styled.span`
	display: inline-block;
	width: 14px;
	height: 14px;
	border: 2px solid rgba(255, 255, 255, 0.3);
	border-top-color: currentColor;
	border-radius: 50%;
	animation: ${spin} 0.6s linear infinite;
`;

const RippleEffect = styled.span<{ $x: number; $y: number }>`
	position: absolute;
	width: 20px;
	height: 20px;
	border-radius: 50%;
	background: rgba(255, 255, 255, 0.5);
	pointer-events: none;
	transform: scale(0);
	animation: ${ripple} 0.6s ease-out;
	left: ${({ $x }) => $x}px;
	top: ${({ $y }) => $y}px;
`;

const ButtonContent = styled.span<{ $loading: boolean }>`
	display: flex;
	align-items: center;
	gap: inherit;
	opacity: ${({ $loading }) => ($loading ? 0 : 1)};
	transition: opacity 0.2s ease;
`;

const LoadingWrapper = styled.span`
	position: absolute;
	inset: 0;
	display: flex;
	align-items: center;
	justify-content: center;
`;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
	(
		{
			children,
			variant = "primary",
			size = "md",
			icon,
			iconPosition = "left",
			fullWidth = false,
			loading = false,
			rounded = false,
			onClick,
			disabled,
			...props
		},
		ref
	) => {
		const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([]);

		const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
			if (loading || disabled) return;

			const button = e.currentTarget;
			const rect = button.getBoundingClientRect();
			const x = e.clientX - rect.left;
			const y = e.clientY - rect.top;

			const newRipple = { x, y, id: Date.now() };
			setRipples((prev) => [...prev, newRipple]);

			setTimeout(() => {
				setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
			}, 600);

			onClick?.(e);
		};

		return (
			<StyledButton
				ref={ref}
				$variant={variant}
				$size={size}
				$fullWidth={fullWidth}
				$loading={loading}
				$rounded={rounded}
				onClick={handleClick}
				disabled={disabled || loading}
				{...props}
			>
				{ripples.map((ripple) => (
					<RippleEffect key={ripple.id} $x={ripple.x} $y={ripple.y} />
				))}
				<ButtonContent $loading={loading}>
					{icon && iconPosition === "left" && <span aria-hidden>{icon}</span>}
					{children}
					{icon && iconPosition === "right" && <span aria-hidden>{icon}</span>}
				</ButtonContent>
				{loading && (
					<LoadingWrapper>
						<LoadingSpinner aria-label="Loading" />
					</LoadingWrapper>
				)}
			</StyledButton>
		);
	}
);

Button.displayName = "Button";

export default Button;