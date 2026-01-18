import styled, { css } from 'styled-components';

/**
 * Mobile Wallet Page Styles
 * Token Reference (from tokens.css):
 * --bg-primary/secondary/tertiary → #0D1117 / #161B22 / #1C2128
 * --border-subtle → #262C36
 * --text-primary/secondary/tertiary → #E6EDF3 / #9AA5B1 / #6E7681
 * --accent → #3B82F6
 */

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg-primary, #0D1117);
`;

const ScrollContent = styled.div`
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  display: flex;
  flex-direction: column;
`;

const SimulatedBadge = styled.span`
  padding: 0.25rem 0.5rem;
  background: rgba(210, 153, 34, 0.15);
  color: var(--color-warning, #D29922);
  font-size: 10px;
  font-weight: 600;
  border-radius: 0.25rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
`;

/* ═══════════════════════════════════════════════════════════
 * ONBOARDING
 * ═══════════════════════════════════════════════════════════
 */
const OnboardingWrapper = styled.div`
  flex: 1;
  padding: 0.75rem;
`;

const OnboardingBanner = styled.div`
  padding: 0.5rem;
  flex-shrink: 0;
`;

/* ═══════════════════════════════════════════════════════════
 * BALANCE CARD
 * ═══════════════════════════════════════════════════════════
 */
const BalanceCard = styled.div`
  position: relative;
  margin: 0.5rem;
  padding: 0.75rem;
  border-radius: 0.5rem;
  overflow: hidden;
  background: linear-gradient(135deg, #3B82F6 0%, #1a365d 100%);
  color: white;
  flex-shrink: 0;
`;

const BalanceCardBg = styled.div`
  position: absolute;
  inset: 0;
  background: 
    radial-gradient(circle at 20% 20%, rgba(255,255,255,0.1) 0%, transparent 50%),
    radial-gradient(circle at 80% 80%, rgba(255,255,255,0.05) 0%, transparent 50%);
  pointer-events: none;
`;

const BalanceHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.25rem;
  position: relative;
  z-index: 1;
`;

const BalanceLabel = styled.span`
  font-size: 0.75rem;
  opacity: 0.8;
`;

const HideBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: rgba(255,255,255,0.1);
  border: none;
  border-radius: 50%;
  color: white;
  cursor: pointer;

  &:active {
    background: rgba(255,255,255,0.2);
  }
`;

const TotalBalance = styled.div`
  display: flex;
  align-items: baseline;
  gap: 2px;
  margin-bottom: 0.5rem;
  position: relative;
  z-index: 1;
`;

const Currency = styled.span`
  font-size: 1.25rem;
  font-weight: 500;
  opacity: 0.8;
`;

const Amount = styled.span`
  font-size: 28px;
  font-weight: 700;
  letter-spacing: -0.02em;
`;

const Equivalent = styled.span`
  font-size: 0.75rem;
  opacity: 0.6;
  margin-left: 4px;
`;

/* ═══════════════════════════════════════════════════════════
 * PERFORMANCE ROW
 * ═══════════════════════════════════════════════════════════
 */
const PerformanceRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem;
  background: rgba(255,255,255,0.1);
  border-radius: 0.375rem;
  margin-bottom: 0.5rem;
  position: relative;
  z-index: 1;
`;

const PerfItem = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1px;
`;

const PerfLabel = styled.span`
  font-size: 9px;
  opacity: 0.7;
  text-transform: uppercase;
`;

interface PerfValueProps {
  $positive?: boolean;
  $negative?: boolean;
}

const PerfValue = styled.span<PerfValueProps>`
  font-size: 0.875rem;
  font-weight: 600;

  ${({ $positive }) => $positive && css`color: #4ade80;`}
  ${({ $negative }) => $negative && css`color: #f87171;`}
`;

const PerfDivider = styled.div`
  width: 1px;
  height: 24px;
  background: rgba(255,255,255,0.2);
`;

/* ═══════════════════════════════════════════════════════════
 * QUICK ACTIONS
 * ═══════════════════════════════════════════════════════════
 */
const QuickActions = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.25rem;
  position: relative;
  z-index: 1;
`;

const ActionBtn = styled.button`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 0.25rem;
  background: transparent;
  border: none;
  color: white;
  cursor: pointer;
  border-radius: 0.25rem;
  transition: all 0.15s ease-out;

  &:active:not(:disabled) {
    background: rgba(255,255,255,0.1);
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  span {
    font-size: 10px;
    font-weight: 500;
  }
`;

const ActionIcons = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: rgba(255,255,255,0.15);
  border-radius: 50%;
`;

/* ═══════════════════════════════════════════════════════════
 * ASSET SECTION
 * ═══════════════════════════════════════════════════════════
 */
const AssetSection = styled.div`
  display: flex;
  flex-direction: column;
  background: var(--bg-secondary, #161B22);
  border-top-left-radius: 0.5rem;
  border-top-right-radius: 0.5rem;
  margin-top: -8px;
  padding-top: 0.5rem;
  flex-shrink: 0;
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 0.75rem 0.5rem;
  flex-shrink: 0;
`;

const SectionTitle = styled.span`
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary, #E6EDF3);
`;

const ToggleBtn = styled.button`
  padding: 2px 0.25rem;
  background: transparent;
  border: none;
  color: #3B82F6;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
`;

const AssetList = styled.div`
  display: flex;
  flex-direction: column;
`;

const MethodsSection = styled.div`
  padding: 0.5rem 0.5rem 1rem;
  background: var(--bg-secondary, #161B22);
`;

interface AssetItemProps {
  $clickable?: boolean;
}

const AssetItem = styled.div<AssetItemProps>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid var(--border-subtle, #262C36);

  ${({ $clickable }) => $clickable && css`
    cursor: pointer;

    &:active {
      background: var(--surface-hover, #262C36);
    }
  `}
`;

const AssetIcons = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: var(--bg-tertiary, #1C2128);
  border-radius: 50%;
  font-size: 10px;
  font-weight: 700;
  color: var(--text-secondary, #9AA5B1);
  flex-shrink: 0;
`;

const AssetInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
`;

const AssetName = styled.span`
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary, #E6EDF3);
`;

const AssetFullName = styled.span`
  font-size: 10px;
  color: var(--text-tertiary, #6E7681);
`;

const AssetBalance = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 1px;
`;

const BalanceAmount = styled.span`
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-primary, #E6EDF3);
`;

const BalanceValue = styled.span`
  font-size: 10px;
  color: var(--text-tertiary, #6E7681);
`;

const AssetArrow = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-tertiary, #6E7681);
  flex-shrink: 0;
  margin-left: 0.25rem;
  opacity: 0.6;
  transition: opacity 0.15s ease-out, transform 0.15s ease-out;

  ${AssetItem}:active & {
    opacity: 1;
    transform: translateX(2px);
  }
`;

/* ═══════════════════════════════════════════════════════════
 * EMPTY STATE
 * ═══════════════════════════════════════════════════════════
 */
const EmptyAssets = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem 0.75rem;
  color: var(--text-tertiary, #6E7681);
`;

const DepositPromptBtn = styled.button`
  padding: 0.5rem 1rem;
  background: #3B82F6;
  border: none;
  border-radius: 0.375rem;
  color: white;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease-out;

  &:active {
    opacity: 0.9;
    transform: scale(0.98);
  }
`;

export { Container, ScrollContent, SimulatedBadge, OnboardingWrapper, OnboardingBanner, BalanceCard, BalanceCardBg, BalanceHeader, BalanceLabel, HideBtn, TotalBalance, Currency, Amount, Equivalent, PerformanceRow, PerfItem, PerfLabel, PerfValue, PerfDivider, QuickActions, ActionBtn, ActionIcons, AssetSection, SectionHeader, SectionTitle, ToggleBtn, AssetList, MethodsSection, AssetItem, AssetIcons, AssetInfo, AssetName, AssetFullName, AssetBalance, BalanceAmount, BalanceValue, AssetArrow, EmptyAssets, DepositPromptBtn };
export type { AssetItemProps };

