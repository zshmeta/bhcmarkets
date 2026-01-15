import styled, { css, keyframes } from 'styled-components';

/**
 * Token Reference (from tokens.css):
 * --brand-500/600/700    → #3B82F6 / #2563EB / #1D4ED8
 * --danger-400/500       → #F87171 / #EF4444
 * --success-500          → #22C55E
 * --warning-500          → #EAB308
 * --space-1..8           → 0.25..2rem
 * --font-sans            → system font stack
 */

/* ═══════════════════════════════════════════════════════════
 * ANIMATIONS
 * ═══════════════════════════════════════════════════════════
 */
const float = keyframes`
  0% { transform: translate(0, 0) scale(1); }
  100% { transform: translate(100px, 50px) scale(1.2); }
`;

const cardAppear = keyframes`
  0% { opacity: 0; transform: translateY(40px) scale(0.95); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
`;

const logoShimmer = keyframes`
  0% { transform: translate(-20%, -20%); }
  100% { transform: translate(20%, 20%); }
`;

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const blink = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
`;

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`;

/* ═══════════════════════════════════════════════════════════
 * CONTAINER & BACKGROUND
 * ═══════════════════════════════════════════════════════════
 */
export const Container = styled.div`
  position: relative;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #000;
  overflow: hidden;
  font-family: var(--font-sans, system-ui, sans-serif);

  @media (max-width: 768px) {
    padding: 1.5rem;
    overflow-y: auto;
  }
`;

export const Overlay = styled.div`
  position: absolute;
  inset: 0;
  background: 
    radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.15) 0%, transparent 40%),
    radial-gradient(circle at 80% 80%, rgba(37, 99, 235, 0.1) 0%, transparent 40%),
    radial-gradient(circle at 50% 50%, rgba(0, 0, 0, 0.4) 0%, #000 100%);
  z-index: 1;

  @media (max-width: 768px) {
    background: 
      radial-gradient(circle at 0% 0%, rgba(59, 130, 246, 0.15) 0%, transparent 50%),
      radial-gradient(circle at 100% 100%, rgba(37, 99, 235, 0.1) 0%, transparent 50%);
  }
`;

export const Decor = styled.div`
  position: absolute;
  inset: 0;
  z-index: 0;
  filter: blur(80px);
  opacity: 0.6;

  &::after {
    content: '';
    position: absolute;
    bottom: 10%;
    right: 10%;
    width: 400px;
    height: 400px;
    background: #1D4ED8;
    border-radius: 50%;
    animation: ${float} 25s infinite alternate-reverse;
  }
`;

export const Grid = styled.div`
  position: absolute;
  top: 10%;
  left: 10%;
  width: 300px;
  height: 300px;
  background: #3B82F6;
  border-radius: 50%;
  animation: ${float} 20s infinite alternate;
`;

/* ═══════════════════════════════════════════════════════════
 * CARD
 * ═══════════════════════════════════════════════════════════
 */
export const Card = styled.div`
  position: relative;
  width: 100%;
  max-width: 440px;
  max-height: 90vh;
  padding: 2rem;
  background: rgba(20, 20, 20, 0.7);
  backdrop-filter: blur(30px) saturate(150%);
  -webkit-backdrop-filter: blur(30px) saturate(150%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 32px;
  box-shadow: 
    0 40px 100px rgba(0, 0, 0, 0.5),
    inset 0 0 0 1px rgba(255, 255, 255, 0.05);
  z-index: 10;
  animation: ${cardAppear} 1s cubic-bezier(0.16, 1, 0.3, 1);
  display: flex;
  flex-direction: column;
  overflow-y: auto;

  @media (max-width: 768px) {
    max-width: 100%;
    min-height: calc(100vh - 48px);
    border-radius: 28px;
    background: rgba(20, 20, 20, 0.8);
    backdrop-filter: blur(40px) saturate(150%);
    border: 1px solid rgba(255, 255, 255, 0.08);
    padding: 2rem 1.5rem;
    justify-content: flex-start;
    box-shadow: 
      0 20px 60px rgba(0, 0, 0, 0.5),
      inset 0 0 0 1px rgba(255, 255, 255, 0.03);
  }
`;

/* ═══════════════════════════════════════════════════════════
 * HEADER
 * ═══════════════════════════════════════════════════════════
 */
export const Header = styled.div`
  text-align: center;
  margin-bottom: 1.5rem;

  @media (max-width: 768px) {
    margin-bottom: 1rem;
  }
`;

