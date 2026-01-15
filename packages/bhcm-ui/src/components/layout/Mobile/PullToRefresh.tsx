import { forwardRef } from 'react';
import { usePullToRefresh } from '../../hooks/usePullToRefresh';
import { Container, Indicator, Spinner, SpinnerSvg, SpinnerCircle, Text, Content } from './PullToRefresh.styles';

/**
 * PULL TO REFRESH - Touch gesture refresh component
 */

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  className?: string;
}

export const PullToRefresh = forwardRef<HTMLDivElement, PullToRefreshProps>(
  function PullToRefresh({ onRefresh, children, className }, _ref) {
    const { containerRef, pullDistance, isRefreshing, isPulling } = usePullToRefresh({
      onRefresh,
      threshold: 80,
      maxPull: 120,
    });

    const showIndicator = pullDistance > 0 || isRefreshing;
    const rotationDeg = Math.min(pullDistance * 3, 360);
    const isReady = pullDistance >= 80;

    return (
      <Container ref={containerRef} className={className}>
        <Indicator
          $visible={showIndicator}
          style={{
            transform: `translateY(${Math.min(pullDistance, 80)}px)`,
            opacity: Math.min(pullDistance / 40, 1),
          }}
        >
          <Spinner
            $spinning={isRefreshing}
            style={{ transform: isRefreshing ? undefined : `rotate(${rotationDeg}deg)` }}
          >
            <SpinnerSvg viewBox="0 0 24 24">
              <SpinnerCircle $ready={isReady || isRefreshing} cx="12" cy="12" r="10" fill="none" strokeWidth="2" />
            </SpinnerSvg>
          </Spinner>
          <Text>{isRefreshing ? 'Refreshing...' : isReady ? 'Release to refresh' : 'Pull to refresh'}</Text>
        </Indicator>

        <Content
          style={{
            transform: isPulling || isRefreshing ? `translateY(${pullDistance}px)` : undefined,
            transition: isPulling ? 'none' : 'transform 0.3s ease',
          }}
        >
          {children}
        </Content>
      </Container>
    );
  }
);
