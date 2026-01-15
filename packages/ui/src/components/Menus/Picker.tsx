import { forwardRef, useState, type HTMLAttributes } from "react";
import styled from "styled-components";

export interface PickerOption {
	id: string;
	label: string;
	value: string;
}

export interface PickerProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
	options: PickerOption[];
	value?: string;
	onChange?: (value: string) => void;
	label?: string;
}

const PickerWrapper = styled.div`
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

const OptionsContainer = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: ${({ theme }) => theme.spacing.xs};
`;

const Option = styled.button<{ $selected: boolean }>`
	padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md}`};
	background: ${({ theme, $selected }) =>
		$selected ? theme.gradients.primary : theme.colors.backgrounds.surface};
	border: 2px solid ${({ theme, $selected }) =>
		$selected ? "transparent" : theme.colors.border.default};
	border-radius: ${({ theme }) => theme.radii.md};
	color: ${({ theme, $selected }) =>
		$selected ? theme.colors.text.onAccent : theme.colors.text.primary};
	font-size: ${({ theme }) => theme.typography.sizes.sm};
	font-weight: ${({ theme, $selected }) =>
		$selected ? theme.typography.weightSemiBold : theme.typography.weightMedium};
	cursor: pointer;
	transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
	box-shadow: ${({ $selected, theme }) =>
		$selected ? `0 0 0 3px ${theme.colors.focus}` : "none"};

	&:hover {
		border-color: ${({ theme }) => theme.colors.primary};
		background: ${({ theme, $selected }) =>
			$selected ? theme.gradients.primary : "rgba(255, 255, 255, 0.05)"};
	}
`;

export const Picker = forwardRef<HTMLDivElement, PickerProps>(
	({ options, value, onChange, label, ...props }, ref) => {
		const [selectedValue, setSelectedValue] = useState(value);

		const handleSelect = (optionValue: string) => {
			setSelectedValue(optionValue);
			onChange?.(optionValue);
		};

		return (
			<PickerWrapper ref={ref} {...props}>
				{label && <Label>{label}</Label>}
				<OptionsContainer>
					{options.map((option) => (
						<Option
							key={option.id}
							$selected={selectedValue === option.value}
							onClick={() => handleSelect(option.value)}
						>
							{option.label}
						</Option>
					))}
				</OptionsContainer>
			</PickerWrapper>
		);
	}
);

Picker.displayName = "Picker";

export default Picker;
