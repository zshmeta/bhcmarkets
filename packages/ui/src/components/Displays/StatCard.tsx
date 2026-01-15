/**
 * StatCard Component
 *
 * Displays key metrics/KPIs with trend indicators.
 * Essential for financial dashboards.
 */

import styled, { css, keyframes } from "styled-components";
import type { HTMLAttributes, ReactNode } from "react";

type TrendDirection = "up" | "down" | "neutral";
type StatVariant = "default" | "compact" | "prominent" | "minimal";

export interface StatCardProps extends HTMLAttributes<HTMLDivElement> {
	/** Label for the stat */
	label: string;
	/** Primary value to display */
	value: string | number;
	/** Previous value for comparison */
	previousValue?: string | number;
	/** Change percentage or amount */
	change?: string | number;
	/** Direction of change */
	trend?: TrendDirection;
	/** Prefix for the value (e.g., "$") */
	prefix?: string;
	/** Suffix for the value (e.g., "%") */
	suffix?: string;
	/** Icon to display */
	icon?: ReactNode;
	/** Visual variant */
	variant?: StatVariant;
	/** Loading state */
	loading?: boolean;
	/** Additional info/tooltip */
	info?: string;
	/** Sparkline data for mini chart */
	sparkline?: number[];
}

const shimmer = keyframes`
	0% { background-position: -200% 0; }
	100% { background-position: 200% 0; }
`;

const Container = styled.div<{ $variant: StatVariant; $loading: boolean }>`
	display: flex;
	flex-direction: column;
	padding: ${({ theme, $variant }) => {
		switch ($variant) {
			case "compact":
				return theme.spacing.md;
			case "minimal":
				return theme.spacing.sm;
			case "prominent":
				return theme.spacing.xl;
			default:
				return theme.spacing.lg;
		}
	}};
	background: ${({ theme, $variant }) =>
		$variant === "minimal" ? "transparent" : theme.colors.backgrounds.elevated};
	border-radius: ${({ theme, $variant }) =>
		$variant === "minimal" ? "0" : theme.radii.lg};
	border: ${({ theme, $variant }) =>
		$variant === "minimal" ? "none" : `1px solid ${theme.colors.border.subtle}`};
	transition: all 0.2s ease;

	${({ $variant, theme }) =>
		$variant !== "minimal" &&
		css`
			&:hover {
				border-color: ${theme.colors.border.accent};
				box-shadow: ${theme.shadows.soft};
			}
		`}

	${({ $loading }) =>
		$loading &&
		css`
			pointer-events: none;
		`}
`;

const Header = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const Label = styled.span`
	font-family: ${({ theme }) => theme.typography.fontFamily};
	font-size: ${({ theme }) => theme.typography.sizes.sm};
	font-weight: ${({ theme }) => theme.typography.weightMedium};
	color: ${({ theme }) => theme.colors.text.tertiary};
	text-transform: uppercase;
	letter-spacing: 0.03em;
`;

const IconWrapper = styled.div`
	width: 36px;
	height: 36px;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: ${({ theme }) => theme.radii.md};
	background: ${({ theme }) => theme.gradients.primarySoft};
	color: ${({ theme }) => theme.colors.primary};

	svg {
		width: 20px;
		height: 20px;
	}
`;

const ValueContainer = styled.div`
	display: flex;
	align-items: baseline;
	gap: ${({ theme }) => theme.spacing.xs};
`;

const Value = styled.span<{ $variant: StatVariant; $loading: boolean }>`
	font-family: ${({ theme }) => theme.typography.fontFamily};
	font-size: ${({ $variant, theme }) => {
		switch ($variant) {
			case "compact":
				return theme.typography.sizes.lg;
			case "minimal":
				return theme.typography.sizes.md;
			case "prominent":
				return theme.typography.sizes.xxl;
			default:
				return theme.typography.sizes.xl;
		}
	}};
	font-weight: ${({ theme }) => theme.typography.weightBold};
	color: ${({ theme }) => theme.colors.text.primary};
	letter-spacing: -0.02em;
	line-height: 1.2;

	${({ $loading, theme }) =>
		$loading &&
		css`
			background: linear-gradient(
				90deg,
				${theme.colors.backgrounds.soft} 25%,
				${theme.colors.backgrounds.elevated} 50%,
				${theme.colors.backgrounds.soft} 75%
			);
			background-size: 200% 100%;
			animation: ${shimmer} 1.5s infinite;
			border-radius: ${theme.radii.sm};
			color: transparent;
		`}
`;

