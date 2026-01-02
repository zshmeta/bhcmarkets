import styled, { css } from "styled-components";

type TextVariant = "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "body" | "caption" | "label" | "code" | "overline";
type TextSize = "xs" | "sm" | "base" | "md" | "lg" | "xl" | "xxl";
type TextWeight = "regular" | "medium" | "semibold" | "bold";
type TextColor = 
	| "primary" 
	| "secondary" 
	| "tertiary" 
	| "muted" 
	| "accent" 
	| "success" 
	| "warning" 
	| "danger"
	| "inverted";

export interface TextProps {
	variant?: TextVariant;
	size?: TextSize;
	weight?: TextWeight;
	color?: TextColor;
	align?: "left" | "center" | "right" | "justify";
	truncate?: boolean;
	noWrap?: boolean;
	as?: keyof JSX.IntrinsicElements;
	gradient?: boolean;
}

const variantStyles = css<TextProps>`
	${({ variant, theme }) => {
		switch (variant) {
			case "h1":
				return css`
					font-size: ${theme.typography.sizes.xxl};
					font-weight: ${theme.typography.weightBold};
					line-height: ${theme.typography.lineHeights.tight};
					letter-spacing: -0.02em;
					margin: 0;
				`;
			case "h2":
				return css`
					font-size: ${theme.typography.sizes.xl};
					font-weight: ${theme.typography.weightBold};
					line-height: ${theme.typography.lineHeights.tight};
					letter-spacing: -0.01em;
					margin: 0;
				`;
			case "h3":
				return css`
					font-size: ${theme.typography.sizes.lg};
					font-weight: ${theme.typography.weightSemiBold};
					line-height: ${theme.typography.lineHeights.snug};
					margin: 0;
				`;
			case "h4":
				return css`
					font-size: ${theme.typography.sizes.md};
					font-weight: ${theme.typography.weightSemiBold};
					line-height: ${theme.typography.lineHeights.snug};
					margin: 0;
				`;
			case "caption":
				return css`
					font-size: ${theme.typography.sizes.xs};
					line-height: ${theme.typography.lineHeights.snug};
					opacity: 0.8;
				`;
			case "label":
				return css`
					font-size: ${theme.typography.sizes.sm};
					font-weight: ${theme.typography.weightMedium};
					text-transform: uppercase;
					letter-spacing: 0.08em;
				`;
			case "code":
				return css`
					font-family: "SF Mono", "Monaco", "Consolas", "Courier New", monospace;
					font-size: 0.9em;
					background: rgba(255, 255, 255, 0.08);
					padding: 2px 8px;
					border-radius: ${theme.radii.xs};
					border: 1px solid rgba(255, 255, 255, 0.12);
				`;
			case "overline":
				return css`
					font-size: ${theme.typography.sizes.xs};
					font-weight: ${theme.typography.weightSemiBold};
					text-transform: uppercase;
					letter-spacing: 0.15em;
				`;
			default:
				return css`
					font-size: ${theme.typography.sizes.base};
					line-height: ${theme.typography.lineHeights.normal};
				`;
		}
	}}
`;

export const Text = styled.p<TextProps>`
	margin: 0;
	font-family: ${({ theme }) => theme.typography.fontFamily};
	color: ${({ theme, color = "primary" }) => {
		const colorMap = {
			primary: theme.colors.text.primary,
			secondary: theme.colors.text.secondary,
			tertiary: theme.colors.text.tertiary,
			muted: theme.colors.text.muted,
			accent: theme.colors.accent,
			success: theme.colors.status.success,
			warning: theme.colors.status.warning,
			danger: theme.colors.status.danger,
			inverted: theme.colors.text.inverted,
		};
		return colorMap[color];
	}};
	font-size: ${({ theme, size = "base" }) => theme.typography.sizes[size]};
	font-weight: ${({ theme, weight = "regular" }) => {
		const weightMap = {
			regular: theme.typography.weightRegular,
			medium: theme.typography.weightMedium,
			semibold: theme.typography.weightSemiBold,
			bold: theme.typography.weightBold,
		};
		return weightMap[weight];
	}};
	text-align: ${({ align = "left" }) => align};

	${({ truncate }) =>
		truncate &&
		css`
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		`}

	${({ noWrap }) =>
		noWrap &&
		css`
			white-space: nowrap;
		`}

	${({ gradient, theme }) =>
		gradient &&
		css`
			background: ${theme.gradients.primary};
			-webkit-background-clip: text;
			-webkit-text-fill-color: transparent;
			background-clip: text;
		`}

	${variantStyles}
`;

export default Text;