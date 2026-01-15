/**
 * OTP Input Component
 *
 * Secure input for one-time passwords and verification codes.
 * Supports auto-focus, paste handling, and various code lengths.
 */

import {
	forwardRef,
	useRef,
	useState,
	useEffect,
	useCallback,
	type KeyboardEvent,
	type ClipboardEvent,
	type FocusEvent,
} from "react";
import styled, { css, keyframes } from "styled-components";

export interface OTPInputProps {
	/** Number of digits */
	length?: number;
	/** Current value */
	value?: string;
	/** Change handler */
	onChange?: (value: string) => void;
	/** Called when all digits are entered */
	onComplete?: (value: string) => void;
	/** Disabled state */
	disabled?: boolean;
	/** Error state */
	error?: boolean;
	/** Error message */
	errorMessage?: string;
	/** Auto focus first input */
	autoFocus?: boolean;
	/** Mask input for security */
	secure?: boolean;
	/** Size variant */
	size?: "sm" | "md" | "lg";
	/** Input type */
	type?: "number" | "alphanumeric";
	/** Label text */
	label?: string;
	/** Placeholder character */
	placeholder?: string;
}

const shake = keyframes`
	0%, 100% { transform: translateX(0); }
	20%, 60% { transform: translateX(-4px); }
	40%, 80% { transform: translateX(4px); }
`;

const pulse = keyframes`
	0%, 100% { opacity: 1; }
	50% { opacity: 0.4; }
`;

const Container = styled.div`
	display: flex;
	flex-direction: column;
	gap: ${({ theme }) => theme.spacing.sm};
`;

const Label = styled.label`
	font-family: ${({ theme }) => theme.typography.fontFamily};
	font-size: ${({ theme }) => theme.typography.sizes.sm};
	font-weight: ${({ theme }) => theme.typography.weightMedium};
	color: ${({ theme }) => theme.colors.text.secondary};
`;

const InputContainer = styled.div<{ $error: boolean }>`
	display: flex;
	gap: ${({ theme }) => theme.spacing.sm};
	justify-content: center;

	${({ $error }) =>
		$error &&
		css`
			animation: ${shake} 0.4s ease-in-out;
		`}
`;

const sizeStyles = {
	sm: { width: "36px", height: "44px", fontSize: "1rem" },
	md: { width: "48px", height: "56px", fontSize: "1.25rem" },
	lg: { width: "56px", height: "64px", fontSize: "1.5rem" },
};

const InputCell = styled.input<{
	$size: "sm" | "md" | "lg";
	$error: boolean;
	$filled: boolean;
	$focused: boolean;
}>`
	width: ${({ $size }) => sizeStyles[$size].width};
	height: ${({ $size }) => sizeStyles[$size].height};
	padding: 0;
	text-align: center;
	font-family: ${({ theme }) => theme.typography.fontFamily};
	font-size: ${({ $size }) => sizeStyles[$size].fontSize};
	font-weight: ${({ theme }) => theme.typography.weightSemiBold};
	color: ${({ theme }) => theme.colors.text.primary};
	background: ${({ theme, $filled }) =>
		$filled ? theme.colors.backgrounds.elevated : theme.colors.backgrounds.surface};
	border: 2px solid
		${({ theme, $error, $focused, $filled }) => {
			if ($error) return theme.colors.status.danger;
			if ($focused) return theme.colors.primary;
			if ($filled) return theme.colors.border.accent;
			return theme.colors.border.default;
		}};
	border-radius: ${({ theme }) => theme.radii.md};
	outline: none;
	transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
	caret-color: ${({ theme }) => theme.colors.primary};

	&::placeholder {
		color: ${({ theme }) => theme.colors.text.muted};
		opacity: 0.4;
	}

	&:focus {
		box-shadow: 0 0 0 4px ${({ theme, $error }) =>
			$error ? "rgba(255, 90, 95, 0.15)" : theme.colors.focus};
		transform: scale(1.05);
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		background: ${({ theme }) => theme.colors.backgrounds.soft};
	}

	/* Hide number spinners */
	&::-webkit-outer-spin-button,
	&::-webkit-inner-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}
	&[type="number"] {
		-moz-appearance: textfield;
	}
`;

const ErrorMessage = styled.span`
	font-family: ${({ theme }) => theme.typography.fontFamily};
	font-size: ${({ theme }) => theme.typography.sizes.xs};
	color: ${({ theme }) => theme.colors.status.danger};
	display: flex;
	align-items: center;
	gap: ${({ theme }) => theme.spacing.xxs};
	justify-content: center;

	svg {
		width: 14px;
		height: 14px;
	}
`;

const HiddenInput = styled.input`
	position: absolute;
	opacity: 0;
	width: 0;
	height: 0;
	pointer-events: none;
`;

