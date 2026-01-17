import { ReactNode } from 'react';
import styled from 'styled-components';
import { AuthGrid, VisualPane, FormPane, FormCard, BrandMonogram, SecureBadge, PulseCircle } from './Design/System';
import { Text } from '@repo/ui';

// Simple decorative chart for the left pane
const ChartLine = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 300px;
  background: linear-gradient(180deg, rgba(59, 130, 246, 0.2) 0%, rgba(59, 130, 246, 0) 100%);
  mask-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 1000 300' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 250 C 200 250, 250 100, 400 150 C 550 200, 600 50, 800 100 C 900 125, 950 200, 1000 250 V 300 H 0 Z' fill='black'/%3E%3C/svg%3E");
  mask-size: cover;
  opacity: 0.6;
`;

const GlowNode = styled.div<{ top: string, left: string, delay: string }>`
  position: absolute;
  top: ${props => props.top};
  left: ${props => props.left};
  width: 4px;
  height: 4px;
  background: #fff;
  border-radius: 50%;
  box-shadow: 0 0 10px 2px rgba(88, 166, 255, 0.8);
  animation: fade 3s infinite alternate;
  animation-delay: ${props => props.delay};

  @keyframes fade {
    0% { opacity: 0.3; transform: scale(1); }
    100% { opacity: 1; transform: scale(1.5); }
  }
`;

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <AuthGrid>
      {/* Visual Pane (Desktop Left) */}
      <VisualPane>
        <div style={{ position: 'relative', zIndex: 2 }}>
          <BrandMonogram>BHC</BrandMonogram>
          <Text variant="h1" style={{ fontSize: '3rem', maxWidth: '12ch', lineHeight: 1.1, marginBottom: '24px' }}>
            Institutional Grade Trading
          </Text>
          <Text color="secondary" style={{ fontSize: '1.125rem', maxWidth: '40ch', lineHeight: 1.6 }}>
            Access global liquidity with sub-millisecond execution. 
            Protected by enterprise-grade security infrastructure.
          </Text>
        </div>
        
        {/* Abstract Data Visuals */}
        <ChartLine />
        <GlowNode top="30%" left="20%" delay="0s" />
        <GlowNode top="45%" left="60%" delay="1s" />
        <GlowNode top="60%" left="40%" delay="0.5s" />
        
        <div style={{ position: 'relative', zIndex: 2, marginTop: 'auto' }}>
          <div style={{ display: 'flex', gap: '32px' }}>
            <div>
              <Text variant="h3" color="primary">24h</Text>
              <Text variant="caption" color="tertiary">Support</Text>
            </div>
            <div>
              <Text variant="h3" color="primary">99.9%</Text>
              <Text variant="caption" color="tertiary">Uptime</Text>
            </div>
            <div>
              <Text variant="h3" color="primary">0ms</Text>
              <Text variant="caption" color="tertiary">Latency</Text>
            </div>
          </div>
        </div>
      </VisualPane>

      {/* Functional Pane (Form Right) */}
      <FormPane>
        <FormCard>
          <div style={{ marginBottom: '32px', textAlign: 'center' }}>
            <Text variant="h2" style={{ marginBottom: '8px' }}>{title}</Text>
            {subtitle && <Text color="secondary">{subtitle}</Text>}
          </div>
          
          {children}

          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '32px' }}>
            <SecureBadge>
              <PulseCircle />
              Encrypted Session
            </SecureBadge>
          </div>
        </FormCard>
      </FormPane>
    </AuthGrid>
  );
}
