import { useState } from 'react';
import { useWalletStore } from '../../store/walletStore';
import { useAuthStore } from '../../store/authStore';
import { useI18n, formatMessage } from '../../i18n';
import { Icons } from '../Icons';
import type { OnboardingStage } from '../../types/wallet';
import {
  FullScreenGuide,
  GuideCard,
  IconsWrapper,
  Title,
  Description,
  ActionGroup,
  PrimaryButton,
  SecondaryButton,
  SuccessMessage,
  Steps,
  Step,
  StepNumber,
  TopBanner,
  BannerIcons,
  BannerContent,
  BannerTitle,
  BannerHint,
  BannerButton,
  StepIndicator,
  Spinning,
} from './OnboardingGuide.styles';

/**
 * ONBOARDING GUIDE - Step-by-step wallet setup
 */

interface OnboardingGuideProps {
  stage: OnboardingStage;
  onOpenDeposit?: () => void;
  onScrollToMethods?: () => void;
}

const OnboardingGuide = ({ stage, onOpenDeposit, onScrollToMethods }: OnboardingGuideProps) => {
  const { t } = useI18n();
  const { user } = useAuthStore();
  const createAccount = useWalletStore((state) => state.createAccount);
  const [isCreating, setIsCreating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleCreateAccount = async () => {
    setIsCreating(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    createAccount();
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
    setIsCreating(false);
  };

  if (stage === 'not_created') {
    return (
      <FullScreenGuide>
        <GuideCard>
          <IconsWrapper>
            <Icons name="wallet" size="xl" />
          </IconsWrapper>
          <Title>{t.wallet?.createAccountTitle || 'Initialize Wallet'}</Title>
          <Description>
            {formatMessage(
              t.wallet?.createAccountDesc || 'Detection session for {username}. Would you like to initialize a simulated wallet?',
              { username: user?.username || 'user' }
            )}
          </Description>

          {showSuccess ? (
            <SuccessMessage>
              <Icons name="check-circle" size="sm" />
              <span>{t.wallet?.accountCreated || 'Wallet initialized!'}</span>
            </SuccessMessage>
          ) : (
            <ActionGroup>
              <PrimaryButton onClick={handleCreateAccount} disabled={isCreating}>
                {isCreating ? (
                  <>
                    <Spinning><Icons name="loader" size="sm" /></Spinning>
                    <span>{t.wallet?.creatingAccount || 'Initializing...'}</span>
                  </>
                ) : (
                  <>
                    <Icons name="plus" size="sm" />
                    <span>{t.wallet?.createAccount || 'Initialize Now'}</span>
                  </>
                )}
              </PrimaryButton>
              <SecondaryButton disabled>
                <Icons name="link" size="sm" />
                <span>Link External Wallet</span>
              </SecondaryButton>
            </ActionGroup>
          )}

          <Steps>
            <Step $active>
              <StepNumber $active>1</StepNumber>
              <span>{t.wallet?.createAccount || 'Initialize'}</span>
            </Step>
            <Step>
              <StepNumber>2</StepNumber>
              <span>{t.wallet?.addBankCard || 'Link Channels'}</span>
            </Step>
            <Step>
              <StepNumber>3</StepNumber>
              <span>{t.wallet?.deposit || 'Deposit'}</span>
            </Step>
          </Steps>
        </GuideCard>
      </FullScreenGuide>
    );
  }

  if (stage === 'no_payment_method') {
    return (
      <TopBanner>
        <BannerIcons>
          <Icons name="link" size="sm" />
        </BannerIcons>
        <BannerContent>
          <BannerTitle>{t.wallet?.addPaymentFirst || 'Add a payment method to deposit funds'}</BannerTitle>
          <BannerHint>
            {t.wallet?.addPaymentDesc || 'Link a bank card or crypto address to simulate deposits and withdrawals.'}
          </BannerHint>
        </BannerContent>
        {onScrollToMethods && (
          <BannerButton onClick={onScrollToMethods}>
            <Icons name="plus" size="sm" />
            <span>{t.common?.confirm || 'Add'}</span>
          </BannerButton>
        )}
        <StepIndicator>
          {t.wallet?.step || 'Step'} 2 {t.wallet?.of || 'of'} 3
        </StepIndicator>
      </TopBanner>
    );
  }

  if (stage === 'no_funds') {
    return (
      <TopBanner>
        <BannerIcons>
          <Icons name="download" size="sm" />
        </BannerIcons>
        <BannerContent>
          <BannerTitle>{t.wallet?.noFundsYet || 'No funds yet'}</BannerTitle>
          <BannerHint>
            {t.wallet?.noFundsDesc || 'Deposit funds to start trading. This is simulated money for paper trading.'}
          </BannerHint>
        </BannerContent>
        <BannerButton onClick={onOpenDeposit}>
          {t.wallet?.depositNow || 'Deposit Now'}
        </BannerButton>
      </TopBanner>
    );
  }

  return null;
}

export default OnboardingGuide;
