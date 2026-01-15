import styled, { css, keyframes } from 'styled-components';

/**
 * Token Reference (from tokens.css):
 * --bg-primary/secondary/tertiary → #0D1117 / #161B22 / #1C2128
 * --border/border-subtle      → #30363D / #262C36
 * --text-primary/secondary/tertiary → #E6EDF3 / #9AA5B1 / #6E7681
 * --color-price-up/down       → #3FB950 / #F85149
 * --color-error               → #F85149
 * --space-1/2/3               → 0.25/0.5/0.75rem
 * --radius-sm/lg              → 0.25/0.5rem
 * --font-mono                 → 'IBM Plex Mono', monospace
 * --transition-fast           → 0.1s ease-out
 * --z-modal                   → 1000
 */

/* ═══════════════════════════════════════════════════════════
 * ANIMATIONS
 * ═══════════════════════════════════════════════════════════
 */
const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const slideIn = keyframes`
  from {
    opacity: 0;
    transform: scale(0.95) translateY(-10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
`;

/* ═══════════════════════════════════════════════════════════
 * CONTAINER
 * ═══════════════════════════════════════════════════════════
 */
export const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
`;

/* ═══════════════════════════════════════════════════════════
 * HEADER
 * ═══════════════════════════════════════════════════════════
 */
export const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 12px;
  background: var(--bg-tertiary, #1C2128);
  border-bottom: 1px solid var(--border-subtle, #262C36);
  flex-shrink: 0;
`;

export const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

export const HeaderTitle = styled.span`
  font-size: 10px;
  font-weight: 700;
  color: var(--text-tertiary, #6E7681);
  text-transform: uppercase;
  letter-spacing: 0.04em;
`;

export const HeaderStats = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

export const Stat = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

export const StatLabel = styled.span`
  font-size: 9px;
  color: var(--text-tertiary, #6E7681);
  text-transform: uppercase;
`;

export const StatValue = styled.span`
  font-size: 11px;
  font-weight: 600;
  color: var(--text-primary, #E6EDF3);
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
`;

export const ResetBtn = styled.button`
  padding: 2px 6px;
  font-size: 9px;
  font-weight: 600;
  background: transparent;
  border: 1px solid var(--border-subtle, #262C36);
  border-radius: 0.25rem;
  color: var(--text-tertiary, #6E7681);
  cursor: pointer;
  transition: all 0.1s ease-out;
  text-transform: uppercase;

  &:hover {
    border-color: var(--color-error, #F85149);
    color: var(--color-error, #F85149);
  }
`;

/* ═══════════════════════════════════════════════════════════
 * TABLE
 * ═══════════════════════════════════════════════════════════
 */
export const Body = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

export const TableContainer = styled.div`
  flex: 1;
  overflow: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.06) transparent;

  &::-webkit-scrollbar {
    width: 4px;
    height: 4px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.06);
    border-radius: 2px;
  }
`;

