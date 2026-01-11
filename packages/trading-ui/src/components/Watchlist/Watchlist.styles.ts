
import styled, { keyframes, css } from 'styled-components';
import { COLORS, TYPOGRAPHY, SPACING, EFFECTS, SIZING } from '../../theme';

// =============================================================================
// ANIMATIONS
// =============================================================================

export const flashBg = keyframes`
  0% { background-color: rgba(255, 255, 255, 0.1); }
  100% { background-color: transparent; }
`;

export const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(-4px); }
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
  font-family: ${TYPOGRAPHY.fontFamily.sans};
  box-shadow: ${EFFECTS.shadow.sm};
  border: 1px solid ${COLORS.border.subtle};
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

export const TitleText = styled.span`
  font-weight: ${TYPOGRAPHY.fontWeight.semibold};
  font-size: ${TYPOGRAPHY.fontSize.sm};
  color: ${COLORS.text.primary};
  text-transform: uppercase;
  letter-spacing: ${TYPOGRAPHY.letterSpacing.wide};
`;

export const HeaderActions = styled.div`
  display: flex;
  gap: ${SPACING[1]};
`;

export const IconButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  border-radius: ${EFFECTS.borderRadius.sm};
  background: transparent;
  color: ${COLORS.text.tertiary};
  cursor: pointer;
  transition: ${EFFECTS.transition.fast};
  
  &:hover {
    background: ${COLORS.bg.hover};
    color: ${COLORS.text.primary};
  }
  
  svg {
    width: 14px;
    height: 14px;
  }
`;


// Category Tabs
export const CategoryTabs = styled.div`
  display: flex;
  gap: ${SPACING[1]};
  padding: ${SPACING[2]} ${SPACING[3]};
  background: ${COLORS.bg.secondary};
  border-bottom: 1px solid ${COLORS.border.subtle};
  overflow-x: auto;
  
  &::-webkit-scrollbar {
    display: none;
  }
`;

export const CategoryTab = styled.button<{ $active?: boolean }>`
  position: relative;
  padding: ${SPACING[1]} ${SPACING[3]};
  border: none;
  border-radius: ${EFFECTS.borderRadius.full};
  background: ${({ $active }: { $active?: boolean }) => $active ? COLORS.semantic.info.bg : 'transparent'};
  color: ${({ $active }: { $active?: boolean }) => $active ? COLORS.semantic.info.main : COLORS.text.tertiary};
  font-size: ${TYPOGRAPHY.fontSize.sm};
  font-weight: ${TYPOGRAPHY.fontWeight.medium};
  cursor: pointer;
  transition: ${EFFECTS.transition.base};
  white-space: nowrap;
  
  &:hover {
    background: ${({ $active }: { $active?: boolean }) => $active ? COLORS.semantic.info.bg : COLORS.bg.hover};
    color: ${({ $active }: { $active?: boolean }) => $active ? COLORS.semantic.info.main : COLORS.text.secondary};
  }
`;

// Search
export const SearchContainer = styled.div`
  padding: ${SPACING[2]} ${SPACING[3]};
  border-bottom: 1px solid ${COLORS.border.subtle};
  background: ${COLORS.bg.secondary};
`;

export const SearchWrapper = styled.div`
  position: relative;
`;

export const SearchIcon = styled.div`
  position: absolute;
  left: ${SPACING[3]};
  top: 50%;
  transform: translateY(-50%);
  color: ${COLORS.text.tertiary};
  pointer-events: none;
  
  svg {
    width: 14px;
    height: 14px;
  }
`;

export const SearchInput = styled.input`
  width: 100%;
  padding: ${SPACING[2]} ${SPACING[3]} ${SPACING[2]} 36px;
  border: 1px solid ${COLORS.border.default};
  border-radius: ${EFFECTS.borderRadius.base};
  background: ${COLORS.bg.primary};
  color: ${COLORS.text.primary};
  font-size: ${TYPOGRAPHY.fontSize.sm};
  transition: ${EFFECTS.transition.base};
  
  &:focus {
    outline: none;
    border-color: ${COLORS.border.focus};
    box-shadow: 0 0 0 3px ${COLORS.semantic.info.bg};
  }
  
  &::placeholder {
    color: ${COLORS.text.tertiary};
  }
`;

export const ClearButton = styled.button`
  position: absolute;
  right: ${SPACING[2]};
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border: none;
  border-radius: ${EFFECTS.borderRadius.full};
  background: ${COLORS.bg.elevated};
  color: ${COLORS.text.tertiary};
  cursor: pointer;
  transition: ${EFFECTS.transition.fast};
  
  &:hover {
    background: ${COLORS.bg.hover};
    color: ${COLORS.text.primary};
  }
  
  svg {
    width: 10px;
    height: 10px;
  }
`;

// List
export const List = styled.div`
  flex: 1;
  overflow-y: auto;
  background: ${COLORS.bg.primary};
  
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
  &::-webkit-scrollbar-thumb:hover {
    background: ${COLORS.border.strong};
  }
