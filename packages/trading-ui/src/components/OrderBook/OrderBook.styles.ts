import styled, { keyframes, css } from 'styled-components';
import { COLORS, TYPOGRAPHY, SPACING, EFFECTS, SIZING } from '../../theme';

// =============================================================================
// ANIMATIONS
// =============================================================================

const flashGreen = keyframes`
  0% { background-color: rgba(32, 178, 108, 0.35); }
  100% { background-color: transparent; }
`;

const flashRed = keyframes`
  0% { background-color: rgba(239, 68, 68, 0.35); }
  100% { background-color: transparent; }
`;

export const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(-2px); }
  to { opacity: 1; transform: translateY(0); }
`;

// =============================================================================
// STYLED COMPONENTS
// =============================================================================

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: ${COLORS.bg.tertiary};
  border-radius: ${EFFECTS.borderRadius.md};
  overflow: hidden;
  font-family: ${TYPOGRAPHY.fontFamily.mono};
  font-size: ${TYPOGRAPHY.fontSize.base};
  user-select: none;
`;

export const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${SPACING[2]} ${SPACING[3]};
  background: ${COLORS.bg.secondary};
  border-bottom: 1px solid ${COLORS.border.subtle};
  min-height: ${SIZING.panelHeaderCompact};
`;

export const Title = styled.div`
  display: flex;
  align-items: center;
  gap: ${SPACING[2]};
`;

export const TitleText = styled.span`
  font-family: ${TYPOGRAPHY.fontFamily.sans};
  font-weight: ${TYPOGRAPHY.fontWeight.semibold};
  font-size: ${TYPOGRAPHY.fontSize.sm};
  color: ${COLORS.text.primary};
  text-transform: uppercase;
  letter-spacing: ${TYPOGRAPHY.letterSpacing.wide};
`;

export const ViewToggle = styled.div`
  display: flex;
  background: ${COLORS.bg.primary};
  border-radius: ${EFFECTS.borderRadius.base};
  padding: 2px;
`;

export const ViewButton = styled.button<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 20px;
  border: none;
  border-radius: ${EFFECTS.borderRadius.sm};
  background: ${({ $active }: { $active?: boolean }) => $active ? COLORS.bg.elevated : 'transparent'};
  color: ${({ $active }: { $active?: boolean }) => $active ? COLORS.text.primary : COLORS.text.tertiary};
  cursor: pointer;
  transition: ${EFFECTS.transition.fast};
  
  &:hover {
    color: ${COLORS.text.primary};
    background: ${({ $active }: { $active?: boolean }) => $active ? COLORS.bg.elevated : COLORS.bg.hover};
  }
  
  svg {
    width: 12px;
    height: 12px;
  }
`;

export const SpreadBadge = styled.div`
  display: flex;
  align-items: center;
  gap: ${SPACING[1]};
  padding: ${SPACING[1]} ${SPACING[2]};
  background: ${COLORS.bg.primary};
  border-radius: ${EFFECTS.borderRadius.base};
  font-size: ${TYPOGRAPHY.fontSize.xs};
  color: ${COLORS.text.secondary};
`;

export const SpreadValue = styled.span`
  color: ${COLORS.text.primary};
  font-weight: ${TYPOGRAPHY.fontWeight.medium};
`;

export const BookContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

export const ColumnHeaders = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  padding: ${SPACING[1]} ${SPACING[2]};
  background: ${COLORS.bg.secondary};
  border-bottom: 1px solid ${COLORS.border.subtle};
`;

export const ColumnHeader = styled.span<{ $align?: 'left' | 'center' | 'right' }>`
  font-family: ${TYPOGRAPHY.fontFamily.sans};
  font-size: ${TYPOGRAPHY.fontSize.xs};
  font-weight: ${TYPOGRAPHY.fontWeight.medium};
  color: ${COLORS.text.tertiary};
  text-transform: uppercase;
  letter-spacing: ${TYPOGRAPHY.letterSpacing.wider};
  text-align: ${({ $align }: { $align?: 'left' | 'center' | 'right' }) => $align || 'left'};
`;

export const AsksContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column-reverse;
  overflow-y: auto;
  overflow-x: hidden;
  
  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: ${COLORS.border.default};
    border-radius: 2px;
  }
`;

export const BidsContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  overflow-x: hidden;
  
  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: ${COLORS.border.default};
    border-radius: 2px;
  }
`;

export const SpreadRow = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: ${SPACING[3]};
  padding: ${SPACING[2]} ${SPACING[3]};
  background: ${COLORS.bg.primary};
  border-top: 1px solid ${COLORS.border.subtle};
  border-bottom: 1px solid ${COLORS.border.subtle};
  font-size: ${TYPOGRAPHY.fontSize.sm};
  color: ${COLORS.text.secondary};
  min-height: 32px;
`;

export const SpreadLabel = styled.span`
  color: ${COLORS.text.tertiary};
`;

