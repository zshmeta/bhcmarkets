import { forwardRef, useState, type HTMLAttributes, type ReactNode } from "react";
import styled from "styled-components";

export interface TabItem {
	id: string;
	label: ReactNode;
	content: ReactNode;
	disabled?: boolean;
}

export interface TabsProps extends HTMLAttributes<HTMLDivElement> {
	items: TabItem[];
	defaultActive?: string;
	onChange?: (tabId: string) => void;
	variant?: "line" | "pills";
}

const TabsContainer = styled.div`
	display: flex;
	flex-direction: column;
	width: 100%;
`;

const TabsList = styled.div<{ $variant: string }>`
	display: flex;
	gap: ${({ theme, $variant }) => ($variant === "pills" ? theme.spacing.xs : "0")};
	border-bottom: ${({ theme, $variant }) =>
		$variant === "line" ? `2px solid ${theme.colors.border.subtle}` : "none"};
	position: relative;
`;

const Tab = styled.button<{ $active: boolean; $variant: string; $disabled: boolean }>`
	padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.lg}`};
	background: ${({ theme, $active, $variant }) =>
		$variant === "pills" && $active
			? theme.gradients.primarySoft
			: "transparent"};
	border: ${({ theme, $variant, $active }) =>
		$variant === "pills"
			? $active
				? `1px solid ${theme.colors.border.accent}`
				: "1px solid transparent"
			: "none"};
	border-radius: ${({ theme, $variant }) =>
		$variant === "pills" ? theme.radii.md : "0"};
	color: ${({ theme, $active, $disabled }) =>
		$disabled
			? theme.colors.text.muted
			: $active
			? theme.colors.text.primary
			: theme.colors.text.tertiary};
	font-family: ${({ theme }) => theme.typography.fontFamily};
	font-size: ${({ theme }) => theme.typography.sizes.sm};
	font-weight: ${({ theme, $active }) =>
		$active ? theme.typography.weightSemiBold : theme.typography.weightMedium};
	cursor: ${({ $disabled }) => ($disabled ? "not-allowed" : "pointer")};
	position: relative;
	transition: all 0.2s ease;
	white-space: nowrap;
	opacity: ${({ $disabled }) => ($disabled ? 0.5 : 1)};

	&:hover:not(:disabled) {
		color: ${({ theme }) => theme.colors.text.primary};
		background: ${({ theme, $variant }) =>
			$variant === "pills" ? "rgba(255, 255, 255, 0.05)" : "transparent"};
	}

	${({ $variant, $active, theme }) =>
		$variant === "line" &&
		$active && `
			&::after {
				content: "";
				position: absolute;
				bottom: -2px;
				left: 0;
				right: 0;
				height: 2px;
				background: \${theme.gradients.primary};
				border-radius: 2px 2px 0 0;
			}
		`}
`;

const TabContent = styled.div`
	padding: ${({ theme }) => theme.spacing.lg};
`;

export const Tabs = forwardRef<HTMLDivElement, TabsProps>(
	({ items, defaultActive, onChange, variant = "line", ...props }, ref) => {
		const [activeTab, setActiveTab] = useState(defaultActive || items[0]?.id);

		const handleTabChange = (tabId: string) => {
			setActiveTab(tabId);
			onChange?.(tabId);
		};

		const activeItem = items.find((item) => item.id === activeTab);

		return (
			<TabsContainer ref={ref} {...props}>
				<TabsList $variant={variant}>
					{items.map((item) => (
						<Tab
							key={item.id}
							$active={activeTab === item.id}
							$variant={variant}
							$disabled={Boolean(item.disabled)}
							disabled={item.disabled}
							onClick={() => !item.disabled && handleTabChange(item.id)}
						>
							{item.label}
						</Tab>
					))}
				</TabsList>
				{activeItem && <TabContent>{activeItem.content}</TabContent>}
			</TabsContainer>
		);
	}
);

Tabs.displayName = "Tabs";

export default Tabs;
