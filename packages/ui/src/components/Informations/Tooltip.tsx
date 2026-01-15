import { forwardRef, useState, useRef, type ReactNode, type HTMLAttributes } from "react";
import styled from "styled-components";

type TooltipPlacement = "top" | "bottom" | "left" | "right";

export interface TooltipProps extends HTMLAttributes<HTMLDivElement> {
	children: ReactNode;
	content: ReactNode;
	placement?: TooltipPlacement;
	delay?: number;
}

const TooltipContainer = styled.div`
	position: relative;
	display: inline-block;
`;

const TooltipContent = styled.div<{ $visible: boolean; $placement: TooltipPlacement }>`
	position: absolute;
	z-index: \${({ theme }) => theme.zIndices.toast};
	background: \${({ theme }) => theme.colors.backgrounds.elevated};
	border: 1px solid \${({ theme }) => theme.colors.border.default};
	border-radius: \${({ theme }) => theme.radii.md};
	padding: \${({ theme }) => \`\${theme.spacing.xs} \${theme.spacing.sm}\`};
	font-size: \${({ theme }) => theme.typography.sizes.xs};
	color: \${({ theme }) => theme.colors.text.primary};
	white-space: nowrap;
	box-shadow: \${({ theme }) => theme.elevations.overlay};
	opacity: \${({ $visible }) => ($visible ? 1 : 0)};
	visibility: \${({ $visible }) => ($visible ? "visible" : "hidden")};
	transition: opacity 0.2s ease, visibility 0.2s ease;
	pointer-events: none;

	\${({ $placement }) => {
		switch ($placement) {
			case "top":
				return \`bottom: calc(100% + 8px); left: 50%; transform: translateX(-50%);\`;
			case "bottom":
				return \`top: calc(100% + 8px); left: 50%; transform: translateX(-50%);\`;
			case "left":
				return \`right: calc(100% + 8px); top: 50%; transform: translateY(-50%);\`;
			case "right":
				return \`left: calc(100% + 8px); top: 50%; transform: translateY(-50%);\`;
			default:
				return \`top: calc(100% + 8px); left: 50%; transform: translateX(-50%);\`;
		}
	}}
`;

export const Tooltip = forwardRef<HTMLDivElement, TooltipProps>(
	({ children, content, placement = "top", delay = 300, ...props }, ref) => {
		const [visible, setVisible] = useState(false);
		const timeoutRef = useRef<NodeJS.Timeout>();

		const handleMouseEnter = () => {
			timeoutRef.current = setTimeout(() => setVisible(true), delay);
		};

		const handleMouseLeave = () => {
			clearTimeout(timeoutRef.current);
			setVisible(false);
		};

		return (
			<TooltipContainer
				ref={ref}
				onMouseEnter={handleMouseEnter}
				onMouseLeave={handleMouseLeave}
				{...props}
			>
				{children}
				<TooltipContent $visible={visible} $placement={placement}>
					{content}
				</TooltipContent>
			</TooltipContainer>
		);
	}
);

Tooltip.displayName = "Tooltip";

export default Tooltip;