export const Logo = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem;
  background: linear-gradient(135deg, #3B82F6, #2563EB);
  border-radius: 16px;
  color: white;
  margin-bottom: 1rem;
  box-shadow: 0 10px 30px rgba(37, 99, 235, 0.3);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: -100%;
    left: -100%;
    width: 300%;
    height: 300%;
    background: linear-gradient(
      45deg,
      transparent 45%,
      rgba(255, 255, 255, 0.2) 50%,
      transparent 55%
    );
    animation: ${logoShimmer} 4s infinite;
  }

  &::after {
    content: '';
    position: absolute;
    inset: -4px;
    border-radius: 24px;
    background: linear-gradient(135deg, #3B82F6, transparent);
    opacity: 0.3;
    z-index: -1;
  }

  @media (max-width: 768px) {
    padding: 0.75rem;
    border-radius: 14px;
    margin-bottom: 0.75rem;
  }
`;

export const Title = styled.span`
  display: block;
  font-size: 26px;
  font-weight: 900;
  letter-spacing: -0.04em;
  color: white;
  margin-top: 0.25rem;

  @media (max-width: 768px) {
    font-size: 22px;
    background: linear-gradient(135deg, #fff 0%, rgba(255, 255, 255, 0.8) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
`;

export const Subtitle = styled.span`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  font-weight: 700;
  letter-spacing: 0.3em;
  text-transform: uppercase;

  @media (max-width: 768px) {
    font-size: 9px;
    letter-spacing: 0.2em;
    color: rgba(255, 255, 255, 0.4);
    margin-top: 0.25rem;
  }
`;

/* ═══════════════════════════════════════════════════════════
 * WELCOME BANNER
 * ═══════════════════════════════════════════════════════════
 */
export const WelcomeBanner = styled.div`
  margin-bottom: 1.5rem;
  text-align: center;

  @media (max-width: 768px) {
    text-align: center;
    margin-bottom: 1.25rem;
    padding: 1rem;
    background: rgba(59, 130, 246, 0.05);
    border-radius: 16px;
    border: 1px solid rgba(59, 130, 246, 0.1);
  }
`;

export const WelcomeTitle = styled.h2`
  font-size: 20px;
  font-weight: 800;
  color: white;
  margin: 0 0 0.5rem;
  letter-spacing: -0.02em;

  @media (max-width: 768px) {
    font-size: 18px;
    line-height: 1.2;
    color: #60A5FA;
    margin-bottom: 0.75rem;
  }
`;

export const WelcomeParagraph = styled.p`
  font-size: 13px;
  line-height: 1.7;
  color: rgba(255, 255, 255, 0.6);
  max-width: 95%;
  margin: 0 auto;
  white-space: pre-line;

  @media (max-width: 768px) {
    max-width: 100%;
    color: rgba(255, 255, 255, 0.65);
  }
`;

/* ═══════════════════════════════════════════════════════════
 * FORM
 * ═══════════════════════════════════════════════════════════
 */
export const InputGroup = styled.div`
  margin-bottom: 1rem;
`;

export const Label = styled.label`
  font-size: 12px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.4);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 0.5rem;
  display: block;
  padding-left: 0.5rem;

  @media (max-width: 768px) {
    font-size: 11px;
    margin-bottom: 0.25rem;
    color: rgba(255, 255, 255, 0.5);
  }
`;

export const InputWrapper = styled.div`
  position: relative;
`;

export const Input = styled.input`
  width: 100%;
  height: 56px;
  padding: 0 1rem 0 48px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  color: white;
  font-size: 15px;
  font-weight: 500;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:focus {
    outline: none;
    background: rgba(255, 255, 255, 0.08);
    border-color: #3B82F6;
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.15);
  }

  @media (max-width: 768px) {
    height: 52px;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.08);
    padding: 0 1rem 0 44px;

    &:focus {
      background: rgba(255, 255, 255, 0.07);
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
  }
`;

export const InputIcons = styled.span`
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: rgba(255, 255, 255, 0.3);
  transition: all 0.3s ease;

  input:focus + & {
    color: #3B82F6;
    transform: translateY(-50%) scale(1.1);
  }

  @media (max-width: 768px) {
    left: 14px;
  }
`;

export const SubmitBtn = styled.button`
  width: 100%;
  height: 54px;
  background: white;
  color: black;
  border: none;
  border-radius: 14px;
  font-size: 16px;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  margin-top: 0.5rem;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  position: relative;
  overflow: hidden;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.4);
  }

  &:active {
    transform: translateY(-2px);
  }

  @media (max-width: 768px) {
    background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
    color: #fff;
    box-shadow: 
      0 4px 20px rgba(59, 130, 246, 0.35),
      inset 0 1px 0 rgba(255, 255, 255, 0.15);
    margin-top: 0.75rem;
    letter-spacing: 0.02em;

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(
        90deg,
        transparent,
        rgba(255, 255, 255, 0.2),
        transparent
      );
      transition: left 0.5s ease;
    }

    &:active {
      transform: scale(0.97);
      box-shadow: 0 2px 12px rgba(59, 130, 246, 0.3);
    }

    &:active::before {
      left: 100%;
    }
  }
