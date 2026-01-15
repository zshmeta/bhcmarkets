import { forwardRef, type ReactNode, type SelectHTMLAttributes } from "react";
import styled from "styled-components";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
	label?: ReactNode;
	error?: string;
	helpText?: string;
}

const SelectWrapper = styled.div`
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

const SelectContainer = styled.div`
	position: relative;
	display: flex;
	align-items: center;
`;

const SelectField = styled.select<{ $hasError: boolean }>`
	width: 100%;
	height: 44px;
	padding: 0 ${({ theme }) => theme.spacing.xxxl} 0 ${({ theme }) => theme.spacing.md};
	font-family: ${({ theme }) => theme.typography.fontFamily};
	font-size: ${({ theme }) => theme.typography.sizes.base};
	color: ${({ theme }) => theme.colors.text.primary};
	background: ${({ theme }) => theme.colors.backgrounds.surface};
	border: 2px solid ${({ theme, $hasError }) =>
		$hasError ? theme.colors.status.danger : theme.colors.border.default};
	border-radius: ${({ theme }) => theme.radii.md};
	transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
	outline: none;
	cursor: pointer;
	appearance: none;

	&:hover:not(:disabled) {
		border-color: ${({ theme }) => theme.colors.border.accent};
	}

	&:focus {
		border-color: ${({ theme, $hasError }) =>
			$hasError ? theme.colors.status.danger : theme.colors.primary};
		box-shadow: 0 0 0 4px ${({ theme, $hasError }) =>
			$hasError ? "rgba(255, 90, 95, 0.2)" : theme.colors.focus};
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		background: ${({ theme }) => theme.colors.backgrounds.soft};
	}
`;

const IconWrapper = styled.span`
	position: absolute;
	right: ${({ theme }) => theme.spacing.md};
	display: flex;
	align-items: center;
	justify-content: center;
	pointer-events: none;
	color: ${({ theme }) => theme.colors.text.tertiary};

	&::before {
		content: "▼";
		font-size: 10px;
	}
`;

const HelpText = styled.span<{ $isError: boolean }>`
	font-size: ${({ theme }) => theme.typography.sizes.xs};
	color: ${({ theme, $isError }) =>
		$isError ? theme.colors.status.danger : theme.colors.text.tertiary};
`;

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
	({ label, id, error, helpText, children, ...props }, ref) => (
		<SelectWrapper>
			{label && <Label htmlFor={id}>{label}</Label>}
			<SelectContainer>
				<SelectField ref={ref} id={id} $hasError={Boolean(error)} {...props}>
					{children}
				</SelectField>
				<IconWrapper />
			</SelectContainer>
			{(error || helpText) && (
				<HelpText $isError={Boolean(error)}>{error || helpText}</HelpText>
			)}
		</SelectWrapper>
	)
);

Select.displayName = "Select";

export default Select;
