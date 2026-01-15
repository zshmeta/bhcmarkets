/**
 * Sheet/Drawer Component
 *
 * Slide-in panel from any edge of the screen.
 * Commonly used for mobile navigation, filters, or secondary content.
 */

import {
	forwardRef,
	useEffect,
	useCallback,
	type HTMLAttributes,
	type ReactNode,
} from "react";
import styled, { css, keyframes } from "styled-components";

type SheetSide = "left" | "right" | "top" | "bottom";
type SheetSize = "sm" | "md" | "lg" | "xl" | "full";

export interface SheetProps extends HTMLAttributes<HTMLDivElement> {
	/** Whether the sheet is open */
	open: boolean;
	/** Called when sheet should close */
	onClose?: () => void;
	/** Side from which the sheet slides in */
	side?: SheetSide;
	/** Size of the sheet */
	size?: SheetSize;
	/** Title displayed in header */
	title?: ReactNode;
	/** Description below title */
	description?: ReactNode;
	/** Footer content */
	footer?: ReactNode;
	/** Close on backdrop click */
	closeOnBackdrop?: boolean;
	/** Close on Escape key */
	closeOnEsc?: boolean;
	/** Show close button */
	showClose?: boolean;
	/** Custom width (overrides size) */
	width?: string;
	/** Modal mode (with backdrop) */
	modal?: boolean;
}

const fadeIn = keyframes`
	from { opacity: 0; }
	to { opacity: 1; }
`;

const fadeOut = keyframes`
	from { opacity: 1; }
	to { opacity: 0; }
`;

const slideInLeft = keyframes`
	from { transform: translateX(-100%); }
	to { transform: translateX(0); }
`;

const slideOutLeft = keyframes`
	from { transform: translateX(0); }
	to { transform: translateX(-100%); }
`;

const slideInRight = keyframes`
	from { transform: translateX(100%); }
	to { transform: translateX(0); }
`;

const slideOutRight = keyframes`
	from { transform: translateX(0); }
	to { transform: translateX(100%); }
`;

const slideInTop = keyframes`
	from { transform: translateY(-100%); }
	to { transform: translateY(0); }
`;

const slideOutTop = keyframes`
	from { transform: translateY(0); }
	to { transform: translateY(-100%); }
`;

const slideInBottom = keyframes`
	from { transform: translateY(100%); }
	to { transform: translateY(0); }
`;

const slideOutBottom = keyframes`
	from { transform: translateY(0); }
	to { transform: translateY(100%); }
`;

const sizeMap: Record<SheetSize, string> = {
	sm: "320px",
	md: "400px",
	lg: "560px",
	xl: "720px",
	full: "100%",
};

const Backdrop = styled.div<{ $open: boolean; $closing: boolean }>`
	position: fixed;
	inset: 0;
	z-index: ${({ theme }) => theme.zIndices.overlay};
	background: rgba(5, 11, 26, 0.6);
	backdrop-filter: blur(4px);

	${({ $open, $closing }) =>
		$open && !$closing
			? css`
					animation: ${fadeIn} 0.3s ease forwards;
			  `
			: css`
					animation: ${fadeOut} 0.3s ease forwards;
			  `}
`;

const SheetContainer = styled.div<{
	$open: boolean;
	$closing: boolean;
	$side: SheetSide;
	$size: string;
	$customWidth?: string;
}>`
	position: fixed;
	z-index: ${({ theme }) => theme.zIndices.modal};
	background: ${({ theme }) => theme.colors.backgrounds.elevated};
	display: flex;
	flex-direction: column;
	box-shadow: ${({ theme }) => theme.elevations.modal};

	${({ $side, $size, $customWidth }) => {
		const dimension = $customWidth || $size;

		switch ($side) {
			case "left":
				return css`
					top: 0;
					left: 0;
					bottom: 0;
					width: ${dimension};
					max-width: calc(100vw - 48px);
					border-right: 1px solid ${({ theme }) => theme.colors.border.subtle};
					border-radius: 0 ${({ theme }) => theme.radii.xl}
						${({ theme }) => theme.radii.xl} 0;
				`;
			case "right":
				return css`
					top: 0;
					right: 0;
					bottom: 0;
					width: ${dimension};
					max-width: calc(100vw - 48px);
					border-left: 1px solid ${({ theme }) => theme.colors.border.subtle};
					border-radius: ${({ theme }) => theme.radii.xl} 0 0
						${({ theme }) => theme.radii.xl};
				`;
			case "top":
				return css`
					top: 0;
					left: 0;
					right: 0;
					height: ${dimension};
					max-height: calc(100vh - 48px);
					border-bottom: 1px solid ${({ theme }) => theme.colors.border.subtle};
					border-radius: 0 0 ${({ theme }) => theme.radii.xl}
						${({ theme }) => theme.radii.xl};
				`;
			case "bottom":
				return css`
					bottom: 0;
					left: 0;
					right: 0;
					height: ${dimension};
					max-height: calc(100vh - 48px);
					border-top: 1px solid ${({ theme }) => theme.colors.border.subtle};
					border-radius: ${({ theme }) => theme.radii.xl}
						${({ theme }) => theme.radii.xl} 0 0;
				`;
		}
	}}

	${({ $open, $closing, $side }) => {
		const animations = {
			left: { in: slideInLeft, out: slideOutLeft },
			right: { in: slideInRight, out: slideOutRight },
			top: { in: slideInTop, out: slideOutTop },
			bottom: { in: slideInBottom, out: slideOutBottom },
		};

		const { in: animIn, out: animOut } = animations[$side];

		return $open && !$closing
			? css`
					animation: ${animIn} 0.3s cubic-bezier(0.32, 0.72, 0, 1) forwards;
			  `
			: css`
					animation: ${animOut} 0.3s cubic-bezier(0.32, 0.72, 0, 1) forwards;
			  `;
	}}
`;

