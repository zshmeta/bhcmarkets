import { forwardRef, useState, useRef, useEffect, type HTMLAttributes, type ReactNode } from "react";
import styled from "styled-components";

export interface DropdownItem {
	id: string;
	label: ReactNode;
	icon?: ReactNode;
	disabled?: boolean;
	onClick?: () => void;
}

export interface DropdownProps extends HTMLAttributes<HTMLDivElement> {
	items: DropdownItem[];
	trigger: ReactNode;
	placement?: "bottom-start" | "bottom-end" | "top-start" | "top-end";
}

const DropdownContainer = styled.div`
	position: relative;
	display: inline-block;
`;

const Trigger = styled.div`
	cursor: pointer;
`;

const Menu = styled.div<{ $visible: boolean; $placement: string }>`
	position: absolute;
	z-index: ${({ theme }) => theme.zIndices.dropdown};
	min-width: 200px;
	background: ${({ theme }) => theme.colors.backgrounds.elevated};
	border: 1px solid ${({ theme }) => theme.colors.border.default};
	border-radius: ${({ theme }) => theme.radii.md};
	box-shadow: ${({ theme }) => theme.elevations.overlay};
	padding: ${({ theme }) => theme.spacing.xs};
	backdrop-filter: blur(12px);
	opacity: ${({ $visible }) => ($visible ? 1 : 0)};
	visibility: ${({ $visible }) => ($visible ? "visible" : "hidden")};
	transform: ${({ $visible }) => ($visible ? "translateY(0)" : "translateY(-8px)")};
	transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

	${({ $placement }) => {
		switch ($placement) {
			case "bottom-start":
				return "top: calc(100% + 4px); left: 0;";
			case "bottom-end":
				return "top: calc(100% + 4px); right: 0;";
			case "top-start":
				return "bottom: calc(100% + 4px); left: 0;";
			case "top-end":
				return "bottom: calc(100% + 4px); right: 0;";
			default:
				return "top: calc(100% + 4px); left: 0;";
		}
	}}
`;

const MenuItem = styled.button<{ $disabled: boolean }>`
	width: 100%;
	padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md}`};
	background: transparent;
	border: none;
	border-radius: ${({ theme }) => theme.radii.sm};
	cursor: ${({ $disabled }) => ($disabled ? "not-allowed" : "pointer")};
	display: flex;
	align-items: center;
	gap: ${({ theme }) => theme.spacing.sm};
	color: ${({ theme, $disabled }) =>
		$disabled ? theme.colors.text.muted : theme.colors.text.primary};
	font-size: ${({ theme }) => theme.typography.sizes.sm};
	text-align: left;
	transition: background 0.15s ease;
	opacity: ${({ $disabled }) => ($disabled ? 0.5 : 1)};

	&:hover:not(:disabled) {
		background: rgba(255, 255, 255, 0.08);
	}

	&:active:not(:disabled) {
		background: rgba(255, 255, 255, 0.12);
	}
`;

export const Dropdown = forwardRef<HTMLDivElement, DropdownProps>(
	({ items, trigger, placement = "bottom-start", ...props }, ref) => {
		const [visible, setVisible] = useState(false);
		const containerRef = useRef<HTMLDivElement>(null);

		useEffect(() => {
			const handleClickOutside = (e: MouseEvent) => {
				if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
					setVisible(false);
				}
			};

			if (visible) {
				document.addEventListener("mousedown", handleClickOutside);
				return () => document.removeEventListener("mousedown", handleClickOutside);
			}
		}, [visible]);

		return (
			<DropdownContainer ref={containerRef} {...props}>
				<Trigger onClick={() => setVisible(!visible)}>{trigger}</Trigger>
				<Menu $visible={visible} $placement={placement}>
					{items.map((item) => (
						<MenuItem
							key={item.id}
							$disabled={Boolean(item.disabled)}
							disabled={item.disabled}
							onClick={() => {
								if (!item.disabled) {
									item.onClick?.();
									setVisible(false);
								}
							}}
						>
							{item.icon && <span>{item.icon}</span>}
							{item.label}
						</MenuItem>
					))}
				</Menu>
			</DropdownContainer>
		);
	}
);

Dropdown.displayName = "Dropdown";

export default Dropdown;
