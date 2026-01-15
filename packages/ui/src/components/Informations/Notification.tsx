import { forwardRef, type HTMLAttributes } from "react";
import styled from "styled-components";

type NotificationVariant = "info" | "success" | "warning" | "danger";

export interface NotificationProps extends HTMLAttributes<HTMLDivElement> {
	variant?: NotificationVariant;
	title: string;
	message?: string;
	icon?: string;
	onClose?: () => void;
}

const NotificationContainer = styled.div<{ $variant: NotificationVariant }>`
	background: ${({ theme }) => theme.colors.backgrounds.surface};
	border-radius: ${({ theme }) => theme.radii.md};
	border-left: 4px solid;
	padding: ${({ theme }) => theme.spacing.md};
	display: flex;
	align-items: flex-start;
	gap: ${({ theme }) => theme.spacing.sm};

	${({ theme, $variant }) => {
		const colors = {
			info: theme.colors.primary,
			success: theme.colors.status.success,
			warning: theme.colors.status.warning,
			danger: theme.colors.status.danger,
		};
		return `border-left-color: ${colors[$variant]}; background: linear-gradient(90deg, ${colors[$variant]}15 0%, transparent 100%);`;
	}}
`;

const IconWrapper = styled.div<{ $variant: NotificationVariant }>`
	width: 24px;
	height: 24px;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 50%;
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

export const Notification = forwardRef<HTMLDivElement, NotificationProps>(
	({ variant = "info", title, message, icon, onClose, ...props }, ref) => {
		const defaultIcons = {
			info: "ℹ",
			success: "✓",
			warning: "⚠",
			danger: "✕",
		};

		return (
			<NotificationContainer ref={ref} $variant={variant} {...props}>
				<IconWrapper $variant={variant}>{icon || defaultIcons[variant]}</IconWrapper>
				<Content>
					<Title>{title}</Title>
					{message && <Message>{message}</Message>}
				</Content>
				{onClose && (
					<CloseButton onClick={onClose} aria-label="Close">
						×
					</CloseButton>
				)}
			</NotificationContainer>
		);
	}
);

Notification.displayName = "Notification";

export default Notification;
