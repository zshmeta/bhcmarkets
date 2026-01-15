/**
 * TextArea Component
 *
 * Multi-line text input with auto-resize and character count.
 */

import {
	forwardRef,
	useState,
	useEffect,
	useRef,
	type TextareaHTMLAttributes,
	type ReactNode,
} from "react";
import styled, { css } from "styled-components";

export interface TextAreaProps
	extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "size"> {
	/** Label text */
	label?: string;
	/** Error message */
	error?: string;
	/** Helper text */
	helperText?: string;
	/** Show character count */
	showCount?: boolean;
	/** Maximum character count */
	maxLength?: number;
	/** Auto-resize based on content */
	autoResize?: boolean;
	/** Minimum rows */
	minRows?: number;
	/** Maximum rows */
	maxRows?: number;
	/** Visual variant */
	variant?: "outlined" | "filled";
	/** Full width */
	fullWidth?: boolean;
	/** Size variant */
	size?: "sm" | "md" | "lg";
	/** Left icon */
	icon?: ReactNode;
	/** Resize behavior */
	resize?: "none" | "vertical" | "horizontal" | "both";
}

const Container = styled.div<{ $fullWidth: boolean }>`
	display: flex;
	flex-direction: column;
	gap: ${({ theme }) => theme.spacing.xs};
	width: ${({ $fullWidth }) => ($fullWidth ? "100%" : "auto")};
`;

const Label = styled.label`
	font-family: ${({ theme }) => theme.typography.fontFamily};
	font-size: ${({ theme }) => theme.typography.sizes.sm};
	font-weight: ${({ theme }) => theme.typography.weightMedium};
	color: ${({ theme }) => theme.colors.text.secondary};
	letter-spacing: 0.02em;
`;

const InputWrapper = styled.div`
	position: relative;
	display: flex;
`;

const sizeStyles = {
	sm: { padding: "8px 12px", fontSize: "0.85rem", lineHeight: 1.4 },
	md: { padding: "12px 16px", fontSize: "0.95rem", lineHeight: 1.5 },
	lg: { padding: "16px 20px", fontSize: "1.05rem", lineHeight: 1.6 },
};

const StyledTextArea = styled.textarea<{
	$variant: "outlined" | "filled";
	$size: "sm" | "md" | "lg";
	$hasError: boolean;
	$resize: string;
	$hasIcon: boolean;
}>`
	width: 100%;
	padding: ${({ $size }) => sizeStyles[$size].padding};
	${({ $hasIcon, theme }) =>
		$hasIcon &&
		css`
			padding-left: ${theme.spacing.xxxl};
		`}
	font-family: ${({ theme }) => theme.typography.fontFamily};
	font-size: ${({ $size }) => sizeStyles[$size].fontSize};
	line-height: ${({ $size }) => sizeStyles[$size].lineHeight};
	color: ${({ theme }) => theme.colors.text.primary};
	border-radius: ${({ theme }) => theme.radii.md};
	outline: none;
	transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
	resize: ${({ $resize }) => $resize};

	${({ $variant, theme }) =>
		$variant === "filled"
			? css`
					background: ${theme.colors.backgrounds.elevated};
					border: 2px solid transparent;

					&:hover:not(:disabled) {
						background: ${theme.colors.backgrounds.surface};
					}
			  `
			: css`
					background: ${theme.colors.backgrounds.surface};
					border: 2px solid ${theme.colors.border.default};

					&:hover:not(:disabled) {
						border-color: ${theme.colors.border.accent};
					}
			  `}

	${({ $hasError, theme }) =>
		$hasError &&
		css`
			border-color: ${theme.colors.status.danger};
		`}

	&::placeholder {
		color: ${({ theme }) => theme.colors.text.muted};
		opacity: 0.6;
	}

	&:focus {
		border-color: ${({ theme, $hasError }) =>
			$hasError ? theme.colors.status.danger : theme.colors.primary};
		box-shadow: 0 0 0 4px
			${({ theme, $hasError }) =>
				$hasError ? "rgba(255, 90, 95, 0.15)" : theme.colors.focus};
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		background: ${({ theme }) => theme.colors.backgrounds.soft};
	}

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

const IconWrapper = styled.span`
	position: absolute;
	top: 12px;
	left: ${({ theme }) => theme.spacing.md};
	color: ${({ theme }) => theme.colors.text.tertiary};
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 18px;
	pointer-events: none;
