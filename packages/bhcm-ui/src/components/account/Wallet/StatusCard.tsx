import { useEffect, useState } from 'react';
import { Icons, IconsName } from '../Icons';
import {
  Container,
  IconsWrapper,
  Content,
  Title,
  Subtitle,
  ProgressSection,
  ProgressBar,
  ProgressFill,
  ProgressText,
  DemoSection,
  DemoButton,
  DemoHint,
} from './StatusCard.styles';

/**
 * STATUS CARD - Displays pending, success, or error states
 */

interface StatusCardProps {
  status: 'pending' | 'processing' | 'success' | 'error';
  title: string;
  subtitle?: string;
  estimatedSeconds?: number;
  onConfirmDemo?: () => void;
  confirmDemoLabel?: string;
  confirmDemoHint?: string;
}

const StatusCard = ({
  status,
  title,
  subtitle,
  estimatedSeconds,
  onConfirmDemo,
  confirmDemoLabel,
  confirmDemoHint,
}: StatusCardProps) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if ((status === 'pending' || status === 'processing') && estimatedSeconds) {
      let elapsed = 0;
      const interval = setInterval(() => {
        elapsed += 0.1;
        const progressValue = Math.min((elapsed / estimatedSeconds) * 100, 95);
        setProgress(progressValue);
      }, 100);

      return () => clearInterval(interval);
    } else if (status === 'success') {
      setProgress(100);
    }
  }, [status, estimatedSeconds]);

  const getIcons = (): IconsName => {
    switch (status) {
      case 'pending':
      case 'processing':
        return 'loader';
      case 'success':
        return 'check-circle';
      case 'error':
        return 'alert-circle';
    }
  };

  const isSpinning = status === 'pending' || status === 'processing';

  return (
    <Container $status={status}>
      <IconsWrapper $status={status} $spinning={isSpinning}>
        <Icons name={getIcons()} size="lg" />
      </IconsWrapper>

      <Content>
        <Title>{title}</Title>
        {subtitle && <Subtitle>{subtitle}</Subtitle>}
      </Content>

      {isSpinning && estimatedSeconds && (
        <ProgressSection>
          <ProgressBar>
            <ProgressFill $width={progress} />
          </ProgressBar>
          <ProgressText>{Math.round(progress)}%</ProgressText>
        </ProgressSection>
      )}

      {onConfirmDemo && isSpinning && (
        <DemoSection>
          <DemoButton onClick={onConfirmDemo}>
            {confirmDemoLabel || 'Confirm for Demo'}
          </DemoButton>
          {confirmDemoHint && <DemoHint>{confirmDemoHint}</DemoHint>}
        </DemoSection>
      )}
    </Container>
  );
}

export default StatusCard;
