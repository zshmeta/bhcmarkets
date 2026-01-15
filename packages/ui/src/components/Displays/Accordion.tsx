import { forwardRef, useState, type HTMLAttributes, type ReactNode } from "react";
import styled, { css } from "styled-components";

export interface AccordionItemData {
	id: string;
	title: ReactNode;
	content: ReactNode;
	defaultExpanded?: boolean;
	disabled?: boolean;
}

export interface AccordionProps extends Omit<HTMLAttributes<HTMLDivElement>, 'content'> {
	items: AccordionItemData[];
	multiple?: boolean;
	divided?: boolean;
}

const AccordionContainer = styled.div<{ $divided: boolean }>`
	border-radius: ${({ theme }) => theme.radii.lg};
	overflow: hidden;
	background: ${({ theme }) => theme.colors.backgrounds.surface};
	border: 1px solid ${({ theme }) => theme.colors.border.subtle};

	${({ $divided }) =>
		!$divided &&
		css`
			& > *:not(:last-child) {
				border-bottom: 1px solid ${({ theme }) => theme.colors.border.subtle};
			}
		`}
`;

const AccordionItem = styled.div<{ $divided: boolean }>`
	${({ $divided, theme }) =>
		$divided &&
		css`
			margin-bottom: ${theme.spacing.xs};
			border-radius: ${theme.radii.md};
			border: 1px solid ${theme.colors.border.subtle};
			overflow: hidden;
		`}
`;

const AccordionHeader = styled.button<{ $expanded: boolean; $disabled: boolean }>`
	width: 100%;
	padding: ${({ theme }) => `${theme.spacing.md} ${theme.spacing.lg}`};
	background: ${({ theme, $expanded }) =>
		$expanded
			? `linear-gradient(135deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.02) 100%)`
			: "transparent"};
	border: none;
	text-align: left;
	cursor: ${({ $disabled }) => ($disabled ? "not-allowed" : "pointer")};
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: ${({ theme }) => theme.spacing.md};
	color: ${({ theme, $disabled }) =>
		$disabled ? theme.colors.text.muted : theme.colors.text.primary};
	font-family: ${({ theme }) => theme.typography.fontFamily};
	font-weight: ${({ theme }) => theme.typography.weightSemiBold};
	font-size: ${({ theme }) => theme.typography.sizes.base};
	transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
	opacity: ${({ $disabled }) => ($disabled ? 0.5 : 1)};

	&:hover:not(:disabled) {
		background: rgba(255, 255, 255, 0.08);
	}

	&:focus-visible {
		outline: none;
		box-shadow: inset 0 0 0 2px ${({ theme }) => theme.colors.focus};
	}
`;

const AccordionIcon = styled.span<{ $expanded: boolean }>`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 20px;
	height: 20px;
	color: ${({ theme }) => theme.colors.text.secondary};
	transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	transform: ${({ $expanded }) => ($expanded ? "rotate(180deg)" : "rotate(0deg)")};

	&::before {
		content: "▼";
		font-size: 10px;
	}
`;

const AccordionContent = styled.div<{ $expanded: boolean }>`
	overflow: hidden;
	max-height: ${({ $expanded }) => ($expanded ? "1000px" : "0")};
	transition: max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1);
`;

const AccordionContentInner = styled.div`
	padding: ${({ theme }) => `${theme.spacing.md} ${theme.spacing.lg} ${theme.spacing.lg}`};
	color: ${({ theme }) => theme.colors.text.secondary};
	line-height: ${({ theme }) => theme.typography.lineHeights.relaxed};
	font-size: ${({ theme }) => theme.typography.sizes.sm};
`;

interface ItemProps {
	item: AccordionItemData;
	expanded: boolean;
	onToggle: () => void;
	divided: boolean;
}

const AccordionItemComponent = ({ item, expanded, onToggle, divided }: ItemProps) => (
	<AccordionItem $divided={divided}>
		<AccordionHeader
			$expanded={expanded}
			$disabled={item.disabled || false}
			onClick={onToggle}
			disabled={item.disabled}
			aria-expanded={expanded}
			aria-disabled={item.disabled}
		>
			<span>{item.title}</span>
			<AccordionIcon $expanded={expanded} aria-hidden />
		</AccordionHeader>
		<AccordionContent $expanded={expanded}>
			<AccordionContentInner>{item.content}</AccordionContentInner>
		</AccordionContent>
	</AccordionItem>
);

export const Accordion = forwardRef<HTMLDivElement, AccordionProps>(
	({ items, multiple = false, divided = false, ...props }, ref) => {
		const [expandedItems, setExpandedItems] = useState<Set<string>>(
			new Set(items.filter((item) => item.defaultExpanded).map((item) => item.id))
		);

		const handleToggle = (id: string) => {
			setExpandedItems((prev) => {
				const next = new Set(prev);
				if (next.has(id)) {
					next.delete(id);
				} else {
					if (!multiple) {
						next.clear();
					}
					next.add(id);
				}
				return next;
			});
		};

		return (
			<AccordionContainer ref={ref} $divided={divided} {...props}>
				{items.map((item) => (
					<AccordionItemComponent
						key={item.id}
						item={item}
						expanded={expandedItems.has(item.id)}
						onToggle={() => handleToggle(item.id)}
						divided={divided}
					/>
				))}
			</AccordionContainer>
		);
	}
);

Accordion.displayName = "Accordion";

export default Accordion;