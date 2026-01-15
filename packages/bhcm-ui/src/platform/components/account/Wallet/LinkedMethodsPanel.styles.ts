import styled, { css, keyframes } from 'styled-components';

/* LinkedMethodsPanel - Bank cards and crypto addresses */

const pulse = keyframes`
  0%, 100% { box-shadow: 0 0 0 0 rgba(88, 166, 255, 0.4); }
  50% { box-shadow: 0 0 0 4px rgba(88, 166, 255, 0); }
`;

export const Container = styled.div`
  display: flex;
  flex-direction: column;
`;

export const Content = styled.div`
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

export const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

export const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--text-secondary, #9AA5B1);
`;

export const EmptyText = styled.div`
  font-size: 0.75rem;
  color: var(--text-tertiary, #6E7681);
  padding: 0.5rem 0;
`;

export const ItemList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

export const CardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
`;

export const BankCard = styled.div`
  position: relative;
  background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
  color: white;
  padding: 1.25rem;
  border-radius: 0.5rem;
  aspect-ratio: 1.586;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  transition: transform 0.15s ease-out;
  border: 1px solid rgba(255, 255, 255, 0.1);

  &:hover { transform: translateY(-4px); }

  &::after {
    content: '';
    position: absolute;
    top: -20%; right: -10%;
    width: 60%; height: 60%;
    background: radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%);
    transform: rotate(15deg);
    pointer-events: none;
  }

  @media (max-width: 480px) {
    aspect-ratio: 1.6;
    padding: 1rem;
  }
`;

export const CardChip = styled.div`
  width: 36px; height: 26px;
  background: linear-gradient(135deg, #fbbf24 0%, #d97706 100%);
  border-radius: 4px;
  position: relative;
  overflow: hidden;

  &::after {
    content: '';
    position: absolute;
    width: 100%; height: 1px;
    background: rgba(0,0,0,0.1);
    top: 50%;
  }
`;

export const CardNumber = styled.div`
  font-family: 'IBM Plex Mono', monospace;
  font-size: 1rem;
  letter-spacing: 0.15em;
  margin: 1rem 0;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.3);

  @media (max-width: 480px) {
    font-size: 0.9375rem;
    margin: 0.5rem 0;
  }
`;

export const CardFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
`;

export const CardHolder = styled.div`
  display: flex;
  flex-direction: column;
`;

export const CardHolderLabel = styled.span`
  font-size: 8px;
  text-transform: uppercase;
  opacity: 0.6;
  letter-spacing: 0.1em;
`;

export const CardHolderName = styled.span`
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 500;
`;

export const BankBrand = styled.div`
  font-size: 0.9375rem;
  font-weight: 700;
  font-style: italic;
  opacity: 0.9;
`;

export const CardActions = styled.div`
  position: absolute;
  top: 0.5rem; right: 0.5rem;
  display: flex;
  gap: 0.25rem;
`;

export const CardDeleteButton = styled.button`
  background: rgba(0,0,0,0.2);
  color: white;
  border: none;
  border-radius: 50%;
  width: 28px; height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.1s ease-out;
  z-index: 2;

  &:hover { background: var(--color-error, #F85149); }
`;

export const Item = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.75rem;
  background: var(--surface-hover, #262C36);
  border-radius: 0.375rem;
`;

export const ItemInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
`;

export const ChainBadge = styled.span`
  font-size: 0.6875rem;
  font-weight: 500;
  padding: 2px 6px;
  background: rgba(88, 166, 255, 0.1);
  color: var(--accent, #58A6FF);
  border-radius: 0.25rem;
`;

export const AddressText = styled.span`
  font-size: 0.75rem;
  font-family: 'IBM Plex Mono', monospace;
  color: var(--text-secondary, #9AA5B1);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const DeleteButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem;
  color: var(--text-tertiary, #6E7681);
  background: transparent;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
  transition: color 0.1s ease-out;

  &:hover { color: var(--color-error, #F85149); }
`;

interface AddButtonProps {
  $highlighted?: boolean;
}

export const AddButton = styled.button<AddButtonProps>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  padding: 0.5rem;
  font-size: 0.75rem;
  color: var(--text-secondary, #9AA5B1);
  background: transparent;
  border: 1px dashed var(--border, #30363D);
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.1s ease-out;

  &:hover {
    color: var(--text-primary, #E6EDF3);
    border-color: var(--text-secondary, #9AA5B1);
  }

  ${({ $highlighted }) => $highlighted && css`
    border-color: var(--accent, #58A6FF);
    color: var(--accent, #58A6FF);
    animation: ${pulse} 2s infinite;
  `}
`;

export const AddForm = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.75rem;
  background: var(--surface-hover, #262C36);
  border-radius: 0.375rem;
`;

export const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
`;

export const Input = styled.input`
  padding: 0.5rem 0.75rem;
  font-size: 0.75rem;
  color: var(--text-primary, #E6EDF3);
  background: var(--surface, #0D1117);
  border: 1px solid var(--border, #30363D);
  border-radius: 0.25rem;
  outline: none;
  transition: border-color 0.1s ease-out;

  &:focus { border-color: var(--accent, #58A6FF); }
  &::placeholder { color: var(--text-tertiary, #6E7681); }
`;

export const Select = styled.select`
  padding: 0.5rem 0.75rem;
  font-size: 0.75rem;
  color: var(--text-primary, #E6EDF3);
  background: var(--surface, #0D1117);
  border: 1px solid var(--border, #30363D);
  border-radius: 0.25rem;
  outline: none;
  transition: border-color 0.1s ease-out;

  &:focus { border-color: var(--accent, #58A6FF); }
`;

export const FormActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 0.25rem;
`;

export const CancelButton = styled.button`
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
  color: var(--text-secondary, #9AA5B1);
  background: transparent;
  border: 1px solid var(--border, #30363D);
  border-radius: 0.25rem;
  cursor: pointer;
  transition: all 0.1s ease-out;

  &:hover {
    color: var(--text-primary, #E6EDF3);
    border-color: var(--text-secondary, #9AA5B1);
  }
`;

export const ConfirmButton = styled.button`
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: white;
  background: var(--accent, #58A6FF);
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
  transition: opacity 0.1s ease-out;

  &:hover:not(:disabled) { opacity: 0.9; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;