const SheetHeader = styled.div`
	padding: ${({ theme }) => `${theme.spacing.lg} ${theme.spacing.xl}`};
	border-bottom: 1px solid ${({ theme }) => theme.colors.border.subtle};
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: ${({ theme }) => theme.spacing.md};
	flex-shrink: 0;
`;

const HeaderContent = styled.div`
	display: flex;
	flex-direction: column;
	gap: ${({ theme }) => theme.spacing.xxs};
`;

const SheetTitle = styled.h2`
	margin: 0;
	font-family: ${({ theme }) => theme.typography.fontFamily};
	font-size: ${({ theme }) => theme.typography.sizes.lg};
	font-weight: ${({ theme }) => theme.typography.weightBold};
	color: ${({ theme }) => theme.colors.text.primary};
	line-height: 1.3;
`;

const SheetDescription = styled.p`
	margin: 0;
	font-family: ${({ theme }) => theme.typography.fontFamily};
	font-size: ${({ theme }) => theme.typography.sizes.sm};
	color: ${({ theme }) => theme.colors.text.tertiary};
	line-height: 1.5;
`;

const CloseButton = styled.button`
	width: 32px;
	height: 32px;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: ${({ theme }) => theme.radii.md};
	background: rgba(255, 255, 255, 0.06);
	border: none;
	cursor: pointer;
	color: ${({ theme }) => theme.colors.text.tertiary};
	transition: all 0.2s ease;
	flex-shrink: 0;

	&:hover {
		background: rgba(255, 255, 255, 0.12);
		color: ${({ theme }) => theme.colors.text.primary};
	}

	&:focus-visible {
		outline: 2px solid ${({ theme }) => theme.colors.primary};
		outline-offset: 2px;
	}

	svg {
		width: 18px;
		height: 18px;
	}
`;

const SheetBody = styled.div`
	flex: 1;
	overflow-y: auto;
	padding: ${({ theme }) => theme.spacing.xl};

	/* Custom scrollbar */
	&::-webkit-scrollbar {
		width: 8px;
	}

	&::-webkit-scrollbar-track {
		background: transparent;
	}

	&::-webkit-scrollbar-thumb {
		background: ${({ theme }) => theme.colors.border.default};
		border-radius: ${({ theme }) => theme.radii.pill};
	}
`;

const SheetFooter = styled.div`
	padding: ${({ theme }) => `${theme.spacing.lg} ${theme.spacing.xl}`};
	border-top: 1px solid ${({ theme }) => theme.colors.border.subtle};
	display: flex;
	align-items: center;
	justify-content: flex-end;
	gap: ${({ theme }) => theme.spacing.sm};
	flex-shrink: 0;
`;

const CloseIcon = () => (
	<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
		<path d="M18 6L6 18M6 6l12 12" />
	</svg>
);

export const Sheet = forwardRef<HTMLDivElement, SheetProps>(
	(
		{
			open,
			onClose,
			side = "right",
			size = "md",
			title,
			description,
			footer,
			closeOnBackdrop = true,
			closeOnEsc = true,
			showClose = true,
			width,
			modal = true,
			children,
			...props
		},
		ref
	) => {
		const handleClose = useCallback(() => {
			onClose?.();
		}, [onClose]);

		// Handle Escape key
		useEffect(() => {
			if (!open || !closeOnEsc) return;

			const handleKeyDown = (e: KeyboardEvent) => {
				if (e.key === "Escape") {
					handleClose();
				}
			};

			document.addEventListener("keydown", handleKeyDown);
			return () => document.removeEventListener("keydown", handleKeyDown);
		}, [open, closeOnEsc, handleClose]);

		// Prevent body scroll when open
		useEffect(() => {
			if (open && modal) {
				const originalOverflow = document.body.style.overflow;
				document.body.style.overflow = "hidden";
				return () => {
					document.body.style.overflow = originalOverflow;
				};
			}
		}, [open, modal]);

		if (!open) return null;

		const sizeValue = sizeMap[size];
		const hasHeader = title || description || showClose;

		return (
			<>
				{modal && (
					<Backdrop
						$open={open}
						$closing={false}
						onClick={closeOnBackdrop ? handleClose : undefined}
						aria-hidden="true"
					/>
				)}
				<SheetContainer
					ref={ref}
					$open={open}
					$closing={false}
					$side={side}
					$size={sizeValue}
					$customWidth={width}
					role="dialog"
					aria-modal={modal}
					aria-labelledby={title ? "sheet-title" : undefined}
					aria-describedby={description ? "sheet-description" : undefined}
					{...props}
				>
					{hasHeader && (
						<SheetHeader>
							<HeaderContent>
								{title && <SheetTitle id="sheet-title">{title}</SheetTitle>}
								{description && (
									<SheetDescription id="sheet-description">
										{description}
									</SheetDescription>
								)}
							</HeaderContent>
							{showClose && (
								<CloseButton onClick={handleClose} aria-label="Close">
									<CloseIcon />
								</CloseButton>
							)}
						</SheetHeader>
					)}

					<SheetBody>{children}</SheetBody>

					{footer && <SheetFooter>{footer}</SheetFooter>}
				</SheetContainer>
			</>
		);
	}
);

Sheet.displayName = "Sheet";

export default Sheet;
