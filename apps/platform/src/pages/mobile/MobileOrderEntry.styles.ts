import styled, { css } from 'styled-components';

/**
 * Mobile Order Entry Styles
 * Token Reference (from tokens.css):
 * --bg-primary/secondary/tertiary → #0D1117 / #161B22 / #1C2128
 * --border-subtle → #262C36
 * --text-primary/secondary/tertiary → #E6EDF3 / #9AA5B1 / #6E7681
 * --accent → #3B82F6
 * --color-positive/negative → #3FB950 / #F85149
 */

export const Container = styled.div`
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background: var(--bg-primary, #0D1117);
`;

/* ═══════════════════════════════════════════════════════════
 * SIDE TOGGLE
 * ═══════════════════════════════════════════════════════════
 */
export const SideToggle = styled.div`
  display: flex;
  gap: 0.5rem;
  padding: 4px;
  background: var(--bg-secondary, #161B22);
  border-radius: 0.5rem;
  border: 1px solid var(--border-subtle, #262C36);
`;

interface SideBtnProps {
    $active?: boolean;
    $buy?: boolean;
    $sell?: boolean;
}

export const SideBtn = styled.button<SideBtnProps>`
  flex: 1;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.375rem;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease-out;
  background: transparent;
  color: var(--text-tertiary, #6E7681);
  text-transform: uppercase;

  ${({ $active, $buy }) => $active && $buy && css`
    color: white;
    background: var(--color-positive, #3FB950);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  `}

  ${({ $active, $sell }) => $active && $sell && css`
    color: white;
    background: var(--color-negative, #F85149);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  `}
`;

/* ═══════════════════════════════════════════════════════════
 * TYPE TOGGLE
 * ═══════════════════════════════════════════════════════════
 */
export const TypeToggle = styled.div`
  display: flex;
  gap: 0.25rem;
`;

interface TypeBtnProps {
    $active?: boolean;
}

export const TypeBtn = styled.button<TypeBtnProps>`
  flex: 1;
  padding: 0.25rem 0.5rem;
  background: transparent;
  border: none;
  color: var(--text-secondary, #9AA5B1);
  font-size: 0.875rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease-out;
  border-bottom: 2px solid transparent;

  ${({ $active }) => $active && css`
    color: #3B82F6;
    border-bottom-color: #3B82F6;
  `}
`;

/* ═══════════════════════════════════════════════════════════
 * INPUT GROUP
 * ═══════════════════════════════════════════════════════════
 */
export const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

export const LabelRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2px;
`;

export const Label = styled.label`
  font-size: 11px;
  font-weight: 500;
  color: var(--text-tertiary, #6E7681);
  text-transform: uppercase;
`;

export const AvailableHint = styled.span`
  font-size: 11px;
  color: var(--text-tertiary, #6E7681);
`;

export const InputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

export const Input = styled.input`
  width: 100%;
  height: 44px;
  padding: 0 50px 0 0.75rem;
  background: var(--bg-secondary, #161B22);
  border: 1px solid var(--border-subtle, #262C36);
  border-radius: 0.375rem;
  color: var(--text-primary, #E6EDF3);
  font-size: 1.125rem;
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
  font-weight: 700;
  transition: all 0.15s ease-out;

  &:focus {
    outline: none;
    border-color: #3B82F6;
    background: var(--bg-primary, #0D1117);
  }

  &::placeholder {
    color: var(--text-muted, #484F58);
  }
`;

export const InputSuffix = styled.span`
  position: absolute;
  right: 0.75rem;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-tertiary, #6E7681);
`;

/* ═══════════════════════════════════════════════════════════
 * QUICK PRICE BUTTONS
 * ═══════════════════════════════════════════════════════════
 */
export const QuickPriceRow = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 4px;
`;

export const QuickPriceBtn = styled.button`
  flex: 1;
  padding: 4px;
  background: var(--bg-secondary, #161B22);
  border: 1px solid var(--border-subtle, #262C36);
  border-radius: 4px;
  color: var(--text-secondary, #9AA5B1);
  font-size: 10px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease-out;
  text-transform: uppercase;

  &:active {
    background: var(--surface-hover, #262C36);
    border-color: #3B82F6;
    color: #3B82F6;
  }
`;

/* ═══════════════════════════════════════════════════════════
 * SLIDER
 * ═══════════════════════════════════════════════════════════
 */
export const SliderContainer = styled.div`
  margin: 1rem 0 0.5rem;
  padding: 0 0.25rem;
`;

export const SliderWrapper = styled.div`
  position: relative;
  height: 24px;
  display: flex;
  align-items: center;
`;

export const Slider = styled.input`
  -webkit-appearance: none;
  width: 100%;
  height: 4px;
  border-radius: 2px;
  background: var(--bg-secondary, #161B22);
  outline: none;
  margin: 0;
  z-index: 2;

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: var(--text-primary, #E6EDF3);
    border: 2px solid #3B82F6;
    cursor: pointer;
    box-shadow: 0 0 0 4px var(--bg-primary, #0D1117);
  }

  &::-moz-range-thumb {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: var(--text-primary, #E6EDF3);
    border: 2px solid #3B82F6;
    cursor: pointer;
    box-shadow: 0 0 0 4px var(--bg-primary, #0D1117);
  }
`;

interface SliderTrackProps {
    $width: number;
}

export const SliderTrack = styled.div<SliderTrackProps>`
  position: absolute;
  left: 0;
  height: 4px;
  border-radius: 2px;
  background: #3B82F6;
  z-index: 1;
  width: ${({ $width }) => $width}%;
`;

export const SliderSteps = styled.div`
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  transform: translateY(-50%);
  display: flex;
  justify-content: space-between;
  padding: 0;
  z-index: 0;
`;

interface SliderStepProps {
    $active?: boolean;
}

export const SliderStep = styled.div<SliderStepProps>`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--border-subtle, #262C36);
  transform: translateX(-50%);

  ${({ $active }) => $active && css`
    background: #3B82F6;
  `}
`;

export const PercentRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 0.25rem;
`;

interface PercentLabelProps {
    $active?: boolean;
}

export const PercentLabel = styled.span<PercentLabelProps>`
  font-size: 10px;
  color: var(--text-tertiary, #6E7681);
  font-weight: 500;
  width: 24px;
  text-align: center;

  ${({ $active }) => $active && css`
    color: #3B82F6;
    font-weight: 700;
  `}
`;

/* ═══════════════════════════════════════════════════════════
 * SUBMIT BUTTON
 * ═══════════════════════════════════════════════════════════
 */
interface SubmitBtnProps {
    $buy?: boolean;
    $sell?: boolean;
}

export const SubmitBtn = styled.button<SubmitBtnProps>`
  width: 100%;
  height: 52px;
  border: none;
  border-radius: 0.5rem;
  font-size: 1.125rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease-out;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-top: 0.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);

  &:active:not(:disabled) {
    transform: scale(0.98);
    opacity: 0.9;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background: var(--bg-secondary, #161B22);
    color: var(--text-tertiary, #6E7681);
    box-shadow: none;
  }

  ${({ $buy }) => $buy && css`
    background: var(--color-positive, #3FB950);
    color: white;
  `}

  ${({ $sell }) => $sell && css`
    background: var(--color-negative, #F85149);
    color: white;
  `}
`;
