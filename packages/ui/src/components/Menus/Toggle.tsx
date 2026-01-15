import { forwardRef, type InputHTMLAttributes } from "react";
import styled from "styled-components";

export interface ToggleProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
	label?: string;
	size?: "sm" | "md" | "lg";
}

const ToggleWrapper = styled.label`
	display: inline-flex;
	align-items: center;
	gap: ${({ theme }) => theme.spacing.sm};
	cursor: pointer;
	user-select: none;
`;

const HiddenInput = styled.input.attrs({ type: "checkbox" })`
	position: absolute;
	opacity: 0;
	width: 0;
	height: 0;
`;

const ToggleTrack = styled.div<{ $checked: boolean; $size: string }>`
	position: relative;
	width: ${({ $size }) => ($size === "sm" ? "36px" : $size === "lg" ? "52px" : "44px")};
	height: ${({ $size }) => ($size === "sm" ? "20px" : $size === "lg" ? "28px" : "24px")};
	background: ${({ theme, $checked }) =>
		$checked ? theme.gradients.primary : "rgba(255, 255, 255, 0.1)"};
	border-radius: ${({ theme }) => theme.radii.pill};
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	border: 2px solid ${({ theme, $checked }) =>
		$checked ? "transparent" : theme.colors.border.default};
	box-shadow: ${({ $checked, theme }) =>
		$checked ? `0 0 12px ${theme.colors.primary}50` : "inset 0 1px 3px rgba(0, 0, 0, 0.3)"};

	&:hover {
		box-shadow: ${({ $checked, theme }) =>
			$checked ? `0 0 16px ${theme.colors.primary}70` : "none"};
	}
`;

const ToggleThumb = styled.div<{ $checked: boolean; $size: string }>`
	position: absolute;
	top: 2px;
	left: ${({ $checked, $size }) => {
		const thumbSize = $size === "sm" ? 16 : $size === "lg" ? 24 : 20;
		const trackWidth = $size === "sm" ? 36 : $size === "lg" ? 52 : 44;
		return $checked ? `${trackWidth - thumbSize - 4}px` : "2px";
	}};
	width: ${({ $size }) => ($size === "sm" ? "16px" : $size === "lg" ? "24px" : "20px")};
	height: ${({ $size }) => ($size === "sm" ? "16px" : $size === "lg" ? "24px" : "20px")};
	background: white;
	border-radius: 50%;
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
`;

const LabelText = styled.span`
	color: ${({ theme }) => theme.colors.text.primary};
	font-size: ${({ theme }) => theme.typography.sizes.sm};
`;

export const Toggle = forwardRef<HTMLInputElement, ToggleProps>(
	({ label, checked, size = "md", ...props }, ref) => (
		<ToggleWrapper>
			<HiddenInput ref={ref} checked={checked} {...props} />
			<ToggleTrack $checked={Boolean(checked)} $size={size}>
				<ToggleThumb $checked={Boolean(checked)} $size={size} />
			</ToggleTrack>
			{label && <LabelText>{label}</LabelText>}
		</ToggleWrapper>
	)
);

Toggle.displayName = "Toggle";

export default Toggle;
