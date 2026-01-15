import React from "react";
import { forwardRef, useState, type InputHTMLAttributes } from "react";
import styled from "styled-components";
import { toRgba } from "../../theme/tokens";

export interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
	label?: string;
	error?: string;
	helpText?: string;
	showStrength?: boolean;
}

const InputWrapper = styled.div`
	display: flex;
	flex-direction: column;
	gap: ${({ theme }) => theme.spacing.xs};
	width: 100%;
`;

const Label = styled.label`
	font-family: ${({ theme }) => theme.typography.fontFamily};
	font-size: ${({ theme }) => theme.typography.sizes.sm};
	font-weight: ${({ theme }) => theme.typography.weightMedium};
	color: ${({ theme }) => theme.colors.text.secondary};
	text-transform: uppercase;
	letter-spacing: 0.05em;
`;

const InputContainer = styled.div`
	position: relative;
	display: flex;
	align-items: center;
`;

const StyledInput = styled.input<{ $hasError: boolean }>`
	width: 100%;
	height: 44px;
	padding: 0 ${({ theme }) => theme.spacing.md};
	padding-right: ${({ theme }) => theme.spacing.xxxl};
	font-family: ${({ theme }) => theme.typography.fontFamily};
	font-size: ${({ theme }) => theme.typography.sizes.base};
	color: ${({ theme }) => theme.colors.text.primary};
	background: ${({ theme }) => theme.colors.backgrounds.surface};
	border: 2px solid ${({ theme, $hasError }) =>
		$hasError ? theme.colors.status.danger : theme.colors.border.default};
	border-radius: ${({ theme }) => theme.radii.md};
	transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
	outline: none;

	&::placeholder {
		color: ${({ theme }) => theme.colors.text.muted};
		opacity: 0.6;
	}

	&:hover:not(:disabled) {
		border-color: ${({ theme }) => theme.colors.border.accent};
	}

	&:focus {
		border-color: ${({ theme, $hasError }) =>
			$hasError ? theme.colors.status.danger : theme.colors.primary};
		box-shadow: 0 0 0 4px ${({ theme, $hasError }) =>
			$hasError ? toRgba(theme.colors.status.danger, 0.22) : theme.colors.focus};
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		background: ${({ theme }) => theme.colors.backgrounds.soft};
	}
`;

const ToggleButton = styled.button`
	position: absolute;
	right: ${({ theme }) => theme.spacing.md};
	display: flex;
	align-items: center;
	justify-content: center;
	width: 32px;
	height: 32px;
	background: transparent;
	border: none;
	cursor: pointer;
	color: ${({ theme }) => theme.colors.text.tertiary};
	transition: color 0.2s ease;

	&:hover {
		color: ${({ theme }) => theme.colors.text.primary};
	}
`;

const StrengthBar = styled.div<{ $strength: number }>`
	height: 4px;
	width: 100%;
	background: rgba(255, 255, 255, 0.08);
	border-radius: ${({ theme }) => theme.radii.pill};
	overflow: hidden;

	&::after {
		content: "";
		display: block;
		height: 100%;
		width: ${({ $strength }) => $strength}%;
		background: ${({ $strength, theme }) =>
			$strength < 33
				? theme.colors.status.danger
				: $strength < 67
				? theme.colors.status.warning
				: theme.colors.status.success};
		transition: width 0.3s ease, background 0.3s ease;
	}
`;

const HelpText = styled.span<{ $isError: boolean }>`
	font-size: ${({ theme }) => theme.typography.sizes.xs};
	color: ${({ theme, $isError }) =>
		$isError ? theme.colors.status.danger : theme.colors.text.tertiary};
	line-height: ${({ theme }) => theme.typography.lineHeights.snug};
`;

const calculateStrength = (password: string): number => {
	let strength = 0;
	if (password.length >= 8) strength += 25;
	if (/[a-z]/.test(password)) strength += 25;
	if (/[A-Z]/.test(password)) strength += 25;
	if (/[0-9]/.test(password)) strength += 15;
	if (/[^a-zA-Z0-9]/.test(password)) strength += 10;
	return Math.min(strength, 100);
};

const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
	({ label, error, helpText, showStrength = false, value, onChange, ...props }, ref) => {
		const [showPassword, setShowPassword] = useState(false);
		const [localValue, setLocalValue] = useState('');
		const currentValue = value !== undefined ? String(value) : localValue;
		const strength = showStrength ? calculateStrength(currentValue) : 0;

		const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
			setLocalValue(e.target.value);
			onChange?.(e);
		};

		return (
			<InputWrapper>
				{label && <Label>{label}</Label>}
				<InputContainer>
					<StyledInput
						ref={ref}
						type={showPassword ? "text" : "password"}
						value={currentValue}
						onChange={handleChange}
						$hasError={Boolean(error)}
						{...props}
					/>
					<ToggleButton
						type="button"
						onClick={() => setShowPassword(!showPassword)}
						aria-label={showPassword ? "Hide password" : "Show password"}
					>
						{showPassword ? "🙈" : "👁"}
					</ToggleButton>
				</InputContainer>
				{showStrength && currentValue.length > 0 && <StrengthBar $strength={strength} />}
				{(error || helpText) && (
					<HelpText $isError={Boolean(error)}>{error || helpText}</HelpText>
				)}
			</InputWrapper>
		);
	}
);

PasswordInput.displayName = "PasswordInput";

export default PasswordInput;
