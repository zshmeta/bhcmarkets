import { forwardRef, type InputHTMLAttributes } from "react";
import styled from "styled-components";

export interface AddressInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
	label?: string;
	error?: string;
	helpText?: string;
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

const StyledInput = styled.input<{ $hasError: boolean }>`
	width: 100%;
	height: 44px;
	padding: 0 ${({ theme }) => theme.spacing.md};
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

export const AddressInput = forwardRef<HTMLInputElement, AddressInputProps>(
	({ label, error, helpText, ...props }, ref) => (
		<InputWrapper>
			{label && <Label>{label}</Label>}
			<StyledInput
				ref={ref}
				type="text"
				$hasError={Boolean(error)}
				placeholder="123 Main St, City, State ZIP"
				{...props}
			/>
			{(error || helpText) && (
				<HelpText $isError={Boolean(error)}>{error || helpText}</HelpText>
			)}
		</InputWrapper>
	)
);

AddressInput.displayName = "AddressInput";

export default AddressInput;
