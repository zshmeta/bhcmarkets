import styled, { keyframes, css } from 'styled-components';

// --- Animations ---

const float = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
`;

const pulse = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(88, 166, 255, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(88, 166, 255, 0); }
  100% { box-shadow: 0 0 0 0 rgba(88, 166, 255, 0); }
`;

const gradientShift = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

// --- Primitives ---

export const GlassContainer = styled.div`
  background: rgba(22, 27, 34, 0.6);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 
    0 25px 50px -12px rgba(0, 0, 0, 0.5),
    0 0 0 1px rgba(0, 0, 0, 0.2);
  border-radius: 24px;
  overflow: hidden;
  position: relative;
  
  /* Inner light reflection at top */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(
      90deg, 
      rgba(255,255,255,0) 0%, 
      rgba(255,255,255,0.2) 50%, 
      rgba(255,255,255,0) 100%
    );
  }
`;

export const NeonButton = styled.button<{ $variant?: 'primary' | 'secondary', $loading?: boolean }>`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 14px 24px;
  font-family: var(--font-sans);
  font-weight: 600;
  font-size: 0.95rem;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  
  ${props => props.$variant === 'primary' ? css`
    background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
    color: white;
    border: none;
    box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2), 0 0 15px rgba(59, 130, 246, 0.3);

    &:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.3), 0 0 25px rgba(59, 130, 246, 0.5);
      filter: brightness(1.1);
    }

    &:active:not(:disabled) {
      transform: translateY(1px);
      box-shadow: 0 2px 4px -1px rgba(37, 99, 235, 0.2);
    }
  ` : css`
    background: rgba(255, 255, 255, 0.05);
    color: var(--text-primary);
    border: 1px solid rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);

    &:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(255, 255, 255, 0.2);
    }
  `}

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    filter: grayscale(0.5);
  }

  /* Loading State Overlay */
  ${props => props.$loading && css`
    color: transparent;
    pointer-events: none;
    
    &::after {
      content: '';
      position: absolute;
      width: 20px;
      height: 20px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
  `}

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

export const InputWrapper = styled.div`
  position: relative;
  margin-bottom: 24px;
`;

export const StyledInput = styled.input`
  width: 100%;
  padding: 16px 16px 16px 16px; /* Space for icon if needed */
  background: rgba(13, 17, 23, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: #fff;
  font-family: var(--font-sans);
  font-size: 1rem;
  transition: all 0.2s ease;
  outline: none;

  &:focus {
    border-color: #58A6FF;
    background: rgba(13, 17, 23, 0.8);
    box-shadow: 0 0 0 4px rgba(88, 166, 255, 0.1);
  }

  &:not(:placeholder-shown) + label,
  &:focus + label {
    transform: translateY(-12px) scale(0.85);
    color: #58A6FF;
    top: 4px; /* Move it higher */
    background: transparent; 
  }

  &::placeholder {
    color: transparent; /* Hide placeholder to use floating label */
  }
  
  &:-webkit-autofill,
  &:-webkit-autofill:hover,
  &:-webkit-autofill:focus {
    -webkit-text-fill-color: #fff;
    -webkit-box-shadow: 0 0 0px 1000px #0D1117 inset;
    transition: background-color 5000s ease-in-out 0s;
  }
`;

export const FloatingLabel = styled.label`
  position: absolute;
  left: 16px;
  top: 16px; /* Center vertically initially */
  color: #8b949e;
  font-size: 1rem;
  pointer-events: none;
  transition: all 0.2s ease;
  transform-origin: left top;
  font-family: var(--font-sans);
`;

export const ErrorText = styled.div`
  color: #ff6b6b;
  font-size: 0.8rem;
  margin-top: 6px;
  margin-left: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
  
  svg {
    width: 12px;
    height: 12px;
  }
`;

// --- Layouts ---

export const AuthGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  min-height: 100vh;
  width: 100%;
  background-color: #0D1117;
  /* Deep mesh gradient background */
  background-image: 
    radial-gradient(at 0% 0%, rgba(88, 166, 255, 0.15) 0px, transparent 50%),
    radial-gradient(at 100% 100%, rgba(37, 99, 235, 0.1) 0px, transparent 50%);
  background-attachment: fixed;
  
  @media (min-width: 1024px) {
    grid-template-columns: 1fr 1fr;
  }
`;

export const VisualPane = styled.div`
  display: none;
  @media (min-width: 1024px) {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 64px;
    position: relative;
    overflow: hidden;
    
    /* Decorative Grid */
    &::before {
      content: '';
      position: absolute;
      inset: 0;
      background-image: 
        linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
      background-size: 40px 40px;
      mask-image: radial-gradient(circle at center, black 40%, transparent 100%);
    }
  }
`;

export const FormPane = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 24px;
  position: relative;
  z-index: 10;
`;

export const BrandMonogram = styled.div`
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 800;
  font-size: 1.25rem;
  box-shadow: 0 0 20px rgba(59, 130, 246, 0.4);
  margin-bottom: 32px;
`;

export const FormCard = styled(GlassContainer)`
  width: 100%;
  max-width: 440px;
  padding: 40px;
`;

export const PulseCircle = styled.div`
  width: 12px;
  height: 12px;
  background-color: #3FB950;
  border-radius: 50%;
  animation: ${pulse} 2s infinite;
  display: inline-block;
  margin-right: 8px;
`;

export const SecureBadge = styled.div`
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background: rgba(63, 185, 80, 0.1);
  border: 1px solid rgba(63, 185, 80, 0.2);
  border-radius: 100px;
  color: #3FB950;
  font-size: 0.75rem;
  font-weight: 600;
  margin-top: 24px;
`;