export const OTPInput = forwardRef<HTMLInputElement, OTPInputProps>(
	(
		{
			length = 6,
			value = "",
			onChange,
			onComplete,
			disabled = false,
			error = false,
			errorMessage,
			autoFocus = true,
			secure = false,
			size = "md",
			type = "number",
			label,
			placeholder = "○",
		},
		ref
	) => {
		const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
		const [focusedIndex, setFocusedIndex] = useState<number | null>(autoFocus ? 0 : null);
		const [localValue, setLocalValue] = useState<string[]>(
			value.split("").slice(0, length)
		);

		// Sync external value
		useEffect(() => {
			const newValue = value.split("").slice(0, length);
			setLocalValue(newValue);
		}, [value, length]);

		// Auto-focus
		useEffect(() => {
			if (autoFocus && inputRefs.current[0]) {
				inputRefs.current[0].focus();
			}
		}, [autoFocus]);

		const updateValue = useCallback(
			(newValue: string[]) => {
				setLocalValue(newValue);
				const joined = newValue.join("");
				onChange?.(joined);

				if (joined.length === length && newValue.every((v) => v)) {
					onComplete?.(joined);
				}
			},
			[onChange, onComplete, length]
		);

		const focusInput = (index: number) => {
			const clampedIndex = Math.max(0, Math.min(index, length - 1));
			inputRefs.current[clampedIndex]?.focus();
		};

		const handleChange = (index: number, inputValue: string) => {
			if (disabled) return;

			const isValidInput =
				type === "number"
					? /^\d*$/.test(inputValue)
					: /^[a-zA-Z0-9]*$/.test(inputValue);

			if (!isValidInput) return;

			const char = inputValue.slice(-1);
			const newValue = [...localValue];
			newValue[index] = char;
			updateValue(newValue);

			if (char && index < length - 1) {
				focusInput(index + 1);
			}
		};

		const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
			if (disabled) return;

			switch (e.key) {
				case "Backspace":
					e.preventDefault();
					const newValue = [...localValue];
					if (localValue[index]) {
						newValue[index] = "";
						updateValue(newValue);
					} else if (index > 0) {
						newValue[index - 1] = "";
						updateValue(newValue);
						focusInput(index - 1);
					}
					break;
				case "ArrowLeft":
					e.preventDefault();
					if (index > 0) focusInput(index - 1);
					break;
				case "ArrowRight":
					e.preventDefault();
					if (index < length - 1) focusInput(index + 1);
					break;
				case "Delete":
					e.preventDefault();
					const deleteValue = [...localValue];
					deleteValue[index] = "";
					updateValue(deleteValue);
					break;
			}
		};

		const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
			e.preventDefault();
			if (disabled) return;

			const pastedData = e.clipboardData.getData("text/plain").trim();
			const isValidPaste =
				type === "number"
					? /^\d+$/.test(pastedData)
					: /^[a-zA-Z0-9]+$/.test(pastedData);

			if (!isValidPaste) return;

			const chars = pastedData.slice(0, length).split("");
			const newValue = [...localValue];
			chars.forEach((char, i) => {
				if (i < length) newValue[i] = char;
			});
			updateValue(newValue);

			// Focus last filled or next empty
			const nextIndex = Math.min(chars.length, length - 1);
			focusInput(nextIndex);
		};

		const handleFocus = (index: number, e: FocusEvent<HTMLInputElement>) => {
			setFocusedIndex(index);
			e.target.select();
		};

		const handleBlur = () => {
			setFocusedIndex(null);
		};

		return (
			<Container>
				{label && <Label>{label}</Label>}

				<HiddenInput
					ref={ref}
					type="text"
					value={localValue.join("")}
					readOnly
					tabIndex={-1}
				/>

				<InputContainer $error={error}>
					{Array.from({ length }).map((_, index) => (
						<InputCell
							key={index}
							ref={(el) => {
								inputRefs.current[index] = el;
							}}
							type={type === "number" ? "tel" : "text"}
							inputMode={type === "number" ? "numeric" : "text"}
							maxLength={2}
							value={secure && localValue[index] ? "●" : localValue[index] || ""}
							placeholder={placeholder}
							disabled={disabled}
							$size={size}
							$error={error}
							$filled={Boolean(localValue[index])}
							$focused={focusedIndex === index}
							onChange={(e) => handleChange(index, e.target.value)}
							onKeyDown={(e) => handleKeyDown(index, e)}
							onPaste={handlePaste}
							onFocus={(e) => handleFocus(index, e)}
							onBlur={handleBlur}
							autoComplete="one-time-code"
							aria-label={`Digit ${index + 1} of ${length}`}
						/>
					))}
				</InputContainer>

				{errorMessage && (
					<ErrorMessage>
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
							<circle cx="12" cy="12" r="10" />
							<path d="M12 8v4M12 16h.01" />
						</svg>
						{errorMessage}
					</ErrorMessage>
				)}
			</Container>
		);
	}
);

OTPInput.displayName = "OTPInput";

export default OTPInput;
