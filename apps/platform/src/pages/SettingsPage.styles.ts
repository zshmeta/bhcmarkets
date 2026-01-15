import styled, { css } from 'styled-components';

/**
 * Token Reference (from tokens.css):
 * --bg-primary           → var(--bg-primary, #0D1117)
 * --surface-primary/secondary → #161B22 / #1C2128
 * --border-primary/secondary → #30363D / #262C36
 * --text-primary/secondary/tertiary → #E6EDF3 / #9AA5B1 / #6E7681
 * --brand-50/400/500/600 → rgba(59,130,246,0.1) / #60A5FA / #3B82F6 / #2563EB
 * --space-1/2/3/4/5/6    → 0.25/0.5/0.75/1/1.25/1.5rem
 * --radius-sm/md/lg      → 0.25/0.375/0.5rem
 */

/* ═══════════════════════════════════════════════════════════
 * CONTAINER
 * ═══════════════════════════════════════════════════════════
 */
export const Container = styled.div`
  display: flex;
  height: 100%;
  background: var(--bg-primary, #0D1117);
  overflow: hidden;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

export const NotLoggedIn = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  color: var(--text-tertiary, #6E7681);
`;

/* ═══════════════════════════════════════════════════════════
 * SIDEBAR
 * ═══════════════════════════════════════════════════════════
 */
export const Sidebar = styled.div`
  width: 240px;
  flex-shrink: 0;
  background: var(--surface-primary, #161B22);
  border-right: 1px solid var(--border-primary, #30363D);
  display: flex;
  flex-direction: column;

  @media (max-width: 768px) {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid var(--border-primary, #30363D);
  }
`;

export const SidebarHeader = styled.div`
  padding: 1.5rem 1.25rem;
  border-bottom: 1px solid var(--border-secondary, #262C36);
`;

export const SidebarTitle = styled.h2`
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--text-primary, #E6EDF3);
  margin: 0;
`;

export const Nav = styled.nav`
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;

  @media (max-width: 768px) {
    flex-direction: row;
    overflow-x: auto;
    padding: 0.5rem;
    gap: 0.5rem;
  }
`;

interface NavItemProps {
    $active?: boolean;
}

export const NavItem = styled.button<NavItemProps>`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: transparent;
  border: none;
  border-radius: 0.375rem;
  color: var(--text-secondary, #9AA5B1);
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.1s ease-out;
  text-align: left;

  &:hover {
    background: var(--surface-secondary, #1C2128);
    color: var(--text-primary, #E6EDF3);
  }

  ${({ $active }) =>
        $active &&
        css`
      background: rgba(59, 130, 246, 0.15);
      color: #60A5FA;
    `}

  @media (max-width: 768px) {
    flex-shrink: 0;
    padding: 0.5rem 0.75rem;
  }
`;

/* ═══════════════════════════════════════════════════════════
 * CONTENT
 * ═══════════════════════════════════════════════════════════
 */
export const Content = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;

  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

export const Section = styled.section`
  max-width: 640px;
`;

export const SectionHeader = styled.div`
  margin-bottom: 1.5rem;
`;

export const SectionTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary, #E6EDF3);
  margin: 0 0 0.5rem 0;
`;

export const SectionDesc = styled.p`
  font-size: 0.75rem;
  color: var(--text-tertiary, #6E7681);
  margin: 0;
`;

/* ═══════════════════════════════════════════════════════════
 * CARD
 * ═══════════════════════════════════════════════════════════
 */
export const Card = styled.div`
  background: var(--surface-primary, #161B22);
  border: 1px solid var(--border-primary, #30363D);
  border-radius: 0.5rem;
  padding: 1.5rem;
  margin-bottom: 1.25rem;
`;

export const CardTitle = styled.h4`
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary, #E6EDF3);
  margin: 0 0 1.25rem 0;
`;

export const AvatarSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding-bottom: 1.5rem;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid var(--border-secondary, #262C36);
`;

/* ═══════════════════════════════════════════════════════════
 * FORM
 * ═══════════════════════════════════════════════════════════
 */
export const FormGroup = styled.div`
  margin-bottom: 1.25rem;
`;

export const FieldLabel = styled.label`
  display: block;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--text-secondary, #9AA5B1);
  margin-bottom: 0.5rem;
`;

export const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  background: var(--surface-secondary, #1C2128);
  border: 1px solid var(--border-primary, #30363D);
  border-radius: 0.25rem;
  color: var(--text-primary, #E6EDF3);
  font-size: 0.75rem;
  transition: all 0.1s ease-out;

  &:focus {
    outline: none;
    border-color: #3B82F6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

export const Select = styled.select`
  width: 100%;
  padding: 0.75rem;
  background: var(--surface-secondary, #1C2128);
  border: 1px solid var(--border-primary, #30363D);
  border-radius: 0.25rem;
  color: var(--text-primary, #E6EDF3);
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.1s ease-out;

  &:focus {
    outline: none;
    border-color: #3B82F6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

export const Textarea = styled.textarea`
  width: 100%;
  padding: 0.75rem;
  background: var(--surface-secondary, #1C2128);
  border: 1px solid var(--border-primary, #30363D);
  border-radius: 0.25rem;
  color: var(--text-primary, #E6EDF3);
  font-size: 0.75rem;
  resize: vertical;
  min-height: 80px;
  transition: all 0.1s ease-out;

  &:focus {
    outline: none;
    border-color: #3B82F6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

export const FieldHint = styled.span`
  display: block;
  font-size: 0.6875rem;
  color: var(--text-tertiary, #6E7681);
  margin-top: 0.25rem;
`;

/* ═══════════════════════════════════════════════════════════
 * MESSAGES
 * ═══════════════════════════════════════════════════════════
 */
export const ErrorMessage = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 0.25rem;
  color: #EF4444;
  font-size: 0.75rem;
  margin-bottom: 1rem;
`;

export const SuccessMessage = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.3);
  border-radius: 0.25rem;
  color: #22C55E;
  font-size: 0.75rem;
  margin-bottom: 1rem;
`;

/* ═══════════════════════════════════════════════════════════
 * FORM ACTIONS
 * ═══════════════════════════════════════════════════════════
 */
export const FormActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-secondary, #262C36);
`;

export const PrimaryBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  background: #3B82F6;
  color: white;
  border: none;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.1s ease-out;

  &:hover {
    background: #2563EB;
  }
`;

/* ═══════════════════════════════════════════════════════════
 * OPTION GROUP
 * ═══════════════════════════════════════════════════════════
 */
export const OptionGroup = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

interface OptionBtnProps {
    $selected?: boolean;
}

export const OptionBtn = styled.button<OptionBtnProps>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: var(--surface-secondary, #1C2128);
  border: 1px solid var(--border-primary, #30363D);
  border-radius: 0.25rem;
  color: var(--text-secondary, #9AA5B1);
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.1s ease-out;

  &:hover {
    border-color: #60A5FA;
    color: var(--text-primary, #E6EDF3);
  }

  ${({ $selected }) =>
        $selected &&
        css`
      background: rgba(59, 130, 246, 0.15);
      border-color: #3B82F6;
      color: #60A5FA;
    `}
`;

/* ═══════════════════════════════════════════════════════════
 * INFO ROWS
 * ═══════════════════════════════════════════════════════════
 */
export const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--border-secondary, #262C36);

  &:last-child {
    border-bottom: none;
  }
`;

export const InfoLabel = styled.span`
  font-size: 0.75rem;
  color: var(--text-tertiary, #6E7681);
`;

export const InfoValue = styled.span`
  font-size: 0.75rem;
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
  color: var(--text-primary, #E6EDF3);
`;
