import { forwardRef, useEffect, type HTMLAttributes, type ReactNode } from "react";
import styled, { css, keyframes } from "styled-components";

export interface ModalProps extends HTMLAttributes<HTMLDivElement> {
	open: boolean;
	onClose?: () => void;
	title?: ReactNode;
	footer?: ReactNode;
	size?: "sm" | "md" | "lg" | "xl" | "full";
	closeOnBackdrop?: boolean;
	closeOnEsc?: boolean;
	showClose?: boolean;
}

const fadeIn = keyframes`
	from { opacity: 0; }
	to { opacity: 1; }
`;

const slideUp = keyframes`
	from {
		transform: translateY(20px);
		opacity: 0;
	}
	to {
		transform: translateY(0);
		opacity: 1;
	}
`;

const Backdrop = styled.div<{ $open: boolean }>`
	position: fixed;
	inset: 0;
	z-index: ${({ theme }) => theme.zIndices.overlay};
	background: rgba(5, 11, 26, 0.75);
	backdrop-filter: blur(8px);
	display: flex;
	align-items: center;
	justify-content: center;
	padding: ${({ theme }) => theme.spacing.lg};
	opacity: ${({ $open }) => ($open ? 1 : 0)};
	visibility: ${({ $open }) => ($open ? "visible" : "hidden")};
	transition: opacity 0.3s ease, visibility 0.3s ease;

	animation: ${({ $open }) => ($open ? css`${fadeIn} 0.3s ease` : "none")};
`;

const ModalContainer = styled.div<{ $size: string; $open: boolean }>`
	position: relative;
	background: ${({ theme }) => theme.colors.backgrounds.elevated};
	border-radius: ${({ theme }) => theme.radii.xl};
	border: 1px solid ${({ theme }) => theme.colors.border.default};
	box-shadow: ${({ theme }) => theme.elevations.modal};
	max-height: 90vh;
	overflow: hidden;
	display: flex;
	flex-direction: column;
	animation: ${({ $open }) => ($open ? css`${slideUp} 0.3s cubic-bezier(0.4, 0, 0.2, 1)` : "none")};

	${({ $size }) => {
		const sizes = {
			sm: "400px",
			md: "600px",
			lg: "800px",
			xl: "1000px",
			full: "calc(100vw - 48px)",
		};
		
		return css`width: 100%; max-width: ${sizes[$size] || sizes.md};`;
	}}
`;

const ModalHeader = styled.div`
	padding: ${({ theme }) => `${theme.spacing.lg} ${theme.spacing.xl}`};
	border-bottom: 1px solid ${({ theme }) => theme.colors.border.subtle};
	display: flex;
	align-items: center;
	justify-content: space-between;
	background: linear-gradient(180deg, rgba(255, 255, 255, 0.03) 0%, transparent 100%);
`;

const ModalTitle = styled.h2`
	margin: 0;
	font-family: ${({ theme }) => theme.typography.fontFamily};
	font-size: ${({ theme }) => theme.typography.sizes.lg};
	font-weight: ${({ theme }) => theme.typography.weightBold};
	color: ${({ theme }) => theme.colors.text.primary};
`;

const CloseButton = styled.button`
	width: 32px;
	height: 32px;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 50%;
	background: rgba(255, 255, 255, 0.08);
	border: none;
	cursor: pointer;
	color: ${({ theme }) => theme.colors.text.tertiary};
	transition: all 0.2s ease;

	&:hover {
		background: rgba(255, 255, 255, 0.15);
		color: ${({ theme }) => theme.colors.text.primary};
	}
`;

const ModalBody = styled.div`
	padding: ${({ theme }) => theme.spacing.xl};
	overflow-y: auto;
	flex: 1;
	color: ${({ theme }) => theme.colors.text.secondary};
	line-height: ${({ theme }) => theme.typography.lineHeights.relaxed};
`;

const ModalFooter = styled.div`
	padding: ${({ theme }) => `${theme.spacing.lg} ${theme.spacing.xl}`};
	border-top: 1px solid ${({ theme }) => theme.colors.border.subtle};
	display: flex;
	align-items: center;
	justify-content: flex-end;
	gap: ${({ theme }) => theme.spacing.sm};
	background: linear-gradient(0deg, rgba(255, 255, 255, 0.03) 0%, transparent 100%);
`;

export const Modal = forwardRef<HTMLDivElement, ModalProps>(
	(
		{
			open,
			onClose,
			title,
			footer,
			size = "md",
			closeOnBackdrop = true,
			closeOnEsc = true,
			showClose = true,
			children,
			...props
		},
		ref
	) => {
		useEffect(() => {
			const handleEsc = (e: KeyboardEvent) => {
				if (e.key === "Escape" && closeOnEsc && open) {
					onClose?.();
				}
			};

			if (open) {
				document.addEventListener("keydown", handleEsc);
				document.body.style.overflow = "hidden";
				return () => {
					document.removeEventListener("keydown", handleEsc);
					document.body.style.overflow = "";
				};
			}
		}, [open, closeOnEsc, onClose]);

		const handleBackdropClick = (e: React.MouseEvent) => {
			if (e.target === e.currentTarget && closeOnBackdrop) {
				onClose?.();
			}
		};

		return (
			<Backdrop $open={open} onClick={handleBackdropClick}>
				<ModalContainer ref={ref} $size={size} $open={open} {...props}>
					{(title || showClose) && (
						<ModalHeader>
							{title && <ModalTitle>{title}</ModalTitle>}
							{showClose && (
								<CloseButton onClick={onClose} aria-label="Close modal">
									×
								</CloseButton>
							)}
						</ModalHeader>
					)}
					<ModalBody>{children}</ModalBody>
					{footer && <ModalFooter>{footer}</ModalFooter>}
				</ModalContainer>
			</Backdrop>
		);
	}
);

Modal.displayName = "Modal";

export default Modal;
