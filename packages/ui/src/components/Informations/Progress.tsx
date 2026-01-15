import { forwardRef, type HTMLAttributes } from "react";
import styled from "styled-components";

type ProgressVariant = "linear" | "circular";

export interface ProgressProps extends HTMLAttributes<HTMLDivElement> {
	value: number;
	max?: number;
	variant?: ProgressVariant;
	size?: "sm" | "md" | "lg";
	showLabel?: boolean;
	color?: "primary" | "success" | "warning" | "danger";
}

const ProgressContainer = styled.div`
	width: 100%;
`;

const LinearBar = styled.div<{ $size: string }>`
	width: 100%;
	height: \${({ $size }) => ($size === "sm" ? "6px" : $size === "lg" ? "12px" : "8px")};
	background: rgba(255, 255, 255, 0.08);
	border-radius: \${({ theme }) => theme.radii.pill};
	overflow: hidden;
	position: relative;
`;

const LinearFill = styled.div<{ $percentage: number; $color: string }>`
	height: 100%;
	width: \${({ $percentage }) => $percentage}%;
	background: \${({ $color, theme }) => {
		const colors = {
			primary: theme.gradients.primary,
			success: \`linear-gradient(90deg, \${theme.colors.status.success}, rgba(59, 207, 124, 0.7))\`,
			warning: \`linear-gradient(90deg, \${theme.colors.status.warning}, rgba(255, 179, 71, 0.7))\`,
			danger: theme.gradients.danger,
		};
		return colors[$color] || colors.primary;
	}};
	transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	box-shadow: 0 0 12px rgba(63, 140, 255, 0.5);
	position: relative;

	&::after {
		content: "";
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
		animation: shimmer 2s infinite;
	}

	@keyframes shimmer {
		0% { transform: translateX(-100%); }
		100% { transform: translateX(100%); }
	}
`;

const Label = styled.div`
	margin-top: \${({ theme }) => theme.spacing.xs};
	font-size: \${({ theme }) => theme.typography.sizes.sm};
	color: \${({ theme }) => theme.colors.text.tertiary};
	text-align: center;
	font-weight: \${({ theme }) => theme.typography.weightMedium};
`;

export const Progress = forwardRef<HTMLDivElement, ProgressProps>(
	(
		{
			value,
			max = 100,
			variant = "linear",
			size = "md",
			showLabel = false,
			color = "primary",
			...props
		},
		ref
	) => {
		const percentage = Math.min(100, Math.max(0, (value / max) * 100));

		if (variant === "circular") {
			// Simplified circular progress
			return (
				<ProgressContainer ref={ref} {...props}>
					<Label>\${percentage.toFixed(0)}%</Label>
				</ProgressContainer>
			);
		}

		return (
			<ProgressContainer ref={ref} {...props}>
				<LinearBar $size={size}>
					<LinearFill $percentage={percentage} $color={color} />
				</LinearBar>
				{showLabel && <Label>\${percentage.toFixed(0)}%</Label>}
			</ProgressContainer>
		);
	}
);

Progress.displayName = "Progress";

export default Progress;
