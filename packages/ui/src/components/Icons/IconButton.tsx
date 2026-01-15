import { forwardRef, useState, type ButtonHTMLAttributes, type ReactNode, type MouseEvent } from "react";
import styled, { css, keyframes } from "styled-components";

type IconButtonVariant = "ghost" | "primary" | "outline" | "danger" | "success";
type IconButtonSize = "xs" | "sm" | "md" | "lg";

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: IconButtonVariant;
	size?: IconButtonSize;
	children?: ReactNode;
	rounded?: boolean;
	loading?: boolean;
}

const spin = keyframes`
	from { transform: rotate(0deg); }
	to { transform: rotate(360deg); }
`;

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

const sizeMap = {
	xs: 28,
	sm: 36,
	md: 44,
	lg: 52,
};

const variantStyles = css<{ $variant: IconButtonVariant }>`
	${({ theme, $variant }) => {
		switch ($variant) {
			case "primary":
				return css`
					background: ${theme.gradients.primary};
					color: ${theme.colors.text.onAccent};
					box-shadow: ${theme.shadows.soft};
					&:hover {
						filter: brightness(1.1);
						box-shadow: ${theme.shadows.medium};
					}
				`;
			case "outline":
				return css`
					background: transparent;
					border: 2px solid ${theme.colors.border.default};
					color: ${theme.colors.text.secondary};
					&:hover {
						border-color: ${theme.colors.primary};
						color: ${theme.colors.primaryHover};
						box-shadow: 0 0 0 3px ${theme.colors.focus};
					}
				`;
			case "danger":
				return css`
					background: ${theme.gradients.danger};
					color: ${theme.colors.text.onAccent};
					&:hover {
						filter: brightness(1.1);
					}
				`;
			case "success":
				return css`
					background: linear-gradient(135deg, ${theme.colors.status.success}, rgba(59, 207, 124, 0.8));
					color: ${theme.colors.text.onAccent};
					&:hover {
						filter: brightness(1.1);
					}
				`;
			default:
				return css`
					background: rgba(255, 255, 255, 0.06);
					color: ${theme.colors.text.secondary};
					&:hover {
						background: rgba(255, 255, 255, 0.12);
						color: ${theme.colors.text.primary};
					}
				`;
		}
	}}
`;

const StyledIconButton = styled.button<{
	$size: number;
	$variant: IconButtonVariant;
	$rounded: boolean;
	$loading: boolean;
}>`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: ${({ $size }) => $size}px;
	height: ${({ $size }) => $size}px;
	border-radius: ${({ theme, $rounded }) => ($rounded ? "50%" : theme.radii.md)};
	border: none;
	cursor: pointer;
	transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
	backdrop-filter: blur(6px);
	position: relative;
	overflow: hidden;
	isolation: isolate;

	${variantStyles}

	&:disabled {
		opacity: 0.4;
		cursor: not-allowed;
		pointer-events: none;
	}

	&:focus-visible {
		outline: none;
		box-shadow: 0 0 0 4px ${({ theme }) => theme.colors.focus};
	}

	${({ $loading }) =>
		$loading &&
		css`
			pointer-events: none;
		`}
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

const LoadingSpinner = styled.span`
	position: absolute;
	inset: 0;
	display: flex;
	align-items: center;
	justify-content: center;

	&::after {
		content: "";
		width: 14px;
		height: 14px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-top-color: currentColor;
		border-radius: 50%;
		animation: ${spin} 0.6s linear infinite;
	}
`;

const Content = styled.span<{ $loading: boolean }>`
	opacity: ${({ $loading }) => ($loading ? 0 : 1)};
	transition: opacity 0.2s ease;
`;

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
	(
		{
			variant = "ghost",
			size = "md",
			children,
			rounded = false,
			loading = false,
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
			<StyledIconButton
				ref={ref}
				$variant={variant}
				$size={sizeMap[size]}
				$rounded={rounded}
				$loading={loading}
				onClick={handleClick}
				disabled={disabled || loading}
				{...props}
			>
				{ripples.map((ripple) => (
					<RippleEffect key={ripple.id} $x={ripple.x} $y={ripple.y} />
				))}
				<Content $loading={loading}>{children}</Content>
				{loading && <LoadingSpinner />}
			</StyledIconButton>
		);
	}
);

IconButton.displayName = "IconButton";

export default IconButton;
