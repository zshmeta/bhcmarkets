import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import styled from "styled-components";

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
	/** Label can be a string or ReactNode for rich content */
	label?: ReactNode;
	error?: string;
	helpText?: string;
}

const CheckboxWrapper = styled.label`
	display: inline-flex;
	align-items: flex-start;
	gap: ${({ theme }) => theme.spacing.sm};
	cursor: pointer;
	user-select: none;
	position: relative;
`;

const HiddenCheckbox = styled.input.attrs({ type: "checkbox" })`
	position: absolute;
	opacity: 0;
	width: 0;
	height: 0;
`;

const StyledCheckbox = styled.div<{ $checked: boolean; $hasError: boolean }>`
	width: 20px;
	height: 20px;
	flex-shrink: 0;
	border-radius: ${({ theme }) => theme.radii.xs};
	border: 2px solid ${({ theme, $hasError, $checked }) =>
		$hasError
			? theme.colors.status.danger
			: $checked
			? theme.colors.primary
			: theme.colors.border.default};
	background: ${({ theme, $checked }) =>
		$checked ? theme.gradients.primary : theme.colors.backgrounds.surface};
	transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: ${({ $checked, theme }) =>
		$checked ? `0 0 0 3px ${theme.colors.focus}` : "none"};

	&:hover {
		border-color: ${({ theme }) => theme.colors.primary};
	}

	&::after {
		content: "";
		display: ${({ $checked }) => ($checked ? "block" : "none")};
		width: 5px;
		height: 10px;
		border: solid white;
		border-width: 0 2px 2px 0;
		transform: rotate(45deg);
		margin-top: -2px;
	}
`;

const LabelText = styled.span`
	color: ${({ theme }) => theme.colors.text.primary};
	font-size: ${({ theme }) => theme.typography.sizes.sm};
	line-height: ${({ theme }) => theme.typography.lineHeights.normal};
	padding-top: 1px;
`;

const HelpText = styled.span<{ $isError: boolean }>`
	font-size: ${({ theme }) => theme.typography.sizes.xs};
	color: ${({ theme, $isError }) =>
		$isError ? theme.colors.status.danger : theme.colors.text.tertiary};
	margin-left: 28px;
	display: block;
	margin-top: ${({ theme }) => theme.spacing.xxs};
`;

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
	({ label, error, helpText, checked, ...props }, ref) => (
		<div>
			<CheckboxWrapper>
				<HiddenCheckbox ref={ref} checked={checked} {...props} />
				<StyledCheckbox $checked={Boolean(checked)} $hasError={Boolean(error)} />
				{label && <LabelText>{label}</LabelText>}
			</CheckboxWrapper>
			{(error || helpText) && (
				<HelpText $isError={Boolean(error)}>{error || helpText}</HelpText>
			)}
		</div>
	)
);

Checkbox.displayName = "Checkbox";

export default Checkbox;
