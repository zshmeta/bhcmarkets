import { forwardRef, useEffect, type HTMLAttributes } from "react";
import styled, { keyframes } from "styled-components";

type ToastVariant = "info" | "success" | "warning" | "danger";
type ToastPosition = "top-left" | "top-right" | "bottom-left" | "bottom-right";

export interface ToastProps extends HTMLAttributes<HTMLDivElement> {
	variant?: ToastVariant;
	title?: string;
	message: string;
	duration?: number;
	onClose?: () => void;
	position?: ToastPosition;
}

const slideIn = keyframes`
	from {
		transform: translateX(100%);
		opacity: 0;
	}
	to {
		transform: translateX(0);
		opacity: 1;
	}
`;

const ToastContainer = styled.div<{ $variant: ToastVariant; $position: ToastPosition }>`
	position: fixed;
	z-index: ${({ theme }) => theme.zIndices.toast};
	min-width: 320px;
	max-width: 420px;
	background: ${({ theme }) => theme.colors.backgrounds.elevated};
	border-radius: ${({ theme }) => theme.radii.lg};
	border-left: 4px solid;
	box-shadow: ${({ theme }) => theme.elevations.modal};
	padding: ${({ theme }) => theme.spacing.md};
	display: flex;
	align-items: flex-start;
	gap: ${({ theme }) => theme.spacing.sm};
	animation: ${slideIn} 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	backdrop-filter: blur(12px);

	${({ $position }) => {
		switch ($position) {
			case "top-left":
				return "top: 24px; left: 24px;";
			case "top-right":
				return "top: 24px; right: 24px;";
			case "bottom-left":
				return "bottom: 24px; left: 24px;";
			case "bottom-right":
				return "bottom: 24px; right: 24px;";
			default:
				return "top: 24px; right: 24px;";
		}
	}}

	${({ theme, $variant }) => {
		const colors = {
			info: theme.colors.primary,
			success: theme.colors.status.success,
			warning: theme.colors.status.warning,
			danger: theme.colors.status.danger,
		};
		return `border-left-color: ${colors[$variant]};`;
	}}
`;

const IconWrapper = styled.div<{ $variant: ToastVariant }>`
	width: 24px;
	height: 24px;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 50%;
	flex-shrink: 0;
	font-size: 14px;

	${({ theme, $variant }) => {
		const colors = {
			info: theme.colors.primary,
			success: theme.colors.status.success,
			warning: theme.colors.status.warning,
			danger: theme.colors.status.danger,
		};
		return `color: ${colors[$variant]};`;
	}}
`;

const Content = styled.div`
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: ${({ theme }) => theme.spacing.xxs};
`;

const Title = styled.div`
	font-weight: ${({ theme }) => theme.typography.weightSemiBold};
	color: ${({ theme }) => theme.colors.text.primary};
	font-size: ${({ theme }) => theme.typography.sizes.sm};
`;

const Message = styled.div`
	color: ${({ theme }) => theme.colors.text.secondary};
	font-size: ${({ theme }) => theme.typography.sizes.sm};
	line-height: ${({ theme }) => theme.typography.lineHeights.snug};
`;

const CloseButton = styled.button`
	width: 20px;
	height: 20px;
	display: flex;
	align-items: center;
	justify-content: center;
	border: none;
	background: transparent;
	color: ${({ theme }) => theme.colors.text.tertiary};
	cursor: pointer;
	flex-shrink: 0;

	&:hover {
		color: ${({ theme }) => theme.colors.text.primary};
	}
`;

const icons = {
	info: "ℹ",
	success: "✓",
	warning: "⚠",
	danger: "✕",
};

export const Toast = forwardRef<HTMLDivElement, ToastProps>(
	(
		{
			variant = "info",
			title,
			message,
			duration = 5000,
			onClose,
			position = "top-right",
			...props
		},
		ref
	) => {
		useEffect(() => {
			if (duration > 0 && onClose) {
				const timer = setTimeout(onClose, duration);
				return () => clearTimeout(timer);
			}
		}, [duration, onClose]);

		return (
			<ToastContainer ref={ref} $variant={variant} $position={position} {...props}>
				<IconWrapper $variant={variant}>{icons[variant]}</IconWrapper>
				<Content>
					{title && <Title>{title}</Title>}
					<Message>{message}</Message>
				</Content>
				{onClose && (
					<CloseButton onClick={onClose} aria-label="Close">
						×
					</CloseButton>
				)}
			</ToastContainer>
		);
	}
);

Toast.displayName = "Toast";

export default Toast;
