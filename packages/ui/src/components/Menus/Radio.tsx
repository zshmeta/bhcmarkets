import { forwardRef, type InputHTMLAttributes } from "react";
import styled from "styled-components";

export interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
	label?: string;
}

const RadioWrapper = styled.label`
	display: inline-flex;
	align-items: center;
	gap: ${({ theme }) => theme.spacing.sm};
	cursor: pointer;
	user-select: none;
`;

const HiddenRadio = styled.input.attrs({ type: "radio" })`
	position: absolute;
	opacity: 0;
	width: 0;
	height: 0;
`;

const StyledRadio = styled.div<{ $checked: boolean }>`
	width: 20px;
	height: 20px;
	border-radius: 50%;
	border: 2px solid ${({ theme, $checked }) =>
		$checked ? theme.colors.primary : theme.colors.border.default};
	background: ${({ theme }) => theme.colors.backgrounds.surface};
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
		width: 10px;
		height: 10px;
		border-radius: 50%;
		background: ${({ theme }) => theme.gradients.primary};
	}
`;

const LabelText = styled.span`
	color: ${({ theme }) => theme.colors.text.primary};
	font-size: ${({ theme }) => theme.typography.sizes.sm};
`;

export const Radio = forwardRef<HTMLInputElement, RadioProps>(
	({ label, checked, ...props }, ref) => (
		<RadioWrapper>
			<HiddenRadio ref={ref} checked={checked} {...props} />
			<StyledRadio $checked={Boolean(checked)} />
			{label && <LabelText>{label}</LabelText>}
		</RadioWrapper>
	)
);

Radio.displayName = "Radio";

export default Radio;
