import styled, { css, keyframes } from "styled-components";

type SkeletonVariant = "text" | "circular" | "rectangular" | "rounded";

export interface SkeletonProps {
	variant?: SkeletonVariant;
	width?: string | number;
	height?: string | number;
	animation?: "pulse" | "wave" | "none";
	count?: number;
}

const pulse = keyframes`
	0%, 100% {
		opacity: 1;
	}
	50% {
		opacity: 0.4;
	}
`;

const wave = keyframes`
	0% {
		background-position: -200% 0;
	}
	100% {
		background-position: 200% 0;
	}
`;

export const Skeleton = styled.div<SkeletonProps>`
	display: block;
	background: ${({ animation }) =>
		animation === "wave"
			? "linear-gradient(90deg, rgba(255, 255, 255, 0.04) 25%, rgba(255, 255, 255, 0.1) 50%, rgba(255, 255, 255, 0.04) 75%)"
			: "rgba(255, 255, 255, 0.06)"};
	background-size: ${({ animation }) => (animation === "wave" ? "200% 100%" : "100% 100%")};
	width: ${({ width = "100%" }) => (typeof width === "number" ? `${width}px` : width)};
	height: ${({ height = "20px" }) => (typeof height === "number" ? `${height}px` : height)};
	border-radius: ${({ theme, variant = "text" }) => {
		switch (variant) {
			case "circular":
				return "50%";
			case "rounded":
				return theme.radii.md;
			case "rectangular":
				return theme.radii.sm;
			default:
				return theme.radii.xs;
		}
	}};

	${({ animation }) => {
		if (animation === "pulse") {
			return css`
				animation: ${pulse} 1.5s ease-in-out infinite;
			`;
		}
		if (animation === "wave") {
			return css`
				animation: ${wave} 1.5s linear infinite;
			`;
		}
		return "";
	}}
`;

export default Skeleton;