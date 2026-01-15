import styled from 'styled-components';

/**
 * Token Reference (from tokens.css):
 * --bg-primary           → var(--bg-primary, #0D1117)
 * --border               → var(--border, #30363D)
 * --text-primary/secondary/tertiary → #E6EDF3 / #9AA5B1 / #6E7681
 * --accent               → #3B82F6
 * --space-2/3/4          → 0.5/0.75/1rem
 * --radius-sm            → 0.25rem
 */

/* ═══════════════════════════════════════════════════════════
 * CONTAINER
 * ═══════════════════════════════════════════════════════════
 */
export const Container = styled.div`
  background: var(--bg-primary, #0D1117);
  border: 1px solid var(--border, #30363D);
  border-radius: 8px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
`;

/* ═══════════════════════════════════════════════════════════
 * HEADER
 * ═══════════════════════════════════════════════════════════
 */
export const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

export const Title = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary, #E6EDF3);
`;

export const CloseButton = styled.button`
  background: transparent;
  border: none;
  color: var(--text-tertiary, #6E7681);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.1s ease-out;

  &:hover {
    color: var(--text-primary, #E6EDF3);
  }
`;

/* ═══════════════════════════════════════════════════════════
 * FORM
 * ═══════════════════════════════════════════════════════════
 */
export const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

export const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

export const Label = styled.label`
  font-size: 12px;
  color: var(--text-secondary, #9AA5B1);
`;

export const InputWrapper = styled.div`
  position: relative;
`;

export const Input = styled.input`
  width: 100%;
  padding: 8px 12px;
  padding-right: 48px;
  background: var(--bg-secondary, #161B22);
  border: 1px solid var(--border, #30363D);
  border-radius: 4px;
  color: var(--text-primary, #E6EDF3);
  font-size: 12px;
  transition: border-color 0.1s ease-out;

  &:focus {
    outline: none;
    border-color: #3B82F6;
  }

  &::placeholder {
    color: var(--text-tertiary, #6E7681);
  }
`;

export const Suffix = styled.span`
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 11px;
  color: var(--text-tertiary, #6E7681);
`;

/* ═══════════════════════════════════════════════════════════
 * ACTIONS
 * ═══════════════════════════════════════════════════════════
 */
export const Actions = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 8px;
`;

export const SubmitButton = styled.button`
  flex: 1;
  background: #3B82F6;
  color: white;
  border: none;
  padding: 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: filter 0.1s ease-out;

  &:hover {
    filter: brightness(1.1);
  }
`;

export const CancelButton = styled.button`
  flex: 1;
  background: transparent;
  border: 1px solid var(--border, #30363D);
  color: var(--text-secondary, #9AA5B1);
  padding: 8px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.1s ease-out;

  &:hover {
    background: var(--bg-hover, #262C36);
    color: var(--text-primary, #E6EDF3);
  }
`;
