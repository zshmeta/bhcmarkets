import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import styled from "styled-components";

type AlertVariant = "info" | "success" | "warning" | "danger";

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
	variant?: AlertVariant;
	title?: string;
	message?: string;
	icon?: ReactNode;
	onClose?: () => void;
}

const Container = styled.div<{ $variant: AlertVariant }>`
	display: flex;
	align-items: flex-start;
	gap: ${({ theme }) => theme.spacing.sm};
	padding: ${({ theme }) => theme.spacing.md};
	border-radius: ${({ theme }) => theme.radii.md};
	background: ${({ theme }) => theme.colors.backgrounds.surface};
	border: 1px solid ${({ theme }) => theme.colors.border.subtle};
	border-left: 4px solid;

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

const Icon = styled.div<{ $variant: AlertVariant }>`
	width: 24px;
	height: 24px;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;

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
	line-height: ${({ theme }) => theme.typography.lineHeights.normal};
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

	&:hover {
		color: ${({ theme }) => theme.colors.text.primary};
	}
`;

export const Alert = forwardRef<HTMLDivElement, AlertProps>(
	({ variant = "info", title, message, icon, onClose, ...props }, ref) => {
		const defaultIcons: Record<AlertVariant, string> = {
			info: "ℹ",
			success: "✓",
			warning: "⚠",
			danger: "✕",
		};

		return (
			<Container ref={ref} $variant={variant} {...props}>
				<Icon $variant={variant}>{icon ?? defaultIcons[variant]}</Icon>
				<Content>
					{title && <Title>{title}</Title>}
					{message && <Message>{message}</Message>}
				</Content>
				{onClose && (
					<CloseButton onClick={onClose} aria-label="Close">
						×
					</CloseButton>
				)}
			</Container>
		);
	}
);

Alert.displayName = "Alert";

export default Alert;