const Affix = styled.span`
	font-size: 0.6em;
	font-weight: ${({ theme }) => theme.typography.weightMedium};
	color: ${({ theme }) => theme.colors.text.secondary};
`;

const TrendContainer = styled.div<{ $trend: TrendDirection }>`
	display: inline-flex;
	align-items: center;
	gap: ${({ theme }) => theme.spacing.xxs};
	padding: ${({ theme }) => `${theme.spacing.xxs} ${theme.spacing.xs}`};
	border-radius: ${({ theme }) => theme.radii.pill};
	font-family: ${({ theme }) => theme.typography.fontFamily};
	font-size: ${({ theme }) => theme.typography.sizes.xs};
	font-weight: ${({ theme }) => theme.typography.weightSemiBold};
	margin-top: ${({ theme }) => theme.spacing.sm};

	${({ $trend, theme }) => {
		switch ($trend) {
			case "up":
				return css`
					background: rgba(59, 207, 124, 0.15);
					color: ${theme.colors.status.success};
				`;
			case "down":
				return css`
					background: rgba(255, 90, 95, 0.15);
					color: ${theme.colors.status.danger};
				`;
			default:
				return css`
					background: rgba(255, 255, 255, 0.08);
					color: ${theme.colors.text.tertiary};
				`;
		}
	}}
`;

const TrendIcon = styled.span<{ $trend: TrendDirection }>`
	display: inline-flex;
	transform: ${({ $trend }) =>
		$trend === "up" ? "rotate(-45deg)" : $trend === "down" ? "rotate(45deg)" : "none"};

	svg {
		width: 12px;
		height: 12px;
	}
`;

const SparklineContainer = styled.div`
	height: 32px;
	margin-top: ${({ theme }) => theme.spacing.md};
	display: flex;
	align-items: flex-end;
	gap: 2px;
`;

const SparklineBar = styled.div<{ $height: number; $isLast: boolean }>`
	flex: 1;
	height: ${({ $height }) => $height}%;
	min-height: 2px;
	background: ${({ theme, $isLast }) =>
		$isLast ? theme.colors.primary : theme.colors.border.default};
	border-radius: ${({ theme }) => theme.radii.xs};
	transition: all 0.2s ease;
`;

const InfoText = styled.span`
	font-family: ${({ theme }) => theme.typography.fontFamily};
	font-size: ${({ theme }) => theme.typography.sizes.xs};
	color: ${({ theme }) => theme.colors.text.muted};
	margin-top: ${({ theme }) => theme.spacing.xs};
`;

const ArrowIcon = () => (
	<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
		<path d="M5 12h14M12 5l7 7-7 7" />
	</svg>
);

export const StatCard = ({
	label,
	value,
	previousValue,
	change,
	trend = "neutral",
	prefix,
	suffix,
	icon,
	variant = "default",
	loading = false,
	info,
	sparkline,
	...props
}: StatCardProps) => {
	const normalizedSparkline = sparkline?.map((v, i, arr) => {
		const max = Math.max(...arr);
		const min = Math.min(...arr);
		const range = max - min || 1;
		return ((v - min) / range) * 100;
	});

	return (
		<Container $variant={variant} $loading={loading} {...props}>
			<Header>
				<Label>{label}</Label>
				{icon && <IconWrapper>{icon}</IconWrapper>}
			</Header>

			<ValueContainer>
				{prefix && <Affix>{prefix}</Affix>}
				<Value $variant={variant} $loading={loading}>
					{loading ? "Loading..." : value}
				</Value>
				{suffix && <Affix>{suffix}</Affix>}
			</ValueContainer>

			{change !== undefined && !loading && (
				<TrendContainer $trend={trend}>
					<TrendIcon $trend={trend}>
						<ArrowIcon />
					</TrendIcon>
					{typeof change === "number" ? `${change > 0 ? "+" : ""}${change}%` : change}
					{previousValue !== undefined && (
						<span style={{ opacity: 0.7 }}> vs {previousValue}</span>
					)}
				</TrendContainer>
			)}

			{normalizedSparkline && normalizedSparkline.length > 0 && (
				<SparklineContainer>
					{normalizedSparkline.map((height, i) => (
						<SparklineBar
							key={i}
							$height={height}
							$isLast={i === normalizedSparkline.length - 1}
						/>
					))}
				</SparklineContainer>
			)}

			{info && <InfoText>{info}</InfoText>}
		</Container>
	);
};

export default StatCard;
