import styled, { css, keyframes } from 'styled-components';

/* OnboardingGuide - Wallet setup wizard */

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const slideUp = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

export const FullScreenGuide = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
`;

export const GuideCard = styled.div`
  width: 100%;
  max-width: 480px;
  background: var(--surface, #0D1117);
  border: 1px solid var(--border, #30363D);
  border-radius: 0.5rem;
  padding: 2.5rem 2rem;
  text-align: center;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  animation: ${slideUp} 0.4s ease-out;
`;

export const IconsWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  background: rgba(88, 166, 255, 0.1);
  color: var(--accent, #58A6FF);
  border-radius: 16px;
  margin: 0 auto 1.5rem;
`;

export const Title = styled.h2`
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary, #E6EDF3);
  margin-bottom: 0.75rem;
`;

export const Description = styled.p`
  font-size: 0.9375rem;
  color: var(--text-secondary, #9AA5B1);
  line-height: 1.6;
  margin-bottom: 2rem;
`;

export const ActionGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 2rem;
`;

export const PrimaryButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  height: 48px;
  background: var(--brand-600, #2563EB);
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.1s ease-out;

  &:hover:not(:disabled) {
    background: var(--brand-700, #1D4ED8);
    transform: translateY(-1px);
  }
`;

export const SecondaryButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  height: 48px;
  background: transparent;
  color: var(--text-secondary, #9AA5B1);
  border: 1px solid var(--border, #30363D);
  border-radius: 0.375rem;
  font-size: 0.75rem;
  cursor: pointer;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const SuccessMessage = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: var(--color-success, #3FB950);
  font-weight: 700;
  margin-bottom: 2rem;
`;

export const Steps = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border-subtle, #262C36);
`;

interface StepProps {
  $active?: boolean;
}

export const Step = styled.div<StepProps>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  font-size: 10px;
  color: ${({ $active }) => $active ? 'var(--accent, #58A6FF)' : 'var(--text-tertiary, #6E7681)'};
  flex: 1;
`;

export const StepNumber = styled.span<StepProps>`
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: ${({ $active }) => $active ? 'var(--accent, #58A6FF)' : 'var(--bg-tertiary, #1C2128)'};
  color: ${({ $active }) => $active ? 'white' : 'inherit'};
  font-weight: 700;
`;

export const TopBanner = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1rem;
  background: rgba(88, 166, 255, 0.1);
  border: 1px solid var(--accent, #58A6FF);
  border-radius: 0.375rem;
  margin-bottom: 1rem;
`;

export const BannerIcons = styled.div`
  color: var(--accent, #58A6FF);
`;

export const BannerContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

export const BannerTitle = styled.span`
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-primary, #E6EDF3);
`;

export const BannerHint = styled.span`
  font-size: 0.6875rem;
  color: var(--text-secondary, #9AA5B1);
`;

export const BannerButton = styled.button`
  padding: 0 1rem;
  height: 32px;
  background: var(--accent, #58A6FF);
  color: white;
  border: none;
  border-radius: 0.25rem;
  font-size: 0.6875rem;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

export const StepIndicator = styled.div`
  font-size: 0.6875rem;
  font-weight: 700;
  color: var(--accent, #58A6FF);
`;

export const Spinning = styled.span`
  display: flex;
  animation: ${spin} 1s linear infinite;
`;
