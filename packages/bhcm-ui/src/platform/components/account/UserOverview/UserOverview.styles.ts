import styled from 'styled-components';

/**
 * Token Mapping Reference (from tokens.css):
 * --surface-primary   → var(--bg-secondary, #161B22)
 * --surface-secondary → var(--bg-secondary, #161B22)
 * --surface-tertiary  → var(--bg-tertiary, #1C2128)
 * --border-primary    → var(--border, #30363D)
 * --border-secondary  → var(--border-subtle, #262C36)
 * --text-primary      → var(--text-primary, #E6EDF3)
 * --text-secondary    → var(--text-secondary, #9AA5B1)
 * --text-tertiary     → var(--text-tertiary, #6E7681)
 * --brand-500         → #3B82F6
 * --brand-600         → #2563EB
 * --status-warning    → var(--color-warning, #D29922)
 * --radius-sm         → 0.25rem
 * --radius-md         → 0.375rem
 * --space-1/2/3/4     → 0.25/0.5/0.75/1rem
 * --font-size-xs/sm   → 0.6875/0.75rem
 * --font-size-md/xl   → 0.8125/1.125rem
 * --font-mono         → 'IBM Plex Mono', monospace
 * --transition-fast   → 0.1s ease-out
 */

/* ═══════════════════════════════════════════════════════════
 * MAIN CONTAINER
 * ═══════════════════════════════════════════════════════════
 * Card container for the entire account overview section.
 */
export const Container = styled.div`
  background: var(--bg-secondary, #161B22);
  border: 1px solid var(--border, #30363D);
  border-radius: 0.375rem; /* 6px */
  padding: 1rem; /* 16px */
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

/* ═══════════════════════════════════════════════════════════
 * NOT LOGGED IN STATE
 * ═══════════════════════════════════════════════════════════
 * Shown when user is not authenticated. Centers content
 * with call-to-action to sign in.
 */
export const NotLoggedInWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 1rem 0;
`;

export const NotLoggedInIcons = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--bg-tertiary, #1C2128);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-tertiary, #6E7681);
  margin-bottom: 0.75rem; /* 12px */
`;

export const NotLoggedInTitle = styled.p`
  font-size: 0.75rem; /* 12px */
  font-weight: 600;
  color: var(--text-primary, #E6EDF3);
  margin: 0 0 0.25rem 0;
`;

export const NotLoggedInDesc = styled.p`
  font-size: 0.6875rem; /* 11px */
  color: var(--text-tertiary, #6E7681);
  margin: 0 0 1rem 0;
`;

export const SignInButton = styled.a`
  display: inline-block;
  padding: 0.5rem 1rem;
  background: #3B82F6;
  color: white;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
  transition: background 0.1s ease-out;

  &:hover {
    background: #2563EB;
  }
`;

/* ═══════════════════════════════════════════════════════════
 * HEADER SECTION
 * ═══════════════════════════════════════════════════════════
 * Avatar + user info row at the top of the panel.
 */
export const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem; /* 12px */
`;

export const AvatarWrapper = styled.div`
  flex-shrink: 0;
`;

export const Avatar = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--border, #30363D);
`;

export const AvatarPlaceholder = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--bg-tertiary, #1C2128);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-tertiary, #6E7681);
  border: 2px solid var(--border, #30363D);
`;

export const UserInfo = styled.div`
  flex: 1;
  min-width: 0; /* Allows text truncation in flex child */
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

export const DisplayName = styled.span`
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-primary, #E6EDF3);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const AccountId = styled.span`
  font-size: 10px;
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
  color: var(--text-tertiary, #6E7681);
`;

/* ═══════════════════════════════════════════════════════════
 * EQUITY SECTION
 * ═══════════════════════════════════════════════════════════
 * Prominent display of total equity with gradient background.
 */
export const EquitySection = styled.div`
  padding: 0.75rem;
  background: linear-gradient(
    135deg,
    var(--bg-secondary, #161B22) 0%,
    var(--bg-tertiary, #1C2128) 100%
  );
  border-radius: 0.25rem;
  text-align: center;
`;

export const EquityLabel = styled.div`
  font-size: 10px;
  font-weight: 600;
  color: var(--text-tertiary, #6E7681);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.25rem;
`;

export const EquityValue = styled.div`
  font-size: 1.125rem; /* 18px */
  font-weight: 700;
  color: var(--text-primary, #E6EDF3);
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 2px;
`;

export const CurrencySymbol = styled.span`
  font-size: 0.8125rem; /* 13px */
  color: var(--text-secondary, #9AA5B1);
`;

export const CurrencyCode = styled.span`
  font-size: 0.6875rem;
  color: var(--text-tertiary, #6E7681);
  margin-left: 0.25rem;
`;

/* ═══════════════════════════════════════════════════════════
 * BALANCE GRID
 * ═══════════════════════════════════════════════════════════
 * Two-column layout for available/frozen balances.
 */
export const BalanceGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
`;

export const BalanceItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

export const BalanceLabel = styled.span`
  font-size: 10px;
  color: var(--text-tertiary, #6E7681);
  text-transform: uppercase;
  letter-spacing: 0.02em;
`;

export const BalanceValue = styled.span`
  font-size: 0.75rem;
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
  color: var(--text-primary, #E6EDF3);
`;

/* ═══════════════════════════════════════════════════════════
 * NO FUNDS PROMPT
 * ═══════════════════════════════════════════════════════════
 * Warning banner shown when wallet is empty.
 */
export const NoFundsPrompt = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.2);
  border-radius: 0.25rem;
  color: var(--color-warning, #D29922);
  font-size: 0.6875rem;
`;

/* ═══════════════════════════════════════════════════════════
 * QUICK ACTIONS
 * ═══════════════════════════════════════════════════════════
 * Row of navigation buttons at the bottom.
 */
export const QuickActions = styled.div`
  display: flex;
  gap: 0.5rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--border-subtle, #262C36);
`;

export const ActionButton = styled.a`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem;
  background: var(--bg-secondary, #161B22);
  border-radius: 0.25rem;
  color: var(--text-secondary, #9AA5B1);
  text-decoration: none;
  font-size: 10px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.1s ease-out;

  &:hover {
    background: var(--bg-tertiary, #1C2128);
    color: #3B82F6;
  }
`;
