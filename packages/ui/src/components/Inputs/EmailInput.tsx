import { forwardRef, useState, type InputHTMLAttributes } from "react";
import styled from "styled-components";

export interface EmailInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
	label?: string;
	error?: string;
	helpText?: string;
	showValidation?: boolean;
}

const InputWrapper = styled.div`
	display: flex;
	flex-direction: column;
	gap: \${({ theme }) => theme.spacing.xs};
	width: 100%;
`;

const Label = styled.label`
	font-family: \${({ theme }) => theme.typography.fontFamily};
	font-size: \${({ theme }) => theme.typography.sizes.sm};
	font-weight: \${({ theme }) => theme.typography.weightMedium};
	color: \${({ theme }) => theme.colors.text.secondary};
	text-transform: uppercase;
	letter-spacing: 0.05em;
`;

const InputContainer = styled.div`
	position: relative;
	display: flex;
	align-items: center;
`;

const StyledInput = styled.input<{ $hasError: boolean; $isValid: boolean }>`
	width: 100%;
	height: 44px;
	padding: 0 \${({ theme }) => theme.spacing.md};
	padding-right: \${({ theme }) => theme.spacing.xxxl};
	font-family: \${({ theme }) => theme.typography.fontFamily};
	font-size: \${({ theme }) => theme.typography.sizes.base};
	color: \${({ theme }) => theme.colors.text.primary};
	background: \${({ theme }) => theme.colors.backgrounds.surface};
	border: 2px solid \${({ theme, $hasError, $isValid }) =>
		$hasError
			? theme.colors.status.danger
			: $isValid
			? theme.colors.status.success
			: theme.colors.border.default};
	border-radius: \${({ theme }) => theme.radii.md};
	transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
	outline: none;

	&::placeholder {
		color: \${({ theme }) => theme.colors.text.muted};
		opacity: 0.6;
	}

	&:hover:not(:disabled) {
		border-color: \${({ theme }) => theme.colors.border.accent};
	}

	&:focus {
		border-color: \${({ theme, $hasError }) =>
			$hasError ? theme.colors.status.danger : theme.colors.primary};
		// Use the shared focus token to avoid hard-coded, non-theme colors.
		box-shadow: 0 0 0 4px ${({ theme }) => theme.colors.focus};
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		background: \${({ theme }) => theme.colors.backgrounds.soft};
	}
`;

const IconWrapper = styled.span<{ $type: 'icon' | 'status'; $status?: 'success' | 'danger' }>`
	position: absolute;
	right: \${({ theme }) => theme.spacing.md};
	display: flex;
	align-items: center;
	justify-content: center;
	pointer-events: none;
	color: ${({ theme, $type, $status }) => {
		if ($type !== 'status') return theme.colors.text.tertiary;
		return $status === 'success' ? theme.colors.status.success : theme.colors.status.danger;
	}};
	font-size: 18px;
`;

const HelpText = styled.span<{ $isError: boolean }>`
	font-size: \${({ theme }) => theme.typography.sizes.xs};
	color: \${({ theme, $isError }) =>
		$isError ? theme.colors.status.danger : theme.colors.text.tertiary};
	line-height: \${({ theme }) => theme.typography.lineHeights.snug};
`;

const isValidEmail = (email: string): boolean => {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
};

export const EmailInput = forwardRef<HTMLInputElement, EmailInputProps>(
	({ label, error, helpText, showValidation = false, value, onChange, ...props }, ref) => {
		const [localValue, setLocalValue] = useState('');
		const currentValue = value !== undefined ? String(value) : localValue;
		const hasError = Boolean(error);
		const isValid = showValidation && currentValue.length > 0 && isValidEmail(currentValue);

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
						type="email"
						value={currentValue}
						onChange={handleChange}
						$hasError={hasError}
						$isValid={isValid}
						{...props}
					/>
					{showValidation && currentValue.length > 0 && (
						<IconWrapper
							$type="status"
							$status={isValid ? 'success' : 'danger'}
						>
							{isValid ? (
								<span style={{ color: 'currentColor' }}>✓</span>
							) : (
								<span style={{ color: 'currentColor' }}>✕</span>
							)}
						</IconWrapper>
					)}
					<IconWrapper $type="icon">@</IconWrapper>
				</InputContainer>
				{(error || helpText) && (
					<HelpText $isError={hasError}>{error || helpText}</HelpText>
				)}
			</InputWrapper>
		);
	}
);

EmailInput.displayName = "EmailInput";

export default EmailInput;
