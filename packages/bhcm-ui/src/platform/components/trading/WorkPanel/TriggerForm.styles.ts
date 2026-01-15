import styled, { css } from 'styled-components';

/* TriggerForm - Create automation trigger */

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
`;

export const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

export const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

export const Label = styled.label`
  font-size: 12px;
  color: var(--text-secondary, #9AA5B1);
`;

export const InputRow = styled.div`
  display: flex;
  gap: 8px;
`;

export const InputWrapper = styled.div`
  position: relative;
  flex: 1;
`;

export const InputSuffix = styled.span`
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 11px;
  color: var(--text-tertiary, #6E7681);
  pointer-events: none;
`;

export const Toggle = styled.div`
  display: flex;
  background: var(--bg-secondary, #161B22);
  border-radius: 4px;
  padding: 2px;
`;

interface ToggleBtnProps {
  $active?: boolean;
  $buyActive?: boolean;
  $sellActive?: boolean;
}

export const ToggleBtn = styled.button<ToggleBtnProps>`
  flex: 1;
  border: none;
  background: transparent;
  color: var(--text-secondary, #9AA5B1);
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 3px;
  cursor: pointer;
  transition: all 0.2s;

  ${({ $active }) => $active && css`
    background: var(--bg-tertiary, #1C2128);
    color: var(--text-primary, #E6EDF3);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  `}

  ${({ $buyActive }) => $buyActive && css`
    background: rgba(63, 185, 80, 0.2);
    color: var(--color-positive, #3FB950);
  `}

  ${({ $sellActive }) => $sellActive && css`
    background: rgba(248, 81, 73, 0.2);
    color: var(--color-negative, #F85149);
  `}
`;

export const CheckboxGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 4px;
`;

export const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--text-secondary, #9AA5B1);
  cursor: pointer;
`;

export const Checkbox = styled.input`
  width: 14px;
  height: 14px;
  cursor: pointer;
`;

interface SubmitBtnProps {
  $buy?: boolean;
}

export const SubmitBtn = styled.button<SubmitBtnProps>`
  margin-top: 8px;
  padding: 10px;
  font-weight: 600;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  color: white;
  background: ${({ $buy }) => $buy ? 'var(--color-positive, #3FB950)' : 'var(--color-negative, #F85149)'};

  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

export const CancelBtn = styled.button`
  background: transparent;
  border: 1px solid var(--border, #30363D);
  color: var(--text-secondary, #9AA5B1);
  padding: 6px;
  font-size: 12px;
  border-radius: 4px;
  cursor: pointer;
`;

/* Compact Form Styles */
export const CompactContainer = styled.div`
  padding: 8px 10px;
  height: 100%;
  display: flex;
  flex-direction: column;
`;

export const CompactForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
`;

export const CompactRow = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 8px;
`;

export const CompactField = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

export const CompactLabel = styled.label`
  font-size: 9px;
  font-weight: 600;
  color: var(--text-tertiary, #6E7681);
  text-transform: uppercase;
  letter-spacing: 0.03em;
`;

export const CompactToggle = styled.div`
  display: flex;
  background: var(--bg-tertiary, #1C2128);
  border-radius: 0.25rem;
  padding: 2px;
  gap: 2px;
`;

interface CompactBtnProps {
  $active?: boolean;
  $buy?: boolean;
  $sell?: boolean;
}

export const CompactBtn = styled.button<CompactBtnProps>`
  padding: 4px 8px;
  font-size: 10px;
  font-weight: 600;
  background: transparent;
  border: none;
  border-radius: 3px;
  color: var(--text-tertiary, #6E7681);
  cursor: pointer;
  transition: all 0.1s ease-out;

  ${({ $active }) => $active && css`
    background: var(--bg-secondary, #161B22);
    color: var(--text-primary, #E6EDF3);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  `}

  ${({ $active, $buy }) => $active && $buy && css`
    background: rgba(63, 185, 80, 0.2);
    color: var(--color-positive, #3FB950);
  `}

  ${({ $active, $sell }) => $active && $sell && css`
    background: rgba(248, 81, 73, 0.2);
    color: var(--color-negative, #F85149);
  `}
`;

export const CompactInputWrap = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

export const CompactInput = styled.input`
  width: 100%;
  padding: 5px 32px 5px 8px;
  font-size: 11px;
  background: var(--bg-tertiary, #1C2128);
  border: 1px solid var(--border-subtle, #262C36);
  border-radius: 0.25rem;
  color: var(--text-primary, #E6EDF3);
  font-family: 'IBM Plex Mono', monospace;

  &:focus { outline: none; border-color: var(--accent, #58A6FF); }
  &::placeholder { color: var(--text-tertiary, #6E7681); }
`;

export const CompactSuffix = styled.span`
  position: absolute;
  right: 6px;
  font-size: 9px;
  color: var(--text-tertiary, #6E7681);
  pointer-events: none;
`;

export const CompactSelect = styled.select`
  padding: 5px 6px;
  font-size: 10px;
  background: var(--bg-tertiary, #1C2128);
  border: 1px solid var(--border-subtle, #262C36);
  border-radius: 0.25rem;
  color: var(--text-primary, #E6EDF3);
  cursor: pointer;
  min-width: 50px;

  &:focus { outline: none; border-color: var(--accent, #58A6FF); }
`;

export const CompactOptions = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: auto;
`;

export const CompactCheckbox = styled.label`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 9px;
  color: var(--text-tertiary, #6E7681);
  cursor: pointer;
  white-space: nowrap;
  transition: color 0.1s ease-out;

  &:hover { color: var(--text-secondary, #9AA5B1); }

  input {
    width: 12px;
    height: 12px;
    cursor: pointer;
  }
`;

export const CompactSubmit = styled.button<SubmitBtnProps>`
  margin-top: auto;
  padding: 5px 10px;
  font-size: 10px;
  font-weight: 600;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
  transition: all 0.1s ease-out;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  color: white;
  background: ${({ $buy }) => $buy ? 'var(--color-positive, #3FB950)' : 'var(--color-negative, #F85149)'};

  &:hover { filter: brightness(1.1); }
  &:active { transform: scale(0.98); }
`;
