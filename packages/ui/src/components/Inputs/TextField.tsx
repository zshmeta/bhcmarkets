import { forwardRef, useState, type InputHTMLAttributes, type ReactNode } from "react";
import styled, { css } from "styled-components";

export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
	label?: string;
	error?: string;
	helperText?: string;
	showValidation?: boolean;
	icon?: ReactNode;
	iconPosition?: "left" | "right";
	fullWidth?: boolean;
	variant?: "outlined" | "filled";
	inputSize?: "sm" | "md" | "lg";
}

const InputWrapper = styled.div<{ $fullWidth: boolean }>`
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
	transition: color 0.2s ease;
`;

const InputContainer = styled.div`
	position: relative;
	display: flex;
	align-items: center;
	width: 100%;
`;

const sizeStyles = css<{ $inputSize: "sm" | "md" | "lg" }>`
	${({ theme, $inputSize }) => {
		switch ($inputSize) {
			case "sm":
				return css`
					height: 36px;
					padding: 0 ${theme.spacing.sm};
					font-size: ${theme.typography.sizes.sm};
				`;
			case "lg":
				return css`
					height: 52px;
					padding: 0 ${theme.spacing.lg};
					font-size: ${theme.typography.sizes.md};
				`;
			case "md":
			default:
				return css`
					height: 44px;
					padding: 0 ${theme.spacing.md};
					font-size: ${theme.typography.sizes.base};
				`;
		}
	}}
`;

const variantStyles = css<{ $variant: "outlined" | "filled" }>`
	${({ theme, $variant }) => {
		if ($variant === "filled") {
			return css`
				background: ${theme.colors.backgrounds.elevated};
				border: 2px solid transparent;

				&:hover:not(:disabled) {
					background: ${theme.colors.backgrounds.surface};
				}

				&:focus {
					background: ${theme.colors.backgrounds.surface};
				}
			`;
		}
		return css`
			background: ${theme.colors.backgrounds.surface};
			border: 2px solid ${theme.colors.border.default};

			&:hover:not(:disabled) {
				border-color: ${theme.colors.border.accent};
			}
		`;
	}}
`;

const StyledInput = styled.input<{
	$hasError: boolean;
	$isValid: boolean;
	$variant: "outlined" | "filled";
	$inputSize: "sm" | "md" | "lg";
	$hasIcon: boolean;
	$iconPosition: "left" | "right";
}>`
	width: 100%;
	font-family: ${({ theme }) => theme.typography.fontFamily};
	color: ${({ theme }) => theme.colors.text.primary};
	border-radius: ${({ theme }) => theme.radii.md};
	transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
	outline: none;

	${sizeStyles}
	${variantStyles}

	${({ $hasIcon, $iconPosition, theme }) =>
		$hasIcon &&
		css`
			${$iconPosition === "left" &&
			css`
				padding-left: ${theme.spacing.xxxl};
			`}
			${$iconPosition === "right" &&
			css`
				padding-right: ${theme.spacing.xxxl};
			`}
		`}

	${({ $hasError, theme }) =>
		$hasError &&
		css`
			border-color: ${theme.colors.status.danger};

			&:focus {
				border-color: ${theme.colors.status.danger};
			}
		`}

	${({ $isValid, theme }) =>
		$isValid &&
		css`
			border-color: ${theme.colors.status.success};
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
`;

const IconWrapper = styled.span<{ $position: "left" | "right"; $type: "icon" | "status" }>`
	position: absolute;
	${({ $position, theme }) =>
		$position === "left"
			? css`
					left: ${theme.spacing.md};
			  `
			: css`
					right: ${theme.spacing.md};
			  `}
	display: flex;
	align-items: center;
	justify-content: center;
	pointer-events: none;
	color: ${({ theme, $type }) =>
		$type === "status" ? "currentColor" : theme.colors.text.tertiary};
	font-size: 18px;
	transition: color 0.2s ease;
`;

const HelpText = styled.span<{ $isError: boolean }>`
	font-size: ${({ theme }) => theme.typography.sizes.xs};
	color: ${({ theme, $isError }) =>
		$isError ? theme.colors.status.danger : theme.colors.text.tertiary};
	line-height: ${({ theme }) => theme.typography.lineHeights.snug};
	display: flex;
	align-items: center;
	gap: ${({ theme }) => theme.spacing.xxs};
`;

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
	(
		{
			label,
			error,
			helperText,
			showValidation = false,
			icon,
			iconPosition = "left",
			fullWidth = true,
			variant = "outlined",
			inputSize = "md",
			value,
			onChange,
			required,
			...props
		},
		ref
	) => {
		const [localValue, setLocalValue] = useState("");
		const [isFocused, setIsFocused] = useState(false);

		const currentValue = value !== undefined ? String(value) : localValue;
		const hasError = Boolean(error);
		const isValid =
			showValidation && currentValue.length > 0 && !hasError && isFocused === false;

		const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
			setLocalValue(e.target.value);
			onChange?.(e);
		};

		const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
			setIsFocused(true);
			props.onFocus?.(e);
		};

		const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
			setIsFocused(false);
			props.onBlur?.(e);
		};

		return (
			<InputWrapper $fullWidth={fullWidth}>
				{label && (
					<Label>
						{label}
						{required && <span style={{ color: "#FF5A5F", marginLeft: "2px" }}>*</span>}
					</Label>
				)}
				<InputContainer>
					<StyledInput
						ref={ref}
						value={currentValue}
						onChange={handleChange}
						onFocus={handleFocus}
						onBlur={handleBlur}
						$hasError={hasError}
						$isValid={isValid}
						$variant={variant}
						$inputSize={inputSize}
						$hasIcon={Boolean(icon)}
						$iconPosition={iconPosition}
						required={required}
						{...props}
					/>
					{icon && <IconWrapper $position={iconPosition} $type="icon">{icon}</IconWrapper>}
					{showValidation && currentValue.length > 0 && !icon && (
						<IconWrapper $position="right" $type="status">
							{isValid ? (
								<span style={{ color: "#3BCF7C" }}>✓</span>
							) : hasError ? (
								<span style={{ color: "#FF5A5F" }}>✕</span>
							) : null}
						</IconWrapper>
					)}
				</InputContainer>
				{(error || helperText) && (
					<HelpText $isError={hasError}>{error || helperText}</HelpText>
				)}
			</InputWrapper>
		);
	}
);

TextField.displayName = "TextField";

export default TextField;
