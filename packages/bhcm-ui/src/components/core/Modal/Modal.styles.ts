import styled, { keyframes } from 'styled-components';

/* ═══════════════════════════════════════════════════════════
 * MODAL PRIMITIVE STYLES
 * ═══════════════════════════════════════════════════════════
 * Base overlay and modal/drawer components for consistent
 * modal experiences across the application.
 */

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const slideUp = keyframes`
  from { opacity: 0; transform: translate(-50%, calc(-50% + 20px)) scale(0.96); }
  to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
`;

const slideRight = keyframes`
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
`;

/* ─── Overlay ─── */
export const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(2px);
  z-index: var(--z-modal, 1000);
  animation: ${fadeIn} 0.15s ease-out;
`;

/* ─── Modal Panel (centered) ─── */
export const ModalPanel = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: var(--bg-secondary, #161B22);
  border: 1px solid var(--border, #30363D);
  border-radius: var(--radius-lg, 8px);
  z-index: calc(var(--z-modal, 1000) + 1);
  min-width: 320px;
  max-width: min(90vw, 480px);
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: ${slideUp} 0.2s ease-out;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
`;

/* ─── Drawer Panel (slides from right) ─── */
export const DrawerPanel = styled.div`
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: min(90vw, 400px);
  background: var(--bg-secondary, #161B22);
  border-left: 1px solid var(--border, #30363D);
  z-index: calc(var(--z-modal, 1000) + 1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: ${slideRight} 0.25s ease-out;
  box-shadow: -10px 0 30px rgba(0, 0, 0, 0.3);
`;

/* ─── Modal Header ─── */
export const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--bg-tertiary, #1C2128);
  border-bottom: 1px solid var(--border-subtle, #262C36);
`;

export const ModalTitle = styled.h2`
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary, #E6EDF3);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const CloseButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: transparent;
  border: none;
  border-radius: var(--radius-sm, 4px);
  color: var(--text-tertiary, #6E7681);
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: var(--surface-hover, #262C36);
    color: var(--text-primary, #E6EDF3);
  }
`;

/* ─── Modal Body ─── */
export const ModalBody = styled.div`
  flex: 1;
  padding: 16px;
  overflow-y: auto;
`;

/* ─── Modal Footer ─── */
export const ModalFooter = styled.div`
  padding: 12px 16px;
  background: var(--bg-tertiary, #1C2128);
  border-top: 1px solid var(--border-subtle, #262C36);
  display: flex;
  justify-content: flex-end;
  gap: 8px;
`;