export const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 11px;
`;

export const TableHead = styled.thead`
  position: sticky;
  top: 0;
  background: var(--bg-secondary, #161B22);
  z-index: 1;

  th {
    padding: 6px 8px;
    font-size: 9px;
    font-weight: 600;
    color: var(--text-tertiary, #6E7681);
    text-transform: uppercase;
    letter-spacing: 0.03em;
    text-align: left;
    border-bottom: 1px solid var(--border-subtle, #262C36);
    white-space: nowrap;
  }

  th:last-child {
    text-align: right;
  }
`;

export const TableBody = styled.tbody`
  tr {
    border-bottom: 1px solid var(--border-subtle, #262C36);
    transition: background 0.1s ease-out;
  }

  tr:hover {
    background: var(--surface-hover, #262C36);
  }

  td {
    padding: 8px;
    vertical-align: middle;
    white-space: nowrap;
  }
`;

/* ═══════════════════════════════════════════════════════════
 * CELLS
 * ═══════════════════════════════════════════════════════════
 */
export const SymbolCell = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

export const Symbol = styled.span`
  font-weight: 600;
  color: var(--text-primary, #E6EDF3);
`;

interface SideBadgeProps {
  $long?: boolean;
}

export const SideBadge = styled.span<SideBadgeProps>`
  font-size: 9px;
  font-weight: 700;
  padding: 1px 4px;
  border-radius: 2px;
  text-transform: uppercase;

  ${({ $long }) =>
    $long &&
    css`
      background: rgba(34, 197, 94, 0.15);
      color: var(--color-price-up, #3FB950);
    `}
`;

export const NumericCell = styled.td`
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
  color: var(--text-secondary, #9AA5B1);
  text-align: right;
`;

interface PnlCellProps {
  $positive?: boolean;
  $negative?: boolean;
  $pending?: boolean;
}

export const PnlCell = styled.td<PnlCellProps>`
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
  font-weight: 600;
  text-align: right;

  ${({ $positive }) =>
    $positive &&
    css`
      color: var(--color-price-up, #3FB950);
    `}

  ${({ $negative }) =>
    $negative &&
    css`
      color: var(--color-price-down, #F85149);
    `}

  ${({ $pending }) =>
    $pending &&
    css`
      color: var(--text-tertiary, #6E7681);
    `}
`;

export const ActionsCell = styled.td`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
`;

/* ═══════════════════════════════════════════════════════════
 * ACTION BUTTONS
 * ═══════════════════════════════════════════════════════════
 */
export const ActionBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 3px 6px;
  font-size: 9px;
  font-weight: 600;
  background: transparent;
  border: 1px solid var(--border-subtle, #262C36);
  border-radius: 0.25rem;
  color: var(--text-tertiary, #6E7681);
  cursor: pointer;
  transition: all 0.1s ease-out;
  white-space: nowrap;

  &:hover {
    background: var(--surface-hover, #262C36);
    color: var(--text-primary, #E6EDF3);
  }
`;

export const CloseBtn = styled(ActionBtn)`
  border-color: var(--color-price-down, #F85149);
  color: var(--color-price-down, #F85149);

  &:hover {
    background: var(--color-price-down, #F85149);
    color: white;
  }
`;

/* ═══════════════════════════════════════════════════════════
 * EMPTY STATE
 * ═══════════════════════════════════════════════════════════
 */
export const Empty = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-tertiary, #6E7681);
  font-size: 11px;
`;

/* ═══════════════════════════════════════════════════════════
 * BALANCE ROW
 * ═══════════════════════════════════════════════════════════
 */
export const BalanceRow = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 6px 12px;
  background: var(--bg-tertiary, #1C2128);
  border-top: 1px solid var(--border-subtle, #262C36);
  flex-shrink: 0;
`;

export const BalanceItem = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

export const BalanceAsset = styled.span`
  font-size: 10px;
  font-weight: 600;
  color: var(--text-tertiary, #6E7681);
`;

export const BalanceValue = styled.span`
  font-size: 11px;
  font-weight: 600;
  color: var(--text-primary, #E6EDF3);
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
`;

export const BalanceLocked = styled.span`
  font-size: 9px;
  color: var(--text-tertiary, #6E7681);
`;

/* ═══════════════════════════════════════════════════════════
 * MODAL
 * ═══════════════════════════════════════════════════════════
 */
export const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: ${fadeIn} 0.15s ease-out;
`;

export const ModalContent = styled.div`
  background: var(--bg-secondary, #161B22);
  border: 1px solid var(--border, #30363D);
  border-radius: 0.5rem;
  box-shadow: 0 10px 15px rgba(0, 0, 0, 0.15);
  width: 320px;
  max-width: 90vw;
  animation: ${slideIn} 0.2s ease-out;
`;

export const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  border-bottom: 1px solid var(--border-subtle, #262C36);
`;

export const ModalTitle = styled.h3`
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary, #E6EDF3);
  margin: 0;
`;

export const ModalBody = styled.div`
  padding: 0.75rem;
`;

export const ModalMessage = styled.p`
  font-size: 12px;
  color: var(--text-secondary, #9AA5B1);
  margin: 0 0 0.5rem;
  line-height: 1.4;
`;

export const ModalDetail = styled.p`
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary, #E6EDF3);
  margin: 0;
  padding: 0.5rem;
  background: var(--bg-tertiary, #1C2128);
  border-radius: 0.25rem;
  text-align: center;
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
`;

export const ModalActions = styled.div`
  display: flex;
  gap: 0.5rem;
  padding: 0.75rem;
  border-top: 1px solid var(--border-subtle, #262C36);
`;

export const CancelBtn = styled.button`
  flex: 1;
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary, #9AA5B1);
  background: var(--bg-tertiary, #1C2128);
  border: 1px solid var(--border, #30363D);
  border-radius: 0.25rem;
  cursor: pointer;
  transition: all 0.1s ease-out;

  &:hover {
    background: var(--bg-hover, #262C36);
    color: var(--text-primary, #E6EDF3);
  }
`;

export const ConfirmBtn = styled.button`
  flex: 1;
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 600;
  background: var(--color-price-down, #F85149);
  color: white;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
  transition: all 0.1s ease-out;

  &:hover {
    filter: brightness(1.1);
  }
`;

/* ═══════════════════════════════════════════════════════════
 * TPSL MODAL
 * ═══════════════════════════════════════════════════════════
 */
export const TPSLModalOverlay = styled(ModalOverlay)`
  backdrop-filter: blur(2px);
`;

export const TPSLModalContent = styled.div`
  width: 100%;
  max-width: 300px;
`;

export const BlurMask = styled.span`
  filter: blur(4px);
  user-select: none;
  opacity: 0.6;
`;
