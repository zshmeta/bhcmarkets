import {
	forwardRef,
	useState,
	type ChangeEvent,
	type FocusEvent,
	type InputHTMLAttributes,
} from "react";
import styled from "styled-components";

export interface NumInputProps
	extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
	label?: string;
	error?: string;
	helpText?: string;
	prefix?: string;
	suffix?: string;
	formatting?: "currency" | "percent" | "decimal" | "integer";
	decimals?: number;
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

const Affix = styled.span<{ $position: "prefix" | "suffix" }>`
	position: absolute;
	${({ $position, theme }) =>
		$position === "prefix"
			? `left: ${theme.spacing.md};`
			: `right: ${theme.spacing.md};`}
	color: ${({ theme }) => theme.colors.text.tertiary};
	font-family: "SF Mono", "Monaco", monospace;
	font-size: ${({ theme }) => theme.typography.sizes.base};
	font-weight: ${({ theme }) => theme.typography.weightMedium};
	pointer-events: none;
`;

const StyledInput = styled.input<{
	$hasPrefix: boolean;
	$hasSuffix: boolean;
	$hasError: boolean;
}>`
	width: 100%;
	height: 44px;
	padding-left: ${({ theme, $hasPrefix }) =>
		$hasPrefix ? theme.spacing.xxxl : theme.spacing.md};
	padding-right: ${({ theme, $hasSuffix }) =>
		$hasSuffix ? theme.spacing.xxxl : theme.spacing.md};
	font-family: "SF Mono", "Monaco", "Consolas", monospace;
	font-size: ${({ theme }) => theme.typography.sizes.base};
	font-weight: ${({ theme }) => theme.typography.weightMedium};
	color: ${({ theme }) => theme.colors.text.primary};
	background: ${({ theme }) => theme.colors.backgrounds.surface};
	border: 2px solid
		${({ theme, $hasError }) =>
			$hasError ? theme.colors.status.danger : theme.colors.border.default};
	border-radius: ${({ theme }) => theme.radii.md};
	transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
	outline: none;
	letter-spacing: 0.02em;

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
		box-shadow: 0 0 0 4px
			${({ theme, $hasError }) =>
				$hasError ? "rgba(255, 90, 95, 0.2)" : theme.colors.focus};
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		background: ${({ theme }) => theme.colors.backgrounds.soft};
	}
`;

const HelpText = styled.span<{ $isError: boolean }>`
	font-size: ${({ theme }) => theme.typography.sizes.xs};
	color: ${({ theme, $isError }) =>
		$isError ? theme.colors.status.danger : theme.colors.text.tertiary};
	line-height: ${({ theme }) => theme.typography.lineHeights.snug};
`;

const formatNumber = (
	value: string,
	formatting: NonNullable<NumInputProps["formatting"]>,
	decimals: number
): string => {
	const num = parseFloat(value.replace(/[^0-9.-]/g, ""));
	if (isNaN(num)) return "";

	switch (formatting) {
		case "currency":
			return num.toLocaleString("en-US", {
				minimumFractionDigits: decimals,
				maximumFractionDigits: decimals,
			});
		case "percent":
			return num.toFixed(decimals);
		case "integer":
			return Math.round(num).toString();
		default:
			return num.toFixed(decimals);
	}
};

export const NumInput = forwardRef<HTMLInputElement, NumInputProps>(
	(
		{
			label,
			error,
			helpText,
			prefix,
			suffix,
			formatting = "decimal",
			decimals = 2,
			value,
			onChange,
			onBlur,
			...props
		},
		ref
	) => {
		const [localValue, setLocalValue] = useState("");
		const [isFocused, setIsFocused] = useState(false);

		const currentValue = value !== undefined ? String(value) : localValue;

		const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
			setLocalValue(e.target.value);
			onChange?.(e);
		};

		const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
			setIsFocused(false);
			const formatted = formatNumber(currentValue, formatting, decimals);
			setLocalValue(formatted);
			onBlur?.(e);
		};

		const displayPrefix = prefix || (formatting === "currency" ? "$" : "");
		const displaySuffix = suffix || (formatting === "percent" ? "%" : "");

		return (
			<InputWrapper>
				{label && <Label>{label}</Label>}
				<InputContainer>
					{displayPrefix && (
						<Affix $position="prefix">{displayPrefix}</Affix>
					)}
					<StyledInput
						ref={ref}
						type="text"
						inputMode="decimal"
						value={
							isFocused
								? currentValue
								: formatNumber(currentValue, formatting, decimals)
						}
						onChange={handleChange}
						onFocus={() => setIsFocused(true)}
						onBlur={handleBlur}
						$hasPrefix={Boolean(displayPrefix)}
						$hasSuffix={Boolean(displaySuffix)}
						$hasError={Boolean(error)}
						{...props}
					/>
					{displaySuffix && (
						<Affix $position="suffix">{displaySuffix}</Affix>
					)}
				</InputContainer>
				{(error || helpText) && (
					<HelpText $isError={Boolean(error)}>{error || helpText}</HelpText>
				)}
			</InputWrapper>
		);
	}
);

NumInput.displayName = "NumInput";

export default NumInput;