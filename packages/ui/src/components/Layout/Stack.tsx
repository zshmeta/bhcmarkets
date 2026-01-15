/**
 * Stack Component
 *
 * Flexbox layout utility for consistent spacing.
 * Vertical or horizontal stack of items with gap control.
 */

import styled, { css } from "styled-components";
import type { HTMLAttributes, ReactNode } from "react";

type StackDirection = "horizontal" | "vertical";
type StackAlign = "start" | "center" | "end" | "stretch" | "baseline";
type StackJustify = "start" | "center" | "end" | "between" | "around" | "evenly";
type StackSpacing = "none" | "xxs" | "xs" | "sm" | "md" | "lg" | "xl" | "xxl";

export interface StackProps extends HTMLAttributes<HTMLDivElement> {
	/** Direction of items */
	direction?: StackDirection;
	/** Alignment perpendicular to direction */
	align?: StackAlign;
	/** Distribution along main axis */
	justify?: StackJustify;
	/** Gap between items */
	gap?: StackSpacing;
	/** Wrap items */
	wrap?: boolean;
	/** Full width */
	fullWidth?: boolean;
	/** Full height */
	fullHeight?: boolean;
	/** Inline display */
	inline?: boolean;
}

export interface HStackProps extends Omit<StackProps, "direction"> {}
export interface VStackProps extends Omit<StackProps, "direction"> {}

const alignMap: Record<StackAlign, string> = {
	start: "flex-start",
	center: "center",
	end: "flex-end",
	stretch: "stretch",
	baseline: "baseline",
};

const justifyMap: Record<StackJustify, string> = {
	start: "flex-start",
	center: "center",
	end: "flex-end",
	between: "space-between",
	around: "space-around",
	evenly: "space-evenly",
};

const StyledStack = styled.div<{
	$direction: StackDirection;
	$align: StackAlign;
	$justify: StackJustify;
	$gap: StackSpacing;
	$wrap: boolean;
	$fullWidth: boolean;
	$fullHeight: boolean;
	$inline: boolean;
}>`
	display: ${({ $inline }) => ($inline ? "inline-flex" : "flex")};
	flex-direction: ${({ $direction }) => ($direction === "horizontal" ? "row" : "column")};
	align-items: ${({ $align }) => alignMap[$align]};
	justify-content: ${({ $justify }) => justifyMap[$justify]};
	gap: ${({ theme, $gap }) => ($gap === "none" ? "0" : theme.spacing[$gap])};
	flex-wrap: ${({ $wrap }) => ($wrap ? "wrap" : "nowrap")};

	${({ $fullWidth }) =>
		$fullWidth &&
		css`
			width: 100%;
		`}

	${({ $fullHeight }) =>
		$fullHeight &&
		css`
			height: 100%;
		`}
`;

export const Stack = ({
	direction = "vertical",
	align = "stretch",
	justify = "start",
	gap = "md",
	wrap = false,
	fullWidth = false,
	fullHeight = false,
	inline = false,
	children,
	...props
}: StackProps & { children?: ReactNode }) => (
	<StyledStack
		$direction={direction}
		$align={align}
		$justify={justify}
		$gap={gap}
		$wrap={wrap}
		$fullWidth={fullWidth}
		$fullHeight={fullHeight}
		$inline={inline}
		{...props}
	>
		{children}
	</StyledStack>
);

/** Horizontal stack (row) */
export const HStack = (props: HStackProps & { children?: ReactNode }) => (
	<Stack direction="horizontal" {...props} />
);

/** Vertical stack (column) */
export const VStack = (props: VStackProps & { children?: ReactNode }) => (
	<Stack direction="vertical" {...props} />
);

/**
 * Spacer Component
 *
 * Flexible space that pushes items apart in a Stack.
 */
export const Spacer = styled.div`
	flex: 1;
`;

/**
 * Center Component
 *
 * Centers content both horizontally and vertically.
 */
export const Center = styled.div<{ $minHeight?: string }>`
	display: flex;
	align-items: center;
	justify-content: center;
	width: 100%;
	min-height: ${({ $minHeight }) => $minHeight || "auto"};
`;

/**
 * Box Component
 *
 * Basic layout primitive with padding/margin shortcuts.
 */
export interface BoxProps extends HTMLAttributes<HTMLDivElement> {
	p?: StackSpacing;
	px?: StackSpacing;
	py?: StackSpacing;
	pt?: StackSpacing;
	pr?: StackSpacing;
	pb?: StackSpacing;
	pl?: StackSpacing;
	m?: StackSpacing;
	mx?: StackSpacing;
	my?: StackSpacing;
	mt?: StackSpacing;
	mr?: StackSpacing;
	mb?: StackSpacing;
	ml?: StackSpacing;
}

export const Box = styled.div<{
	$p?: StackSpacing;
	$px?: StackSpacing;
	$py?: StackSpacing;
	$pt?: StackSpacing;
	$pr?: StackSpacing;
	$pb?: StackSpacing;
	$pl?: StackSpacing;
	$m?: StackSpacing;
	$mx?: StackSpacing;
	$my?: StackSpacing;
	$mt?: StackSpacing;
	$mr?: StackSpacing;
	$mb?: StackSpacing;
	$ml?: StackSpacing;
}>`
	${({ theme, $p, $px, $py, $pt, $pr, $pb, $pl }) => {
		const getSpacing = (val?: StackSpacing) =>
			val && val !== "none" ? theme.spacing[val] : undefined;

		const paddingTop = getSpacing($pt) || getSpacing($py) || getSpacing($p);
		const paddingRight = getSpacing($pr) || getSpacing($px) || getSpacing($p);
		const paddingBottom = getSpacing($pb) || getSpacing($py) || getSpacing($p);
		const paddingLeft = getSpacing($pl) || getSpacing($px) || getSpacing($p);

		return css`
			${paddingTop && `padding-top: ${paddingTop};`}
			${paddingRight && `padding-right: ${paddingRight};`}
			${paddingBottom && `padding-bottom: ${paddingBottom};`}
			${paddingLeft && `padding-left: ${paddingLeft};`}
		`;
	}}

	${({ theme, $m, $mx, $my, $mt, $mr, $mb, $ml }) => {
		const getSpacing = (val?: StackSpacing) =>
			val && val !== "none" ? theme.spacing[val] : undefined;

		const marginTop = getSpacing($mt) || getSpacing($my) || getSpacing($m);
		const marginRight = getSpacing($mr) || getSpacing($mx) || getSpacing($m);
		const marginBottom = getSpacing($mb) || getSpacing($my) || getSpacing($m);
		const marginLeft = getSpacing($ml) || getSpacing($mx) || getSpacing($m);

		return css`
			${marginTop && `margin-top: ${marginTop};`}
			${marginRight && `margin-right: ${marginRight};`}
			${marginBottom && `margin-bottom: ${marginBottom};`}
			${marginLeft && `margin-left: ${marginLeft};`}
		`;
	}}
`;

export default Stack;
