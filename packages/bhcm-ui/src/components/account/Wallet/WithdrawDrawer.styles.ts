import styled, { css, keyframes } from 'styled-components';

/* WithdrawDrawer - Slide-in panel for withdrawals */

const slideIn = keyframes`
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
`;

export const Overlay = styled.div`
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 200;
`;

export const Drawer = styled.div`
  position: fixed;
  top: 0; right: 0; bottom: 0;
  width: 400px;
  max-width: 100%;
  background: var(--surface, #0D1117);
  border-left: 1px solid var(--border, #30363D);
  z-index: 201;
  display: flex;
  flex-direction: column;
  animation: ${slideIn} 0.2s ease-out;
`;

export const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  border-bottom: 1px solid var(--border, #30363D);
`;

export const Title = styled.h2`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary, #E6EDF3);
  margin: 0;
`;

export const CloseButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  color: var(--text-secondary, #9AA5B1);
  background: transparent;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
  transition: color 0.1s ease-out;

  &:hover { color: var(--text-primary, #E6EDF3); }
`;

export const Content = styled.div`
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

export const WarningCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.75rem;
  background: rgba(210, 153, 34, 0.1);
  border: 1px solid var(--color-warning, #D29922);
  border-radius: 0.375rem;
`;

export const WarningInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--color-warning, #D29922);
  font-size: 0.75rem;
  font-weight: 500;
`;

export const AddSourceBtn = styled.button`
  width: 100%;
  padding: 0.5rem;
  background: var(--color-warning, #D29922);
  color: white;
  border: none;
  border-radius: 0.25rem;
  font-size: 0.6875rem;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.1s ease-out;

  &:active { opacity: 0.9; }
`;

export const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

export const LabelRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

export const Label = styled.label`
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--text-secondary, #9AA5B1);
`;

export const MaxButton = styled.button`
  font-size: 0.6875rem;
  color: var(--accent, #58A6FF);
  background: transparent;
  border: none;
  cursor: pointer;
  text-decoration: underline;

  &:hover { opacity: 0.8; }
`;

export const AmountInputWrapper = styled.div`
  display: flex;
  align-items: center;
  background: var(--surface-hover, #262C36);
  border: 1px solid var(--border, #30363D);
  border-radius: 0.375rem;
  overflow: hidden;

  &:focus-within { border-color: var(--accent, #58A6FF); }
`;

export const Input = styled.input`
  flex: 1;
  padding: 0.75rem;
  font-size: 1rem;
  font-family: 'IBM Plex Mono', monospace;
  color: var(--text-primary, #E6EDF3);
  background: transparent;
  border: none;
  outline: none;

  &::placeholder { color: var(--text-tertiary, #6E7681); }
`;

export const AmountSuffix = styled.span`
  padding: 0.75rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--text-secondary, #9AA5B1);
  background: var(--bg-tertiary, #1C2128);
  border-left: 1px solid var(--border, #30363D);
`;

export const Error = styled.div`
  font-size: 0.6875rem;
  color: var(--color-error, #F85149);
`;

export const FeeRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
`;

export const FeeLabel = styled.span`
  font-size: 0.75rem;
  color: var(--text-secondary, #9AA5B1);
`;

export const FeeValue = styled.span`
  font-size: 0.75rem;
  font-family: 'IBM Plex Mono', monospace;
  color: var(--text-secondary, #9AA5B1);
`;

export const ReceiveRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: var(--surface-hover, #262C36);
  border-radius: 0.375rem;
`;

export const ReceiveLabel = styled.span`
  font-size: 0.75rem;
  color: var(--text-secondary, #9AA5B1);
`;

export const ReceiveValue = styled.span`
  font-size: 0.875rem;
  font-weight: 600;
  font-family: 'IBM Plex Mono', monospace;
  color: var(--text-primary, #E6EDF3);
`;

export const Select = styled.select`
  padding: 0.75rem;
  font-size: 0.75rem;
  color: var(--text-primary, #E6EDF3);
  background: var(--surface-hover, #262C36);
  border: 1px solid var(--border, #30363D);
  border-radius: 0.375rem;
  outline: none;
  cursor: pointer;

  &:focus { border-color: var(--accent, #58A6FF); }
`;

export const DestinationTypeButtons = styled.div`
  display: flex;
  gap: 0.5rem;
`;

interface ActiveButtonProps {
  $active?: boolean;
}

export const DestinationTypeButton = styled.button<ActiveButtonProps>`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.75rem;
  color: var(--text-secondary, #9AA5B1);
  background: var(--surface-hover, #262C36);
  border: 1px solid var(--border, #30363D);
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.1s ease-out;

  &:hover { border-color: var(--text-secondary, #9AA5B1); }

  ${({ $active }) => $active && css`
    color: var(--accent, #58A6FF);
    border-color: var(--accent, #58A6FF);
    background: rgba(88, 166, 255, 0.1);
  `}
`;

export const NoDestinationsHint = styled.div`
  padding: 0.75rem;
  font-size: 0.75rem;
  color: var(--text-tertiary, #6E7681);
  text-align: center;
  background: var(--surface-hover, #262C36);
  border-radius: 0.375rem;
`;

export const SubmitButton = styled.button`
  padding: 0.75rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: white;
  background: var(--color-error, #F85149);
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: opacity 0.1s ease-out;
  margin-top: 0.5rem;

  &:hover:not(:disabled) { opacity: 0.9; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

export const DoneButton = styled.button`
  padding: 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-primary, #E6EDF3);
  background: var(--surface-hover, #262C36);
  border: 1px solid var(--border, #30363D);
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.1s ease-out;

  &:hover { border-color: var(--text-secondary, #9AA5B1); }
`;