`;

export const ListHeader = styled.div`
  display: grid;
  grid-template-columns: 1fr auto auto auto;
  gap: ${SPACING[3]};
  padding: ${SPACING[1]} ${SPACING[3]};
  background: ${COLORS.bg.secondary};
  border-bottom: 1px solid ${COLORS.border.subtle};
  position: sticky;
  top: 0;
  z-index: 1;
`;

// ListHeaderCell
export const ListHeaderCell = styled.span<{ $align?: 'left' | 'right' }>`
  font-size: ${TYPOGRAPHY.fontSize.xs};
  font-weight: ${TYPOGRAPHY.fontWeight.medium};
  color: ${COLORS.text.tertiary};
  text-transform: uppercase;
  letter-spacing: ${TYPOGRAPHY.letterSpacing.wider};
  text-align: ${({ $align }: { $align?: 'left' | 'right' }) => $align || 'left'};
`;

export const WatchlistRow = styled.div<{ $selected?: boolean; $flash?: boolean }>`
  display: grid;
  grid-template-columns: 1fr auto auto auto;
  gap: ${SPACING[3]};
  align-items: center;
  padding: ${SPACING[2]} ${SPACING[3]};
  border-bottom: 1px solid ${COLORS.border.subtle};
  cursor: pointer;
  transition: background-color 0.15s ease;
  animation: ${fadeIn} 0.2s ease;
  
  ${({ $selected }: { $selected?: boolean }) => $selected && css`
    background: ${COLORS.semantic.info.bg};
    border-left: 2px solid ${COLORS.semantic.info.main};
    padding-left: calc(${SPACING[3]} - 2px);
  `}
  
  ${({ $flash }: { $flash?: boolean }) => $flash && css`
    animation: ${flashBg} 0.4s ease-out;
  `}
  
  &:hover {
    background: ${({ $selected }: { $selected?: boolean }) => $selected ? COLORS.semantic.info.bg : COLORS.bg.hover};
  }

  &:last-child {
      border-bottom: none;
  }
`;

export const SymbolCell = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
`;

export const SymbolName = styled.span`
  font-weight: ${TYPOGRAPHY.fontWeight.semibold};
  font-size: ${TYPOGRAPHY.fontSize.md};
  color: ${COLORS.text.primary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const SymbolLabel = styled.span`
  font-size: ${TYPOGRAPHY.fontSize.xs};
  color: ${COLORS.text.tertiary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const PriceCell = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
`;

export const Price = styled.span<{ $direction?: 'up' | 'down' | 'unchanged' }>`
  font-weight: ${TYPOGRAPHY.fontWeight.semibold};
  font-family: ${TYPOGRAPHY.fontFamily.mono};
  font-size: ${TYPOGRAPHY.fontSize.md};
  color: ${({ $direction }: { $direction?: 'up' | 'down' | 'unchanged' }) =>
    $direction === 'up' ? COLORS.semantic.positive.main :
      $direction === 'down' ? COLORS.semantic.negative.main :
        COLORS.text.primary
  };
  transition: color 0.3s ease;
`;

export const Change = styled.span<{ $value: number }>`
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 2px 6px;
  border-radius: ${EFFECTS.borderRadius.sm};
  font-size: ${TYPOGRAPHY.fontSize.xs};
  font-family: ${TYPOGRAPHY.fontFamily.mono};
  font-weight: ${TYPOGRAPHY.fontWeight.medium};
  background: ${({ $value }: { $value: number }) =>
    $value > 0 ? COLORS.semantic.positive.bg :
      $value < 0 ? COLORS.semantic.negative.bg :
        'transparent'
  };
  color: ${({ $value }: { $value: number }) =>
    $value > 0 ? COLORS.semantic.positive.main :
      $value < 0 ? COLORS.semantic.negative.main :
        COLORS.text.secondary
  };
`;

export const SpreadCell = styled.div`
  text-align: right;
  min-width: 50px;
`;

export const SpreadValue = styled.span`
  font-size: ${TYPOGRAPHY.fontSize.xs};
  font-family: ${TYPOGRAPHY.fontFamily.mono};
  color: ${COLORS.text.tertiary};
`;

export const FavoriteButton = styled.button<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border: none;
  background: transparent;
  color: ${({ $active }: { $active?: boolean }) => $active ? COLORS.semantic.warning.main : COLORS.text.tertiary};
  cursor: pointer;
  transition: ${EFFECTS.transition.fast};
  
  &:hover {
    color: ${COLORS.semantic.warning.main};
    transform: scale(1.1);
  }
  
  svg {
    width: 14px;
    height: 14px;
  }
`;

export const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 120px;
  gap: ${SPACING[2]};
  color: ${COLORS.text.tertiary};
  font-size: ${TYPOGRAPHY.fontSize.md};
  
  svg {
    width: 32px;
    height: 32px;
    opacity: 0.5;
  }
`;