export const MidPrice = styled.span<{ $direction: 'up' | 'down' | 'unchanged' }>`
  font-weight: ${TYPOGRAPHY.fontWeight.semibold};
  font-size: ${TYPOGRAPHY.fontSize.md};
  color: ${({ $direction }: { $direction: 'up' | 'down' | 'unchanged' }) =>
    $direction === 'up' ? COLORS.semantic.positive.main :
      $direction === 'down' ? COLORS.semantic.negative.main :
        COLORS.text.primary
  };
  display: flex;
  align-items: center;
  gap: ${SPACING[1]};
`;

export const DirectionIcon = styled.span<{ $direction: 'up' | 'down' }>`
  display: inline-flex;
  font-size: 10px;
  color: ${({ $direction }: { $direction: 'up' | 'down' }) =>
    $direction === 'up' ? COLORS.semantic.positive.main : COLORS.semantic.negative.main
  };
`;

export const LevelRow = styled.div<{
  $side: 'bid' | 'ask';
  $depth: number;
  $isHovered?: boolean;
  $flash?: 'up' | 'down' | null;
}>`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  padding: 3px ${SPACING[2]};
  position: relative;
  cursor: pointer;
  min-height: 24px;
  align-items: center;
  transition: background-color 0.1s ease;
  
  /* Depth bar */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    ${({ $side }: { $side: 'bid' | 'ask' }) => $side === 'bid' ? 'right: 0;' : 'left: 0;'}
    width: ${({ $depth }: { $depth: number }) => Math.min(Math.max($depth, 0), 100)}%;
    background: ${({ $side }: { $side: 'bid' | 'ask' }) =>
    $side === 'bid'
      ? 'linear-gradient(to left, rgba(32, 178, 108, 0.15), rgba(32, 178, 108, 0.03))'
      : 'linear-gradient(to right, rgba(239, 68, 68, 0.15), rgba(239, 68, 68, 0.03))'
  };
    transition: width 0.2s ease;
    z-index: 0;
  }
  
  /* Hover state */
  ${({ $isHovered }: { $isHovered?: boolean }) => $isHovered && css`
    background-color: ${COLORS.bg.hover};
  `}
  
  /* Flash animation */
  ${({ $flash }: { $flash?: 'up' | 'down' | null }) => $flash === 'up' && css`
    animation: ${flashGreen} 0.4s ease-out;
  `}
  ${({ $flash }: { $flash?: 'up' | 'down' | null }) => $flash === 'down' && css`
    animation: ${flashRed} 0.4s ease-out;
  `}
  
  &:hover {
    background-color: ${COLORS.bg.hover};
  }
`;

export const Cell = styled.span<{
  $align?: 'left' | 'center' | 'right';
  $color?: string;
  $bold?: boolean;
}>`
  position: relative;
  z-index: 1;
  text-align: ${({ $align }: { $align?: 'left' | 'center' | 'right' }) => $align || 'left'};
  color: ${({ $color }: { $color?: string }) => $color || COLORS.text.primary};
  font-weight: ${({ $bold }: { $bold?: boolean }) => $bold ? TYPOGRAPHY.fontWeight.medium : TYPOGRAPHY.fontWeight.normal};
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const PriceCell = styled(Cell) <{ $side: 'bid' | 'ask' }>`
  color: ${({ $side }: { $side: 'bid' | 'ask' }) =>
    $side === 'bid' ? COLORS.semantic.positive.main : COLORS.semantic.negative.main
  };
  font-weight: ${TYPOGRAPHY.fontWeight.medium};
`;

export const Tooltip = styled.div<{ $visible: boolean; $x: number; $y: number }>`
  position: fixed;
  left: ${({ $x }: { $x: number }) => $x}px;
  top: ${({ $y }: { $y: number }) => $y}px;
  padding: ${SPACING[2]} ${SPACING[3]};
  background: ${COLORS.bg.elevated};
  border: 1px solid ${COLORS.border.strong};
  border-radius: ${EFFECTS.borderRadius.base};
  box-shadow: ${EFFECTS.shadow.lg};
  font-size: ${TYPOGRAPHY.fontSize.sm};
  color: ${COLORS.text.primary};
  pointer-events: none;
  opacity: ${({ $visible }: { $visible: boolean }) => $visible ? 1 : 0};
  transform: translateX(-50%);
  transition: opacity 0.15s ease;
  z-index: 1000;
  animation: ${fadeIn} 0.15s ease;
  white-space: nowrap;
`;

export const TooltipRow = styled.div`
  display: flex;
  justify-content: space-between;
  gap: ${SPACING[4]};
  
  &:not(:last-child) {
    margin-bottom: ${SPACING[1]};
  }
`;

export const TooltipLabel = styled.span`
  color: ${COLORS.text.tertiary};
`;

export const TooltipValue = styled.span`
  font-weight: ${TYPOGRAPHY.fontWeight.medium};
  font-family: ${TYPOGRAPHY.fontFamily.mono};
`;

export const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: ${SPACING[2]};
  color: ${COLORS.text.tertiary};
  font-size: ${TYPOGRAPHY.fontSize.md};
`;

export const LoadingSpinner = styled.div`
  width: 24px;
  height: 24px;
  border: 2px solid ${COLORS.border.default};
  border-top-color: ${COLORS.semantic.info.main};
  border-radius: 50%;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;
