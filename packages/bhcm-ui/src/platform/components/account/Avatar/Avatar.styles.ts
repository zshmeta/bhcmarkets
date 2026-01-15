import styled, { css, keyframes } from 'styled-components';

/**
 * Token Mapping Reference (from tokens.css):
 * --surface-secondary  → var(--bg-secondary, #161B22)
 * --surface-tertiary   → var(--bg-tertiary, #1C2128)
 * --border-primary     → var(--border, #30363D)
 * --bg-primary         → var(--bg-primary, #0D1117)
 * --text-tertiary      → var(--text-tertiary, #6E7681)
 * --brand-500          → #3B82F6
 * --status-danger      → var(--color-error, #F85149)
 * --space-1            → 0.25rem
 * --font-size-xs       → 0.6875rem
 * --font-weight-medium → 500
 * --transition-fast    → 0.1s ease-out
 */

/* ═══════════════════════════════════════════════════════════
 * ANIMATIONS
 * ═══════════════════════════════════════════════════════════
 */

/** Fade in for overlays and remove button */
const fadeIn = keyframes`
  to { opacity: 1; }
`;

/** Continuous rotation for loading spinner */
const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

/* ═══════════════════════════════════════════════════════════
 * SIZE CONFIGURATION
 * ═══════════════════════════════════════════════════════════
 * Centralized sizing makes it easy to add new variants.
 */
const SIZES = {
  sm: { avatar: 40, removeBtn: 16, removeBtnOffset: -2 },
  md: { avatar: 72, removeBtn: 20, removeBtnOffset: -4 },
  lg: { avatar: 120, removeBtn: 24, removeBtnOffset: 0 },
} as const;

export type AvatarSize = keyof typeof SIZES;

/* ═══════════════════════════════════════════════════════════
 * MAIN CONTAINER
 * ═══════════════════════════════════════════════════════════
 * Wrapper that positions the avatar and remove button.
 * inline-flex keeps it from taking full width.
 */
interface ContainerProps {
  $editable?: boolean;
  $size: AvatarSize;
}

export const Container = styled.div<ContainerProps>`
  position: relative;
  display: inline-flex;
  flex-direction: column;
  align-items: center;

  ${({ $editable }) =>
    $editable &&
    css`
      cursor: pointer;
    `}
`;

/* ═══════════════════════════════════════════════════════════
 * HIDDEN FILE INPUT
 * ═══════════════════════════════════════════════════════════
 * Triggered programmatically via ref.click()
 */
export const HiddenFileInput = styled.input`
  display: none;
`;

/* ═══════════════════════════════════════════════════════════
 * AVATAR WRAPPER
 * ═══════════════════════════════════════════════════════════
 * Circular container with border and overflow hidden for image.
 */
interface AvatarWrapperProps {
  $size: AvatarSize;
  $editable?: boolean;
  $isHovering?: boolean;
}

export const AvatarWrapper = styled.div<AvatarWrapperProps>`
  position: relative;
  border-radius: 50%;
  overflow: hidden;
  background: var(--bg-secondary, #161B22);
  border: 2px solid var(--border, #30363D);
  transition: all 0.1s ease-out;

  /* Dynamic sizing based on $size prop */
  width: ${({ $size }) => SIZES[$size].avatar}px;
  height: ${({ $size }) => SIZES[$size].avatar}px;

  /* Hover state: accent border when editable */
  ${({ $editable, $isHovering }) =>
    $editable &&
    $isHovering &&
    css`
      border-color: #3B82F6;
    `}
`;

/* ═══════════════════════════════════════════════════════════
 * AVATAR IMAGE
 * ═══════════════════════════════════════════════════════════
 * The actual avatar image, fills the wrapper completely.
 */
export const AvatarImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover; /* Maintains aspect ratio, crops excess */
`;

/* ═══════════════════════════════════════════════════════════
 * PLACEHOLDER
 * ═══════════════════════════════════════════════════════════
 * Shown when no avatar is set. Displays a user Icons.
 */
export const Placeholder = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-tertiary, #6E7681);
  background: var(--bg-tertiary, #1C2128);
`;

/* ═══════════════════════════════════════════════════════════
 * OVERLAY
 * ═══════════════════════════════════════════════════════════
 * Dark overlay shown on hover or during processing.
 * Contains camera Icons and optional text.
 */
export const Overlay = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.25rem; /* 4px */
  background: rgba(0, 0, 0, 0.6);
  color: white;
  opacity: 0;
  animation: ${fadeIn} 0.15s ease forwards;
`;

/* ═══════════════════════════════════════════════════════════
 * OVERLAY TEXT
 * ═══════════════════════════════════════════════════════════
 * "Change" label shown on hover. Hidden on small size.
 */
interface OverlayTextProps {
  $size: AvatarSize;
}

export const OverlayText = styled.span<OverlayTextProps>`
  font-size: 0.6875rem; /* 11px */
  font-weight: 500;

  /* Hide text on small avatars - not enough space */
  ${({ $size }) =>
    $size === 'sm' &&
    css`
      display: none;
    `}
`;

/* ═══════════════════════════════════════════════════════════
 * SPINNER WRAPPER
 * ═══════════════════════════════════════════════════════════
 * Applies rotation animation to the loader Icons.
 */
export const SpinnerIcons = styled.span`
  animation: ${spin} 1s linear infinite;
  display: flex;
`;

/* ═══════════════════════════════════════════════════════════
 * REMOVE BUTTON
 * ═══════════════════════════════════════════════════════════
 * Red circular button at top-right to remove avatar.
 * Size and position varies by avatar size.
 */
interface RemoveButtonProps {
  $size: AvatarSize;
}

export const RemoveButton = styled.button<RemoveButtonProps>`
  position: absolute;
  border-radius: 50%;
  background: var(--color-error, #F85149);
  color: white;
  border: 2px solid var(--bg-primary, #0D1117);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.1s ease-out;
  opacity: 0;
  animation: ${fadeIn} 0.15s ease forwards;

  /* Dynamic sizing based on avatar size */
  width: ${({ $size }) => SIZES[$size].removeBtn}px;
  height: ${({ $size }) => SIZES[$size].removeBtn}px;
  top: ${({ $size }) => SIZES[$size].removeBtnOffset}px;
  right: ${({ $size }) => SIZES[$size].removeBtnOffset}px;

  &:hover {
    transform: scale(1.1);
    background: #dc2626; /* Darker red on hover */
  }
`;
