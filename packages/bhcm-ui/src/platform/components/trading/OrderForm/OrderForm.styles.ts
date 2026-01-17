import styled, { css, keyframes } from 'styled-components';

/* ═══════════════════════════════════════════════════════════
 * ORDER ENTRY STYLES
 * ═══════════════════════════════════════════════════════════
 * Clean, minimal design using CSS variables for consistency
 * with rest of application theme.
 */

/* ─── Flash animation for active price box ─── */
const flashBorder = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`;

/* ═══════════════════════════════════════════════════════════
 * CONTAINER
 * ═══════════════════════════════════════════════════════════
 */
export const Container = styled.div<{ $focused?: boolean }>`
  display: flex;
  flex-direction: column;
  width: 100%;
  min-width: 300px;
  background: var(--bg-surface, #161B22);
  border: 1px solid var(--border-subtle, #30363D);
  border-radius: 8px;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  -webkit-font-smoothing: antialiased;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  border: 1px solid var(--border-subtle, #30363D);
  border-radius: 8px;
  padding: 12px;
  margin: 0;

  .card-header {
    padding: 3px 7px;
    border-bottom: 1px solid var(--border-subtle, #30363D);
    background: var(--bg-primary, #0D1117);
  }

  .card-title {
    font-size: 10px;
    font-weight: 600;
    color: var(--text-secondary, #8B949E);
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }
`;

export const Form = styled.form`
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

/* ═══════════════════════════════════════════════════════════
 * ORDER TYPE TABS
 * ═══════════════════════════════════════════════════════════
 */
export const CategoryTabs = styled.div`
  display: flex;
  background: var(--bg-primary, #0D1117);
  padding: 0.5px;
  border-radius: 6px;
  border: 1px solid var(--border-subtle, #30363D);
`;

export const CategoryTab = styled.button<{ $active?: boolean }>`
  flex: 1;
  padding: 8px 12px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s ease;
  
  background: ${({ $active }) => $active ? 'var(--bg-secondary, #21262D)' : 'transparent'};
  color: ${({ $active }) => $active ? 'var(--text-primary, #E6EDF3)' : 'var(--text-tertiary, #6E7681)'};

  &:hover {
    color: var(--text-secondary, #8B949E);
  }
`;

/* ═══════════════════════════════════════════════════════════
 * PRICE BOXES
 * ═══════════════════════════════════════════════════════════
 */
export const PriceBoxContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
`;

export const PriceBox = styled.button<{ $side: 'buy' | 'sell'; $active: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 14px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
  background: var(--bg-primary, #0D1117);
  
  border: 1px solid ${({ $active, $side }) => {
    if (!$active) return 'var(--border-subtle, #30363D)';
    return $side === 'buy' ? 'var(--buy, #3FB950)' : 'var(--sell, #F85149)';
  }};
  
  ${({ $active, $side }) => $active && css`
    background: ${$side === 'buy' ? 'rgba(63, 185, 80, 0.08)' : 'rgba(248, 81, 73, 0.08)'};
    box-shadow: 0 0 0 1px ${$side === 'buy' ? 'var(--buy, #3FB950)' : 'var(--sell, #F85149)'};
    animation: ${flashBorder} 2s ease-in-out infinite;
  `}

  &:hover {
    border-color: ${({ $side }) => $side === 'buy' ? 'var(--buy, #3FB950)' : 'var(--sell, #F85149)'};
  }
`;

export const PriceLabel = styled.span<{ $side: 'buy' | 'sell' }>`
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: ${({ $side }) => $side === 'buy' ? 'var(--buy, #3FB950)' : 'var(--sell, #F85149)'};
  margin-bottom: 4px;
`;

export const BigPrice = styled.span`
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary, #E6EDF3);
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.01em;
`;

/* ═══════════════════════════════════════════════════════════
 * INPUT FIELDS
 * ═══════════════════════════════════════════════════════════
 */
export const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

export const Label = styled.label`
  font-size: 11px;
  color: var(--text-tertiary, #6E7681);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  display: flex;
  align-items: center;
`;

export const InputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  background: var(--bg-primary, #0D1117);
  border: 1px solid var(--border-subtle, #30363D);
  border-radius: 6px;
  transition: border-color 0.15s ease;

  &:focus-within {
    border-color: var(--accent, #58A6FF);
  }
`;

export const Input = styled.input`
  width: 100%;
  background: transparent;
  border: none;
  color: var(--text-primary, #E6EDF3);
  font-size: 14px;
  font-weight: 500;
  font-family: inherit;
  padding: 10px 12px;
  padding-right: 50px;
  font-variant-numeric: tabular-nums;

  &:focus { outline: none; }
  &::placeholder { color: var(--text-disabled, #484F58); }
`;

export const InputSuffix = styled.span`
  position: absolute;
  right: 30px;
  font-size: 11px;
  color: var(--text-tertiary, #6E7681);
  font-weight: 500;
`;

export const StepBtn = styled.button`
  background: transparent;
  border: none;
  border-left: 1px solid var(--border-subtle, #30363D);
  color: var(--text-tertiary, #6E7681);
  width: 32px;
  min-height: 40px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.1s;

  &:first-child {
    border-left: none;
    border-right: 1px solid var(--border-subtle, #30363D);
  }

  &:hover {
    background: var(--bg-secondary, #21262D);
    color: var(--text-primary, #E6EDF3);
  }
`;

/* Quick fill - hidden */
export const QuickFillButtons = styled.div`display: none;`;
export const QuickFillBtn = styled.button``;

/* ═══════════════════════════════════════════════════════════
 * PERCENTAGE BUTTONS
 * ═══════════════════════════════════════════════════════════
 */
export const SliderRow = styled.div`display: none;`;
export const SliderContainer = styled.div`display: none;`;

export const PercentButtons = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
  margin-top: 1px;
`;

export const PercentBtn = styled.button`
  background: var(--bg-primary, #0D1117);
  border: 1px solid var(--border-subtle, #30363D);
  border-radius: 4px;
  padding: 6px 0;
  font-size: 11px;
  font-weight: 500;
  color: var(--text-secondary, #8B949E);
  cursor: pointer;
  transition: all 0.1s;

  &:hover {
    background: var(--bg-secondary, #21262D);
    color: var(--text-primary, #E6EDF3);
    border-color: var(--border, #30363D);
  }
`;

/* ═══════════════════════════════════════════════════════════
 * TP/SL SECTION - Inline with inputs
 * ═══════════════════════════════════════════════════════════
 */
export const TpslContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

export const CheckboxRow = styled.div`
  display: flex;
  gap: 16px;
`;

export const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--text-secondary, #8B949E);
  cursor: pointer;
  
  &:hover { color: var(--text-primary, #E6EDF3); }
`;

/* Minimal toggle - same color scheme as rest */
export const Checkbox = styled.input`
  appearance: none;
  width: 32px;
  height: 16px;
  background: var(--bg-tertiary, #21262D);
  border: 1px solid var(--border-subtle, #30363D);
  border-radius: 8px;
  cursor: pointer;
  position: relative;
  transition: all 0.15s ease;

  &::after {
    content: '';
    position: absolute;
    top: 2px;
    left: 2px;
    width: 10px;
    height: 10px;
    background: var(--text-tertiary, #6E7681);
    border-radius: 50%;
    transition: all 0.15s ease;
  }

  &:checked {
    background: var(--buy, #3FB950);
    border-color: var(--buy, #3FB950);
    
    &::after {
      left: 18px;
      background: #fff;
    }
  }
`;

export const InputGroupSmall = styled(InputGroup)``;
export const LabelSmall = styled(Label)`font-size: 10px;`;
export const InputSmall = styled(Input)`
  font-size: 13px;
  padding: 8px 12px;
  padding-right: 45px;
`;

/* ═══════════════════════════════════════════════════════════
 * ESTIMATED INFO
 * ═══════════════════════════════════════════════════════════
 */
export const EstimatedInfo = styled.div`
  background: var(--bg-primary, #0D1117);
  border: 1px solid var(--border-subtle, #30363D);
  border-radius: 6px;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const EstimatedRow = styled.div`
  display: flex;
  justify-content: space-between;
`;

export const EstimatedLabel = styled.span`
  font-size: 11px;
  color: var(--text-tertiary, #6E7681);
`;

export const EstimatedValue = styled.span`
  font-size: 11px;
  color: var(--text-secondary, #8B949E);
  font-variant-numeric: tabular-nums;
`;

export const TotalRow = styled.div`
  display: flex;
  justify-content: space-between;
  padding-top: 8px;
  border-top: 1px solid var(--border-subtle, #30363D);
`;

export const TotalLabel = styled.span`
  font-size: 11px;
  font-weight: 600;
  color: var(--text-secondary, #8B949E);
  text-transform: uppercase;
`;

export const TotalValue = styled.span`
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary, #E6EDF3);
  font-variant-numeric: tabular-nums;
`;

export const BalanceRow = styled(EstimatedRow)``;
export const BalanceLabel = styled(EstimatedLabel)``;
export const BalanceValue = styled(EstimatedValue)``;

/* ═══════════════════════════════════════════════════════════
 * SUBMIT BUTTON
 * ═══════════════════════════════════════════════════════════
 */
export const SubmitBtn = styled.button<{ $side: 'buy' | 'sell'; disabled?: boolean }>`
  width: 100%;
  padding: 14px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s ease;
  margin-top: 4px;
  
  background: ${({ $side }) => $side === 'buy' ? 'var(--buy, #3FB950)' : 'var(--sell, #F85149)'};
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;

  &:hover:not(:disabled) {
    opacity: 0.9;
  }

  &:disabled {
    background: var(--bg-tertiary, #21262D);
    color: var(--text-secondary, #9AA5B1);
    opacity: 0.7;
    cursor: not-allowed;
  }
  
  .action { font-weight: 600; }
  .price { display: none; }
`;

/* ═══════════════════════════════════════════════════════════
 * COMMENT SECTION
 * ═══════════════════════════════════════════════════════════
 */
export const CommentSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

export const CommentInput = styled.textarea`
  width: 100%;
  background: transparent;
  border: none;
  color: var(--text-primary, #E6EDF3);
  font-size: 12px;
  font-family: inherit;
  padding: 8px 12px;
  min-height: 65px;
  resize: none;
  
  &:focus { outline: none; }
  &::placeholder { color: var(--text-disabled, #484F58); }
`;

/* ═══════════════════════════════════════════════════════════
 * WARNINGS
 * ═══════════════════════════════════════════════════════════
 */
export const FocusBadge = styled.span`display: none;`;

export const ConfidenceWarning = styled.div<{ $level: string }>`
  background: rgba(210, 153, 34, 0.1);
  border-left: 3px solid var(--warning, #D29922);
  padding: 8px 12px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const WarningBar = styled.div<{ $level?: 'degraded' | 'resyncing' | 'stale' }>``;
export const WarningText = styled.span`
  font-size: 11px;
  color: var(--warning, #D29922);
`;

export const DegradedConfirm = styled.div`
  background: var(--bg-secondary, #21262D);
  border: 1px solid var(--border, #30363D);
  padding: 12px;
  border-radius: 6px;
`;

export const ConfirmText = styled.p`
  font-size: 12px;
  color: var(--text-secondary, #8B949E);
  margin-bottom: 10px;
`;

export const ConfirmActions = styled.div`
  display: flex;
  gap: 8px;
`;

export const ConfirmBtn = styled.button`
  flex: 1;
  padding: 8px;
  background: var(--warning, #D29922);
  color: #000;
  border: none;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
`;

export const CancelBtn = styled.button`
  flex: 1;
  padding: 8px;
  background: transparent;
  border: 1px solid var(--border, #30363D);
  color: var(--text-secondary, #8B949E);
  border-radius: 4px;
  font-size: 11px;
  cursor: pointer;

  &:hover { background: var(--bg-tertiary, #21262D); }
`;

/* ═══════════════════════════════════════════════════════════
 * LEGACY - Hidden
 * ═══════════════════════════════════════════════════════════
 */
export const HeaderRow = styled.div`display: flex; gap: 8px;`;
export const SideToggle = styled.div`display: none;`;
export const SideBtn = styled.button<{ $active?: boolean; $side: string }>`display: none;`;
export const TypeToggle = styled.div`
  display: flex;
  background: var(--bg-primary, #0D1117);
  padding: 3px;
  border-radius: 6px;
  border: 1px solid var(--border-subtle, #30363D);
`;
export const TypeBtn = styled.button<{ $active?: boolean }>`
  padding: 8px 16px;
  font-size: 11px;
  font-weight: 600;
  color: ${({ $active }) => $active ? 'var(--text-primary, #E6EDF3)' : 'var(--text-tertiary, #6E7681)'};
  background: ${({ $active }) => $active ? 'var(--bg-secondary, #21262D)' : 'transparent'};
  border: none;
  border-radius: 4px;
  cursor: pointer;
  text-transform: uppercase;
`;

export const QuickActions = styled.div`display: none;`;
export const QuickBtn = styled.button<{ $side: string }>`display: none;`;
export const OcoSection = styled.div`display: none;`;
export const OcoLabel = styled.div`display: none;`;

/* Tooltips */
export const TooltipPopup = styled.div`
  position: absolute;
  bottom: calc(100% + 6px);
  left: 50%;
  transform: translateX(-50%);
  background: var(--bg-tertiary, #21262D);
  border: 1px solid var(--border, #30363D);
  padding: 6px 10px;
  border-radius: 4px;
  font-size: 11px;
  color: var(--text-secondary, #8B949E);
  white-space: nowrap;
  opacity: 0;
  visibility: hidden;
  transition: all 0.1s;
  z-index: 100;
`;

export const TooltipIcons = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 1px solid var(--text-tertiary, #6E7681);
  color: var(--text-tertiary, #6E7681);
  font-size: 8px;
  cursor: help;
  margin-left: 5px;
  
  &::before { content: '?'; }
  &:hover { color: var(--text-secondary, #8B949E); }
`;

export const TooltipWrapper = styled.div`
  position: relative;
  display: inline-flex;
  &:hover ${TooltipPopup} { opacity: 1; visibility: visible; }
`;

/* Modals */
export const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

export const ModalContent = styled.div`
  background: var(--bg-surface, #161B22);
  border: 1px solid var(--border, #30363D);
  border-radius: 8px;
  padding: 20px;
  max-width: 340px;
  width: 90%;
`;

export const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
`;

export const ModalIcons = styled.div<{ $type: string }>`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: ${({ $type }) => $type === 'buy' ? 'rgba(63, 185, 80, 0.15)' : 'rgba(248, 81, 73, 0.15)'};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ $type }) => $type === 'buy' ? 'var(--buy, #3FB950)' : 'var(--sell, #F85149)'};
`;

export const ModalTitle = styled.h3`
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary, #E6EDF3);
  margin: 0;
`;

export const ModalBody = styled.div`margin-bottom: 16px;`;
export const ModalMessage = styled.p`font-size: 12px; color: var(--text-secondary, #8B949E); margin: 0;`;
export const ModalDetail = styled.p`font-size: 11px; color: var(--text-tertiary, #6E7681); margin: 6px 0 0;`;

export const ModalActions = styled.div`display: flex; gap: 10px;`;

export const ModalCancelBtn = styled.button`
  flex: 1;
  padding: 10px;
  background: transparent;
  border: 1px solid var(--border, #30363D);
  color: var(--text-secondary, #8B949E);
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  &:hover { background: var(--bg-secondary, #21262D); }
`;

export const ModalConfirmBtn = styled.button<{ $type: string }>`
  flex: 1;
  padding: 10px;
  background: ${({ $type }) => $type === 'buy' ? 'var(--buy, #3FB950)' : 'var(--sell, #F85149)'};
  border: none;
  color: #fff;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
`;

/* ═══════════════════════════════════════════════════════════
 * CONFIRMATION MODAL
 * ═══════════════════════════════════════════════════════════
 */
export const ConfirmDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

export const ConfirmRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

export const ConfirmLabel = styled.span`
  font-size: 12px;
  color: var(--text-tertiary, #6E7681);
`;

export const ConfirmValue = styled.span<{ $highlight?: 'buy' | 'sell' }>`
  font-size: 13px;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  color: ${({ $highlight }) =>
    $highlight === 'buy' ? 'var(--buy, #3FB950)' :
      $highlight === 'sell' ? 'var(--sell, #F85149)' :
        'var(--text-primary, #E6EDF3)'};
`;

export const ModalFooterButtons = styled.div`
  display: flex;
  gap: 8px;
  width: 100%;
`;

export const CancelModalBtn = styled.button`
  flex: 1;
  padding: 10px;
  background: transparent;
  border: 1px solid var(--border, #30363D);
  color: var(--text-secondary, #8B949E);
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  &:hover { background: var(--bg-secondary, #21262D); }
`;

export const ConfirmModalBtn = styled.button<{ $side: 'buy' | 'sell' }>`
  flex: 1;
  padding: 10px;
  background: ${({ $side }) => $side === 'buy' ? 'var(--buy, #3FB950)' : 'var(--sell, #F85149)'};
  border: none;
  color: #fff;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
`;
