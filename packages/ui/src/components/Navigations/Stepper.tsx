/**
 * Stepper Component
 * 
 * A multi-step progress indicator for wizards and multi-page forms.
 * Displays numbered steps with labels, showing current progress.
 */

import { type ReactNode } from "react";
import styled, { css, keyframes } from "styled-components";
import { toRgba } from "../../theme/tokens";

export interface Step {
	/** Step label displayed below the indicator */
	label: string;
	/** Optional description for the step */
	description?: string;
	/** Whether the step is disabled/not clickable */
	disabled?: boolean;
}

export interface StepperProps {
	/** Array of steps to display */
	steps: Step[];
	/** Current active step (0-indexed) */
	currentStep: number;
	/** Callback when a step is clicked */
	onStepClick?: (stepIndex: number) => void;
	/** Visual variant of the stepper */
	variant?: "default" | "compact" | "vertical";
	/** Whether to show step numbers */
	showNumbers?: boolean;
	/** Whether completed steps are clickable to go back */
	allowBackNavigation?: boolean;
	/** Custom class name */
	className?: string;
}

const pulse = keyframes`
	0%, 100% {
		box-shadow: 0 0 0 0 rgba(var(--pulse-color), 0.4);
	}
	50% {
		box-shadow: 0 0 0 8px rgba(var(--pulse-color), 0);
	}
`;

const StepperContainer = styled.div<{ $variant: StepperProps["variant"] }>`
	display: flex;
	width: 100%;
	
	${({ $variant }) =>
		$variant === "vertical"
			? css`
					flex-direction: column;
					gap: ${({ theme }) => theme.spacing.sm};
			  `
			: css`
					flex-direction: row;
					align-items: flex-start;
					justify-content: space-between;
			  `}
`;

const StepItem = styled.div<{ 
	$variant: StepperProps["variant"]; 
	$isClickable: boolean;
}>`
	display: flex;
	flex-direction: ${({ $variant }) => ($variant === "vertical" ? "row" : "column")};
	align-items: ${({ $variant }) => ($variant === "vertical" ? "flex-start" : "center")};
	gap: ${({ theme }) => theme.spacing.xs};
	flex: 1;
	position: relative;
	cursor: ${({ $isClickable }) => ($isClickable ? "pointer" : "default")};
	
	${({ $variant }) =>
		$variant === "vertical" &&
		css`
			padding: ${({ theme }) => theme.spacing.sm} 0;
		`}
`;

const StepIndicator = styled.div<{
	$status: "completed" | "current" | "upcoming";
	$variant: StepperProps["variant"];
}>`
	width: ${({ $variant }) => ($variant === "compact" ? "28px" : "36px")};
	height: ${({ $variant }) => ($variant === "compact" ? "28px" : "36px")};
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: ${({ theme, $variant }) =>
		$variant === "compact" ? theme.typography.sizes.xs : theme.typography.sizes.sm};
	font-weight: ${({ theme }) => theme.typography.weightSemiBold};
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	position: relative;
	z-index: 1;
	flex-shrink: 0;

	${({ theme, $status }) => {
		switch ($status) {
			case "completed":
				return css`
					background: ${theme.colors.status.success};
					color: ${theme.colors.text.inverted};
					border: 2px solid ${theme.colors.status.success};
				`;
			case "current":
				return css`
					background: ${theme.gradients.primary};
					color: ${theme.colors.text.onAccent};
					border: 2px solid ${theme.colors.primary};
					box-shadow: 0 0 0 4px ${toRgba(theme.colors.primary, 0.2)};
					--pulse-color: ${theme.colors.primary.replace("#", "").match(/.{2}/g)?.map(hex => parseInt(hex, 16)).join(", ")};
					animation: ${pulse} 2s ease-in-out infinite;
				`;
			case "upcoming":
				return css`
					background: ${theme.colors.backgrounds.surface};
					color: ${theme.colors.text.tertiary};
					border: 2px solid ${theme.colors.border.default};
				`;
		}
	}}
`;

