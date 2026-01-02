import {
	forwardRef,
	useState,
	useRef,
	useEffect,
	type HTMLAttributes,
	type ReactNode,
} from "react";
import styled, { css } from "styled-components";

type PopoverPlacement = "top" | "bottom" | "left" | "right" | "top-start" | "top-end" | "bottom-start" | "bottom-end";
type PopoverTrigger = "click" | "hover" | "focus";

export interface PopoverProps extends Omit<HTMLAttributes<HTMLDivElement>, 'content'> {
	trigger: ReactNode;
	content: ReactNode;
	placement?: PopoverPlacement;
	triggerType?: PopoverTrigger;
	offset?: number;
	arrow?: boolean;
	disabled?: boolean;
}

const PopoverContainer = styled.div`
	position: relative;
	display: inline-block;
`;

const PopoverContent = styled.div<{
	$visible: boolean;
	$placement: PopoverPlacement;
	$offset: number;
	$arrow: boolean;
}>`
	position: absolute;
	z-index: ${({ theme }) => theme.zIndices.dropdown};
	background: ${({ theme }) => theme.colors.backgrounds.elevated};
	border: 1px solid ${({ theme }) => theme.colors.border.default};
	border-radius: ${({ theme }) => theme.radii.lg};
	box-shadow: ${({ theme }) => theme.elevations.overlay};
	padding: ${({ theme }) => theme.spacing.md};
	backdrop-filter: blur(20px);
	opacity: ${({ $visible }) => ($visible ? 1 : 0)};
	visibility: ${({ $visible }) => ($visible ? "visible" : "hidden")};
	transform: ${({ $visible, $placement }) => {
		const translateMap: Record<string, string> = {
			top: "translateX(-50%) translateY(-8px)",
			bottom: "translateX(-50%) translateY(8px)",
			left: "translateY(-50%) translateX(-8px)",
			right: "translateY(-50%) translateX(8px)",
			"top-start": "translateY(-8px)",
			"top-end": "translateY(-8px)",
			"bottom-start": "translateY(8px)",
			"bottom-end": "translateY(8px)",
		};
		const hiddenTranslate = translateMap[$placement] || "translateX(-50%)";
		const visibleTranslate = hiddenTranslate.replace(/-?8px/g, "0px");
		return $visible ? visibleTranslate : hiddenTranslate;
	}};
	transition: opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1),
				visibility 0.2s cubic-bezier(0.4, 0, 0.2, 1),
				transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
	min-width: 200px;
	max-width: 320px;
	color: ${({ theme }) => theme.colors.text.secondary};
	font-size: ${({ theme }) => theme.typography.sizes.sm};
	line-height: ${({ theme }) => theme.typography.lineHeights.relaxed};

	${({ $placement, $offset }) => {
		const placementStyles: Record<string, ReturnType<typeof css>> = {
			top: css`
				bottom: calc(100% + ${$offset}px);
				left: 50%;
				transform-origin: bottom center;
			`,
			bottom: css`
				top: calc(100% + ${$offset}px);
				left: 50%;
				transform-origin: top center;
			`,
			left: css`
				right: calc(100% + ${$offset}px);
				top: 50%;
				transform-origin: right center;
			`,
			right: css`
				left: calc(100% + ${$offset}px);
				top: 50%;
				transform-origin: left center;
			`,
			"top-start": css`
				bottom: calc(100% + ${$offset}px);
				left: 0;
			`,
			"top-end": css`
				bottom: calc(100% + ${$offset}px);
				right: 0;
			`,
			"bottom-start": css`
				top: calc(100% + ${$offset}px);
				left: 0;
			`,
			"bottom-end": css`
				top: calc(100% + ${$offset}px);
				right: 0;
			`,
		};
		return placementStyles[$placement] || placementStyles.bottom;
	}}

	${({ $arrow, theme }) =>
		$arrow &&
		css`
			&::before {
				content: "";
				position: absolute;
				width: 0;
				height: 0;
				border: 6px solid transparent;
				${({ $placement }: { $placement: PopoverPlacement }) => {
					if ($placement.startsWith("top")) {
						return css`
							bottom: -12px;
							left: 50%;
							transform: translateX(-50%);
							border-top-color: ${theme.colors.backgrounds.elevated};
						`;
					} else if ($placement.startsWith("bottom")) {
						return css`
							top: -12px;
							left: 50%;
							transform: translateX(-50%);
							border-bottom-color: ${theme.colors.backgrounds.elevated};
						`;
					} else if ($placement === "left") {
						return css`
							right: -12px;
							top: 50%;
							transform: translateY(-50%);
							border-left-color: ${theme.colors.backgrounds.elevated};
						`;
					} else if ($placement === "right") {
						return css`
							left: -12px;
							top: 50%;
							transform: translateY(-50%);
							border-right-color: ${theme.colors.backgrounds.elevated};
						`;
					}
					return "";
				}}
			}
		`}
`;

const TriggerWrapper = styled.div`
	display: inline-block;
`;

export const Popover = forwardRef<HTMLDivElement, PopoverProps>(
	(
		{
			trigger,
			content,
			placement = "bottom",
			triggerType = "click",
			offset = 10,
			arrow = true,
			disabled = false,
			...props
		},
		ref
	) => {
		const [visible, setVisible] = useState(false);
		const containerRef = useRef<HTMLDivElement>(null);
		const timeoutRef = useRef<NodeJS.Timeout>();

		useEffect(() => {
			if (disabled) {
				setVisible(false);
				return;
			}

			const handleClickOutside = (event: MouseEvent) => {
				if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
					setVisible(false);
				}
			};

			if (visible && triggerType === "click") {
				document.addEventListener("mousedown", handleClickOutside);
				return () => document.removeEventListener("mousedown", handleClickOutside);
			}
		}, [visible, triggerType, disabled]);

		const handleTriggerClick = () => {
			if (triggerType === "click" && !disabled) {
				setVisible(!visible);
			}
		};

		const handleMouseEnter = () => {
			if (triggerType === "hover" && !disabled) {
				clearTimeout(timeoutRef.current);
				setVisible(true);
			}
		};

		const handleMouseLeave = () => {
			if (triggerType === "hover" && !disabled) {
				timeoutRef.current = setTimeout(() => setVisible(false), 100);
			}
		};

		const handleFocus = () => {
			if (triggerType === "focus" && !disabled) {
				setVisible(true);
			}
		};

		const handleBlur = () => {
			if (triggerType === "focus" && !disabled) {
				setVisible(false);
			}
		};

		return (
			<PopoverContainer
				ref={containerRef}
				onMouseEnter={handleMouseEnter}
				onMouseLeave={handleMouseLeave}
				{...props}
			>
				<TriggerWrapper
					onClick={handleTriggerClick}
					onFocus={handleFocus}
					onBlur={handleBlur}
				>
					{trigger}
				</TriggerWrapper>
				<PopoverContent
					$visible={visible}
					$placement={placement}
					$offset={offset}
					$arrow={arrow}
					onMouseEnter={() => triggerType === "hover" && clearTimeout(timeoutRef.current)}
				>
					{content}
				</PopoverContent>
			</PopoverContainer>
		);
	}
);

Popover.displayName = "Popover";

export default Popover;