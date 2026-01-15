import { forwardRef, useState, type InputHTMLAttributes } from "react";
import styled from "styled-components";

export interface PhoneInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
	label?: string;
	error?: string;
	helpText?: string;
	defaultCountry?: string;
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
	display: flex;
	gap: ${({ theme }) => theme.spacing.xs};
`;

const CountrySelect = styled.select`
	height: 44px;
	padding: 0 ${({ theme }) => theme.spacing.md};
	font-family: ${({ theme }) => theme.typography.fontFamily};
	font-size: ${({ theme }) => theme.typography.sizes.base};
	color: ${({ theme }) => theme.colors.text.primary};
	background: ${({ theme }) => theme.colors.backgrounds.surface};
	border: 2px solid ${({ theme }) => theme.colors.border.default};
	border-radius: ${({ theme }) => theme.radii.md};
	outline: none;
	min-width: 100px;
	cursor: pointer;

	&:hover {
		border-color: ${({ theme }) => theme.colors.border.accent};
	}

	&:focus {
		border-color: ${({ theme }) => theme.colors.primary};
		box-shadow: 0 0 0 4px ${({ theme }) => theme.colors.focus};
	}
`;

const StyledInput = styled.input<{ $hasError: boolean }>`
	flex: 1;
	height: 44px;
	padding: 0 ${({ theme }) => theme.spacing.md};
	font-family: "SF Mono", "Monaco", monospace;
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
	}

	&:hover:not(:disabled) {
		border-color: ${({ theme }) => theme.colors.border.accent};
	}

	&:focus {
		border-color: ${({ theme, $hasError }) =>
			$hasError ? theme.colors.status.danger : theme.colors.primary};
		box-shadow: 0 0 0 4px ${({ theme, $hasError }) =>
			$hasError ? "rgba(255, 90, 95, 0.2)" : theme.colors.focus};
	}
`;

const HelpText = styled.span<{ $isError: boolean }>`
	font-size: ${({ theme }) => theme.typography.sizes.xs};
	color: ${({ theme, $isError }) =>
		$isError ? theme.colors.status.danger : theme.colors.text.tertiary};
`;

const countries = [
	{ code: "+1", name: "US/CA", flag: "🇺🇸" },
	{ code: "+44", name: "UK", flag: "🇬🇧" },
	{ code: "+33", name: "FR", flag: "🇫🇷" },
	{ code: "+49", name: "DE", flag: "🇩🇪" },
	{ code: "+81", name: "JP", flag: "🇯🇵" },
	{ code: "+86", name: "CN", flag: "🇨🇳" },
];

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
	({ label, error, helpText, defaultCountry = "+1", value, onChange, ...props }, ref) => {
		const [country, setCountry] = useState(defaultCountry);

		return (
			<InputWrapper>
				{label && <Label>{label}</Label>}
				<InputContainer>
					<CountrySelect value={country} onChange={(e) => setCountry(e.target.value)}>
						{countries.map((c) => (
							<option key={c.code} value={c.code}>
								{c.flag} {c.code}
							</option>
						))}
					</CountrySelect>
					<StyledInput
						ref={ref}
						type="tel"
						value={value}
						onChange={onChange}
						$hasError={Boolean(error)}
						placeholder="(555) 123-4567"
						{...props}
					/>
				</InputContainer>
				{(error || helpText) && (
					<HelpText $isError={Boolean(error)}>{error || helpText}</HelpText>
				)}
			</InputWrapper>
		);
	}
);

PhoneInput.displayName = "PhoneInput";

export default PhoneInput;