const StepConnector = styled.div<{
	$completed: boolean;
	$variant: StepperProps["variant"];
}>`
	${({ $variant, $completed, theme }) =>
		$variant === "vertical"
			? css`
					position: absolute;
					left: 17px;
					top: 48px;
					width: 2px;
					height: calc(100% - 12px);
					background: ${$completed
						? theme.colors.status.success
						: theme.colors.border.default};
					transition: background 0.3s ease;
			  `
			: css`
					position: absolute;
					top: 17px;
					left: calc(50% + 22px);
					right: calc(-50% + 22px);
					height: 2px;
					background: ${$completed
						? theme.colors.status.success
						: theme.colors.border.default};
					transition: background 0.3s ease;
			  `}
`;

const StepContent = styled.div<{ $variant: StepperProps["variant"] }>`
	display: flex;
	flex-direction: column;
	gap: ${({ theme }) => theme.spacing.xxxs};
	
	${({ $variant }) =>
		$variant === "vertical"
			? css`
					margin-left: ${({ theme }) => theme.spacing.sm};
					text-align: left;
			  `
			: css`
					text-align: center;
					max-width: 120px;
			  `}
`;

const StepLabel = styled.span<{
	$status: "completed" | "current" | "upcoming";
}>`
	font-size: ${({ theme }) => theme.typography.sizes.sm};
	font-weight: ${({ theme, $status }) =>
		$status === "current" ? theme.typography.weightSemiBold : theme.typography.weightMedium};
	color: ${({ theme, $status }) =>
		$status === "current"
			? theme.colors.text.primary
			: $status === "completed"
			? theme.colors.text.secondary
			: theme.colors.text.tertiary};
	transition: color 0.2s ease;
	line-height: ${({ theme }) => theme.typography.lineHeights.snug};
`;

const StepDescription = styled.span`
	font-size: ${({ theme }) => theme.typography.sizes.xs};
	color: ${({ theme }) => theme.colors.text.tertiary};
	line-height: ${({ theme }) => theme.typography.lineHeights.snug};
`;

const CheckIcon = () => (
	<svg
		width="14"
		height="14"
		viewBox="0 0 14 14"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
	>
		<path
			d="M11.6667 3.5L5.25 9.91667L2.33333 7"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		/>
	</svg>
);

/**
 * Stepper component for multi-step processes.
 * 
 * @example
 * ```tsx
 * <Stepper
 *   steps={[
 *     { label: "Account", description: "Email & password" },
 *     { label: "Profile", description: "Personal details" },
 *     { label: "Verify", description: "Confirm email" }
 *   ]}
 *   currentStep={1}
 *   onStepClick={(index) => setStep(index)}
 *   allowBackNavigation
 * />
 * ```
 */
export function Stepper({
	steps,
	currentStep,
	onStepClick,
	variant = "default",
	showNumbers = true,
	allowBackNavigation = false,
	className,
}: StepperProps) {
	const getStepStatus = (index: number): "completed" | "current" | "upcoming" => {
		if (index < currentStep) return "completed";
		if (index === currentStep) return "current";
		return "upcoming";
	};

	const handleStepClick = (index: number, step: Step) => {
		if (!onStepClick || step.disabled) return;
		
		// Only allow clicking completed steps if backNavigation is enabled
		if (index < currentStep && allowBackNavigation) {
			onStepClick(index);
		}
	};

	return (
		<StepperContainer $variant={variant} className={className}>
			{steps.map((step, index) => {
				const status = getStepStatus(index);
				const isLast = index === steps.length - 1;
				const isClickable = allowBackNavigation && status === "completed" && !step.disabled;

				return (
					<StepItem
						key={index}
						$variant={variant}
						$isClickable={isClickable}
						onClick={() => handleStepClick(index, step)}
						role={isClickable ? "button" : undefined}
						tabIndex={isClickable ? 0 : undefined}
						aria-current={status === "current" ? "step" : undefined}
					>
						<StepIndicator $status={status} $variant={variant}>
							{status === "completed" ? (
								<CheckIcon />
							) : showNumbers ? (
								index + 1
							) : null}
						</StepIndicator>

						<StepContent $variant={variant}>
							<StepLabel $status={status}>{step.label}</StepLabel>
							{step.description && variant !== "compact" && (
								<StepDescription>{step.description}</StepDescription>
							)}
						</StepContent>

						{!isLast && (
							<StepConnector
								$completed={status === "completed"}
								$variant={variant}
							/>
						)}
					</StepItem>
				);
			})}
		</StepperContainer>
	);
}

export default Stepper;