`;

export const ModeSwitch = styled.div`
  margin-top: 1.25rem;
  text-align: center;

  @media (max-width: 768px) {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }
`;

export const ModeSwitchText = styled.span`
  color: rgba(255, 255, 255, 0.4);
  font-size: 14px;

  @media (max-width: 768px) {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.5);
  }
`;

export const ModeSwitchBtn = styled.button`
  background: none;
  border: none;
  color: white;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  margin-left: 0.5rem;
  text-decoration: underline;
  text-underline-offset: 4px;

  @media (max-width: 768px) {
    font-weight: 600;
    color: #60A5FA;
    text-decoration: none;
    padding: 0.5rem 1rem;
    background: rgba(59, 130, 246, 0.1);
    border-radius: 8px;
    margin-left: 0;
    transition: all 0.2s ease;

    &:active {
      background: rgba(59, 130, 246, 0.2);
      transform: scale(0.97);
    }
  }
`;

/* ═══════════════════════════════════════════════════════════
 * ERROR / SPINNER
 * ═══════════════════════════════════════════════════════════
 */
export const ErrorMessage = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 12px;
  color: #F87171;
  font-size: 14px;
  margin-bottom: 1rem;

  svg {
    flex-shrink: 0;
  }

  @media (max-width: 768px) {
    font-size: 13px;
    border-radius: 10px;
    padding: 0.75rem;
  }
`;

export const Spinner = styled.span`
  animation: ${spin} 1s linear infinite;
`;

/* ═══════════════════════════════════════════════════════════
 * SETTINGS BAR
 * ═══════════════════════════════════════════════════════════
 */
export const SettingsBar = styled.div`
  position: absolute;
  top: 2rem;
  right: 2rem;
  display: flex;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  padding: 0.5rem;
  border-radius: 100px;
  backdrop-filter: blur(10px);
  z-index: 100;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

export const SettingsDivider = styled.div`
  width: 1px;
  height: 20px;
  background: rgba(255, 255, 255, 0.1);
`;

/* ═══════════════════════════════════════════════════════════
 * FOOTER
 * ═══════════════════════════════════════════════════════════
 */
export const Footer = styled.div`
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
`;

export const SecurityBadges = styled.div`
  display: flex;
  justify-content: center;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
`;

export const SecurityBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 10px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.4);
  letter-spacing: 0.1em;
  text-transform: uppercase;

  svg {
    color: #22C55E;
  }
`;

export const SystemStatus = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border-radius: 16px;
  padding: 1rem;
`;

export const StatusHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-size: 11px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

export const StatusGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
`;

export const StatusItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

interface DotProps {
  $status: 'ok' | 'pending' | 'error';
}

export const Dot = styled.div<DotProps>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;

  ${({ $status }) =>
    $status === 'ok' &&
    css`
      background: #22C55E;
      box-shadow: 0 0 8px #22C55E;
    `}

  ${({ $status }) =>
    $status === 'pending' &&
    css`
      background: #EAB308;
      animation: ${blink} 1s infinite;
    `}

  ${({ $status }) =>
    $status === 'error' &&
    css`
      background: #EF4444;
    `}
`;

export const StatusInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

export const StatusLabel = styled.span`
  font-size: 10px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.4);
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

export const StatusValue = styled.span`
  font-size: 12px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.7);
`;

/* ═══════════════════════════════════════════════════════════
 * MOBILE FOOTER
 * ═══════════════════════════════════════════════════════════
 */
export const MobileFooter = styled.div`
  display: none;

  @media (max-width: 768px) {
    display: block;
    margin-top: auto;
    padding-top: 1rem;
    border-top: 1px solid rgba(255, 255, 255, 0.05);
  }
`;

export const MobileSystemStatus = styled.div`
  display: flex;
  justify-content: center;
  gap: 1.5rem;
  margin-bottom: 1rem;
`;

export const MobileStatusItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
`;

export const MobileStatusDot = styled.div<DotProps>`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  animation: ${pulse} 2s infinite;

  ${({ $status }) =>
    $status === 'ok' &&
    css`
      background: #22C55E;
      animation: none;
    `}

  ${({ $status }) =>
    $status === 'pending' &&
    css`
      background: #EAB308;
    `}

  ${({ $status }) =>
    $status === 'error' &&
    css`
      background: #EF4444;
    `}
`;

export const MobileSecurityBadges = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
`;

export const MobileSecurityBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 10px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.4);
  letter-spacing: 0.05em;
  text-transform: uppercase;

  svg {
    color: #3B82F6;
    width: 12px;
    height: 12px;
  }
`;

export const MobileLanguageToggle = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 1rem;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
`;