`;

const Footer = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	min-height: 20px;
`;

const HelpText = styled.span<{ $isError: boolean }>`
	font-family: ${({ theme }) => theme.typography.fontFamily};
	font-size: ${({ theme }) => theme.typography.sizes.xs};
	color: ${({ theme, $isError }) =>
		$isError ? theme.colors.status.danger : theme.colors.text.tertiary};
	line-height: ${({ theme }) => theme.typography.lineHeights.snug};
`;

const CharCount = styled.span<{ $isOver: boolean }>`
	font-family: ${({ theme }) => theme.typography.fontFamily};
	font-size: ${({ theme }) => theme.typography.sizes.xs};
	color: ${({ theme, $isOver }) =>
		$isOver ? theme.colors.status.danger : theme.colors.text.muted};
	margin-left: auto;
	transition: color 0.2s ease;
`;

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
	(
		{
			label,
			error,
			helperText,
			showCount = false,
			maxLength,
			autoResize = false,
			minRows = 3,
			maxRows = 10,
			variant = "outlined",
			fullWidth = true,
			size = "md",
			icon,
			resize = "vertical",
			value,
			onChange,
			...props
		},
		ref
	) => {
		const innerRef = useRef<HTMLTextAreaElement>(null);
		const [charCount, setCharCount] = useState(0);

		const textareaRef = (ref as React.RefObject<HTMLTextAreaElement>) || innerRef;

		// Auto-resize logic
		useEffect(() => {
			if (!autoResize || !textareaRef.current) return;

			const textarea = textareaRef.current;
			const lineHeight = parseFloat(
				window.getComputedStyle(textarea).lineHeight
			);
			const paddingY =
				parseFloat(window.getComputedStyle(textarea).paddingTop) +
				parseFloat(window.getComputedStyle(textarea).paddingBottom);

			// Reset height to get accurate scrollHeight
			textarea.style.height = "auto";

			const minHeight = lineHeight * minRows + paddingY;
			const maxHeight = lineHeight * maxRows + paddingY;
			const newHeight = Math.min(
				Math.max(textarea.scrollHeight, minHeight),
				maxHeight
			);

			textarea.style.height = `${newHeight}px`;
		}, [value, autoResize, minRows, maxRows, textareaRef]);

		// Track character count
		useEffect(() => {
			const count =
				typeof value === "string" ? value.length : String(value || "").length;
			setCharCount(count);
		}, [value]);

		const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
			onChange?.(e);
		};

		const hasError = Boolean(error);
		const isOverLimit = maxLength ? charCount > maxLength : false;
		const helpMessage = error || helperText;

		return (
			<Container $fullWidth={fullWidth}>
				{label && <Label>{label}</Label>}

				<InputWrapper>
					{icon && <IconWrapper>{icon}</IconWrapper>}
					<StyledTextArea
						ref={textareaRef}
						value={value}
						onChange={handleChange}
						$variant={variant}
						$size={size}
						$hasError={hasError || isOverLimit}
						$resize={autoResize ? "none" : resize}
						$hasIcon={Boolean(icon)}
						rows={autoResize ? minRows : undefined}
						maxLength={maxLength}
						aria-invalid={hasError}
						aria-describedby={helpMessage ? "help-text" : undefined}
						{...props}
					/>
				</InputWrapper>

				{(helpMessage || showCount) && (
					<Footer>
						{helpMessage && (
							<HelpText id="help-text" $isError={hasError}>
								{helpMessage}
							</HelpText>
						)}
						{showCount && (
							<CharCount $isOver={isOverLimit}>
								{charCount}
								{maxLength && ` / ${maxLength}`}
							</CharCount>
						)}
					</Footer>
				)}
			</Container>
		);
	}
);

TextArea.displayName = "TextArea";

export default TextArea;
