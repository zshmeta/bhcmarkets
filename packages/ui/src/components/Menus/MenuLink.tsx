import { forwardRef, type AnchorHTMLAttributes, type ElementType, type ReactNode } from "react";
import styled, { css } from "styled-components";

type MenuLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
	icon?: ReactNode;
	label: ReactNode;
	active?: boolean;
	as?: ElementType;
	to?: string;
	end?: boolean;
	badge?: ReactNode;
};

const StyledMenuLink = styled.a<{ $active: boolean }>`
	position: relative;
	display: flex;
	align-items: center;
	gap: ${({ theme }) => theme.spacing.sm};
	padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md}`};
	color: ${({ theme, $active }) =>
		$active ? theme.colors.text.primary : theme.colors.text.tertiary};
	text-decoration: none;
	border-radius: ${({ theme }) => theme.radii.md};
	font-family: ${({ theme }) => theme.typography.fontFamily};
	font-weight: ${({ theme, $active }) =>
		$active ? theme.typography.weightSemiBold : theme.typography.weightMedium};
	font-size: ${({ theme }) => theme.typography.sizes.sm};
	letter-spacing: 0.01em;
	transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
	isolation: isolate;
	overflow: hidden;

	${({ $active, theme }) =>
		$active &&
		css`
			background: ${theme.gradients.primarySoft};
			box-shadow: inset 0 0 0 1px ${theme.colors.border.accent};
		`}

	&:hover {
		background: ${({ $active, theme }) =>
			$active ? theme.gradients.primarySoft : "rgba(255, 255, 255, 0.06)"};
		color: ${({ theme }) => theme.colors.text.primary};
		transform: translateX(2px);
	}

	&:focus-visible {
		outline: none;
		box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.focus};
	}

	&[data-active="true"],
	&[aria-current="page"] {
		color: ${({ theme }) => theme.colors.text.primary};
		background: ${({ theme }) => theme.gradients.primarySoft};
		box-shadow: inset 0 0 0 1px ${({ theme }) => theme.colors.border.accent};
	}

	&::before {
		content: "";
		position: absolute;
		left: 0;
		top: 50%;
		transform: translateY(-50%);
		width: 3px;
		height: 20px;
		border-radius: ${({ theme }) => theme.radii.pill};
		background: ${({ theme }) => theme.gradients.primary};
		opacity: ${({ $active }) => ($active ? 1 : 0)};
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
	}

	&[data-active="true"]::before,
	&[aria-current="page"]::before {
		opacity: 1;
	}
`;

const IconWrapper = styled.span`
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 18px;
	line-height: 1;
`;

const Label = styled.span`
	flex: 1;
`;

const Badge = styled.span`
	display: flex;
	align-items: center;
	justify-content: center;
	min-width: 20px;
	height: 20px;
	padding: 0 6px;
	background: ${({ theme }) => theme.gradients.primary};
	color: ${({ theme }) => theme.colors.text.onAccent};
	font-size: ${({ theme }) => theme.typography.sizes.xs};
	font-weight: ${({ theme }) => theme.typography.weightBold};
	border-radius: ${({ theme }) => theme.radii.pill};
`;

export const MenuLink = forwardRef<HTMLAnchorElement, MenuLinkProps>(
	({ icon, label, active = false, badge, ...props }, ref) => (
		<StyledMenuLink
			ref={ref}
			$active={active}
			data-active={active ? "true" : undefined}
			{...props}
		>
			{icon && <IconWrapper>{icon}</IconWrapper>}
			<Label>{label}</Label>
			{badge && <Badge>{badge}</Badge>}
		</StyledMenuLink>
	)
);

MenuLink.displayName = "MenuLink";

export default MenuLink;
