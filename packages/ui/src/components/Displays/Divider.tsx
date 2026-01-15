/**
 * Divider Component
 *
 * Visual separator for content sections.
 * Supports horizontal/vertical orientation, labels, and various styles.
 */

import styled, { css } from "styled-components";
import type { HTMLAttributes, ReactNode } from "react";

type DividerOrientation = "horizontal" | "vertical";
type DividerVariant = "solid" | "dashed" | "dotted" | "gradient";
type DividerThickness = "thin" | "medium" | "thick";

export interface DividerProps extends HTMLAttributes<HTMLDivElement> {
	/** Orientation of the divider */
	orientation?: DividerOrientation;
	/** Visual style variant */
	variant?: DividerVariant;
	/** Line thickness */
	thickness?: DividerThickness;
	/** Label to show in the middle */
	label?: ReactNode;
	/** Label position */
	labelPosition?: "start" | "center" | "end";
	/** Spacing above and below (or left/right for vertical) */
	spacing?: "none" | "sm" | "md" | "lg" | "xl";
	/** Use accent color */
	accent?: boolean;
}

const thicknessMap: Record<DividerThickness, string> = {
	thin: "1px",
	medium: "2px",
	thick: "3px",
};

const spacingMap = {
	none: "0",
	sm: "8px",
	md: "16px",
	lg: "24px",
	xl: "32px",
};

const DividerContainer = styled.div<{
	$orientation: DividerOrientation;
	$spacing: string;
	$hasLabel: boolean;
}>`
	display: flex;
	align-items: center;
	${({ $orientation, $spacing }) =>
		$orientation === "horizontal"
			? css`
					width: 100%;
					flex-direction: row;
					margin: ${$spacing} 0;
			  `
			: css`
					height: 100%;
					flex-direction: column;
					margin: 0 ${$spacing};
					align-self: stretch;
			  `}
`;

const Line = styled.div<{
	$orientation: DividerOrientation;
	$variant: DividerVariant;
	$thickness: string;
	$accent: boolean;
	$flex?: number;
}>`
	flex: ${({ $flex = 1 }) => $flex};

	${({ $orientation, $variant, $thickness, $accent, theme }) => {
		const color = $accent
			? theme.colors.primary
			: theme.colors.border.default;

		if ($variant === "gradient") {
			return $orientation === "horizontal"
				? css`
						height: ${$thickness};
						background: linear-gradient(
							90deg,
							transparent,
							${color},
							transparent
						);
				  `
				: css`
						width: ${$thickness};
						background: linear-gradient(
							180deg,
							transparent,
							${color},
							transparent
						);
				  `;
		}

		const borderStyle = $variant === "dashed" ? "dashed" : $variant === "dotted" ? "dotted" : "solid";

		return $orientation === "horizontal"
			? css`
					height: 0;
					border-top: ${$thickness} ${borderStyle} ${color};
			  `
			: css`
					width: 0;
					border-left: ${$thickness} ${borderStyle} ${color};
			  `;
	}}
`;

const LabelWrapper = styled.span<{ $orientation: DividerOrientation }>`
	padding: ${({ $orientation, theme }) =>
		$orientation === "horizontal"
			? `0 ${theme.spacing.md}`
			: `${theme.spacing.md} 0`};
	font-family: ${({ theme }) => theme.typography.fontFamily};
	font-size: ${({ theme }) => theme.typography.sizes.xs};
	font-weight: ${({ theme }) => theme.typography.weightMedium};
	color: ${({ theme }) => theme.colors.text.tertiary};
	text-transform: uppercase;
	letter-spacing: 0.05em;
	white-space: nowrap;
`;

export const Divider = ({
	orientation = "horizontal",
	variant = "solid",
	thickness = "thin",
	label,
	labelPosition = "center",
	spacing = "md",
	accent = false,
	...props
}: DividerProps) => {
	const thicknessValue = thicknessMap[thickness];
	const spacingValue = spacingMap[spacing];
	const hasLabel = Boolean(label);

	if (!hasLabel) {
		return (
			<DividerContainer
				$orientation={orientation}
				$spacing={spacingValue}
				$hasLabel={false}
				role="separator"
				aria-orientation={orientation}
				{...props}
			>
				<Line
					$orientation={orientation}
					$variant={variant}
					$thickness={thicknessValue}
					$accent={accent}
				/>
			</DividerContainer>
		);
	}

	const startFlex = labelPosition === "start" ? 0.1 : labelPosition === "center" ? 1 : 1;
	const endFlex = labelPosition === "start" ? 1 : labelPosition === "center" ? 1 : 0.1;

	return (
		<DividerContainer
			$orientation={orientation}
			$spacing={spacingValue}
			$hasLabel={true}
			role="separator"
			aria-orientation={orientation}
			{...props}
		>
			<Line
				$orientation={orientation}
				$variant={variant}
				$thickness={thicknessValue}
				$accent={accent}
				$flex={startFlex}
			/>
			<LabelWrapper $orientation={orientation}>{label}</LabelWrapper>
			<Line
				$orientation={orientation}
				$variant={variant}
				$thickness={thicknessValue}
				$accent={accent}
				$flex={endFlex}
			/>
		</DividerContainer>
	);
};

export default Divider;
