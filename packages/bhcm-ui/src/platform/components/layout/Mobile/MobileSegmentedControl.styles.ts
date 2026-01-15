import styled, { css } from 'styled-components';

/* MobileSegmentedControl - Pills/underline tabs */

interface ContainerProps {
  $variant: 'pills' | 'underline';
  $scrollable?: boolean;
}

export const Container = styled.div<ContainerProps>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  padding: 0.25rem 1rem;
  position: relative;
  width: 100%;

  ${({ $variant }) => $variant === 'pills' && css`
    background: var(--bg-tertiary, #1C2128);
    border-radius: 1rem;
    padding: 4px;
    gap: 4px;
  `}

  ${({ $variant }) => $variant === 'underline' && css`
    background: transparent;
    border-bottom: 1px solid var(--border-subtle, #262C36);
    padding: 0 0.5rem;
    gap: 0.5rem;
    min-height: 40px;
  `}

  ${({ $scrollable }) => $scrollable && css`
    overflow-x: auto;
    overflow-y: hidden;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    padding: 0 1rem;
    justify-content: flex-start;

    &::-webkit-scrollbar { display: none; }
  `}
`;

interface SegmentProps {
  $active: boolean;
  $variant: 'pills' | 'underline';
}

export const Segment = styled.button<SegmentProps>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  background: transparent;
  border: none;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

  ${({ $variant, $active }) => $variant === 'pills' && css`
    flex: 1;
    min-width: 0;
    padding: 8px 0.75rem;
    border-radius: 0.5rem;
    color: ${$active ? 'var(--text-primary, #E6EDF3)' : 'var(--text-secondary, #9AA5B1)'};
    font-size: 0.75rem;
    font-weight: 600;
    ${$active && css`
      background: var(--bg-secondary, #161B22);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      transform: scale(1.02);
    `}
    &:active:not([data-active="true"]) { background: var(--surface-hover, #262C36); }
  `}

  ${({ $variant, $active }) => $variant === 'underline' && css`
    flex: none;
    padding: 0.5rem 0.75rem;
    color: ${$active ? 'var(--accent, #58A6FF)' : 'var(--text-tertiary, #6E7681)'};
    font-size: 0.75rem;
    font-weight: 600;
    opacity: ${$active ? 1 : 0.7};
    ${$active && css`transform: translateY(-1px);`}
  `}
`;

export const Indicator = styled.div`
  position: absolute;
  bottom: 0;
  height: 3px;
  background: var(--accent, #58A6FF);
  border-radius: 4px 4px 0 0;
  transition: all 0.3s cubic-bezier(0.65, 0, 0.35, 1);
  box-shadow: 0 -2px 6px rgba(88, 166, 255, 0.3);
`;

export const Badge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  background: var(--color-error, #F85149);
  color: white;
  font-size: 10px;
  font-weight: 700;
  border-radius: 9999px;
  margin-left: 2px;
`;

export const Label = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const IconsWrapper = styled.span`
  display: flex;
  align-items: center;
`;
