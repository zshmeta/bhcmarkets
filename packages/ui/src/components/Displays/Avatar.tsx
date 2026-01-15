/**
 * Avatar Component
 *
 * Displays user profile images with fallback to initials.
 * Supports multiple sizes, status indicators, and group stacking.
 */

import { forwardRef, useState, type ImgHTMLAttributes } from "react";
import styled, { css } from "styled-components";

type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl" | "xxl";
type AvatarStatus = "online" | "offline" | "busy" | "away";
type AvatarShape = "circle" | "rounded" | "square";

export interface AvatarProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, "size"> {
	/** Image source URL */
	src?: string;
	/** Alt text for image */
	alt?: string;
	/** User's name for generating initials */
	name?: string;
	/** Size preset */
	size?: AvatarSize;
	/** Custom size in pixels */
	customSize?: number;
	/** Shape of the avatar */
	shape?: AvatarShape;
	/** Online status indicator */
	status?: AvatarStatus;
	/** Show a ring/border around avatar */
	ring?: boolean;
	/** Ring color (defaults to primary) */
	ringColor?: string;
	/** Makes avatar interactive */
	clickable?: boolean;
}

export interface AvatarGroupProps {
	/** Maximum avatars to show before +N */
	max?: number;
	/** Size for all avatars */
	size?: AvatarSize;
	/** Overlap amount in pixels */
	spacing?: number;
	children: React.ReactNode;
}

const sizeMap: Record<AvatarSize, number> = {
	xs: 24,
	sm: 32,
	md: 40,
	lg: 48,
	xl: 64,
	xxl: 96,
};

const fontSizeMap: Record<AvatarSize, string> = {
	xs: "0.625rem",
	sm: "0.75rem",
	md: "0.875rem",
	lg: "1rem",
	xl: "1.25rem",
	xxl: "1.75rem",
};

const statusColorMap: Record<AvatarStatus, string> = {
	online: "#3BCF7C",
	offline: "#64748B",
	busy: "#FF5A5F",
	away: "#FFB347",
};

const AvatarContainer = styled.div<{
	$size: number;
	$shape: AvatarShape;
	$ring: boolean;
	$ringColor?: string;
	$clickable: boolean;
}>`
	position: relative;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: ${({ $size }) => $size}px;
	height: ${({ $size }) => $size}px;
	flex-shrink: 0;
	border-radius: ${({ $shape, theme }) => {
		switch ($shape) {
			case "circle":
				return "50%";
			case "rounded":
				return theme.radii.md;
			case "square":
				return theme.radii.xs;
		}
	}};
	overflow: hidden;
	background: ${({ theme }) => theme.gradients.primarySoft};
	transition: all 0.2s ease;

	${({ $ring, $ringColor, theme }) =>
		$ring &&
		css`
			box-shadow: 0 0 0 3px ${$ringColor || theme.colors.primary};
		`}

	${({ $clickable }) =>
		$clickable &&
		css`
			cursor: pointer;
			&:hover {
				transform: scale(1.05);
				filter: brightness(1.1);
			}
			&:active {
				transform: scale(0.98);
			}
		`}
`;

const AvatarImage = styled.img`
	width: 100%;
	height: 100%;
	object-fit: cover;
`;

const AvatarFallback = styled.div<{ $size: AvatarSize }>`
	width: 100%;
	height: 100%;
	display: flex;
	align-items: center;
	justify-content: center;
	font-family: ${({ theme }) => theme.typography.fontFamily};
	font-size: ${({ $size }) => fontSizeMap[$size]};
	font-weight: ${({ theme }) => theme.typography.weightSemiBold};
	color: ${({ theme }) => theme.colors.text.primary};
	text-transform: uppercase;
	user-select: none;
`;

const StatusIndicator = styled.div<{
	$status: AvatarStatus;
	$size: AvatarSize;
}>`
	position: absolute;
	bottom: ${({ $size }) => ($size === "xs" || $size === "sm" ? "-1px" : "0")};
	right: ${({ $size }) => ($size === "xs" || $size === "sm" ? "-1px" : "0")};
	width: ${({ $size }) => {
		const sizes: Record<AvatarSize, string> = {
			xs: "8px",
			sm: "10px",
			md: "12px",
			lg: "14px",
			xl: "16px",
			xxl: "20px",
		};
		return sizes[$size];
	}};
	height: ${({ $size }) => {
		const sizes: Record<AvatarSize, string> = {
			xs: "8px",
			sm: "10px",
			md: "12px",
			lg: "14px",
			xl: "16px",
			xxl: "20px",
		};
		return sizes[$size];
	}};
	border-radius: 50%;
	background: ${({ $status }) => statusColorMap[$status]};
	border: 2px solid ${({ theme }) => theme.colors.backgrounds.surface};
	box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1);
`;

const GroupContainer = styled.div<{ $spacing: number }>`
	display: inline-flex;
	flex-direction: row-reverse;

	& > * {
		margin-left: ${({ $spacing }) => -$spacing}px;
		border: 2px solid ${({ theme }) => theme.colors.backgrounds.surface};

		&:last-child {
			margin-left: 0;
		}
	}
`;

const OverflowIndicator = styled.div<{ $size: number }>`
	width: ${({ $size }) => $size}px;
	height: ${({ $size }) => $size}px;
	border-radius: 50%;
	background: ${({ theme }) => theme.colors.backgrounds.elevated};
	border: 2px solid ${({ theme }) => theme.colors.border.default};
	display: flex;
	align-items: center;
	justify-content: center;
	font-family: ${({ theme }) => theme.typography.fontFamily};
	font-size: ${({ theme }) => theme.typography.sizes.xs};
	font-weight: ${({ theme }) => theme.typography.weightSemiBold};
	color: ${({ theme }) => theme.colors.text.secondary};
`;

function getInitials(name: string): string {
	const parts = name.trim().split(/\s+/);
	if (parts.length === 1) {
		return parts[0].slice(0, 2);
	}
	return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
	(
		{
			src,
			alt,
			name,
			size = "md",
			customSize,
			shape = "circle",
			status,
			ring = false,
			ringColor,
			clickable = false,
			...props
		},
		ref
	) => {
		const [imageError, setImageError] = useState(false);
		const pixelSize = customSize || sizeMap[size];
		const showFallback = !src || imageError;

		return (
			<AvatarContainer
				ref={ref}
				$size={pixelSize}
				$shape={shape}
				$ring={ring}
				$ringColor={ringColor}
				$clickable={clickable}
				role={clickable ? "button" : undefined}
				tabIndex={clickable ? 0 : undefined}
			>
				{showFallback ? (
					<AvatarFallback $size={size}>
						{name ? getInitials(name) : "?"}
					</AvatarFallback>
				) : (
					<AvatarImage
						src={src}
						alt={alt || name || "Avatar"}
						onError={() => setImageError(true)}
						{...props}
					/>
				)}
				{status && <StatusIndicator $status={status} $size={size} />}
			</AvatarContainer>
		);
	}
);

Avatar.displayName = "Avatar";

export const AvatarGroup = ({
	max = 4,
	size = "md",
	spacing = 8,
	children,
}: AvatarGroupProps) => {
	const childArray = Array.isArray(children) ? children : [children];
	const visibleChildren = childArray.slice(0, max);
	const overflowCount = childArray.length - max;
	const pixelSize = sizeMap[size];

	return (
		<GroupContainer $spacing={spacing}>
			{overflowCount > 0 && (
				<OverflowIndicator $size={pixelSize}>+{overflowCount}</OverflowIndicator>
			)}
			{visibleChildren.reverse()}
		</GroupContainer>
	);
};

export default Avatar;
