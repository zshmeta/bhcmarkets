import styled, { keyframes } from 'styled-components';

/**
 * PHONE SHELL - Device frame wrapper for browser viewing
 * 
 * Constrains the mobile app to phone dimensions with subtle device aesthetics.
 * No DevTools needed - looks like a phone on any screen.
 */

const pulseGlow = keyframes`
  0%, 100% { box-shadow: 0 0 0 12px #1a1a1a, 0 0 0 14px #2a2a2a, 0 25px 60px rgba(0,0,0,0.5), 0 0 100px rgba(59, 130, 246, 0.05); }
  50% { box-shadow: 0 0 0 12px #1a1a1a, 0 0 0 14px #2a2a2a, 0 25px 60px rgba(0,0,0,0.5), 0 0 120px rgba(59, 130, 246, 0.1); }
`;

const DeviceFrame = styled.div`
  /* Phone dimensions - iPhone Pro Max */
  max-width: 430px;
  width: 100%;
  max-height: 932px;
  height: 100vh;
  
  /* Centering */
  margin: 0 auto;
  position: relative;
  
  /* Device aesthetics */
  background: linear-gradient(180deg, #0a0a0a 0%, #0D1117 2%, #0D1117 100%);
  border-radius: 50px;
  overflow: hidden;
  
  /* Frame shadow - subtle premium feel */
  box-shadow: 
    0 0 0 12px #1a1a1a,
    0 0 0 14px #2a2a2a,
    0 25px 60px rgba(0,0,0,0.5),
    0 0 100px rgba(59, 130, 246, 0.05);
  animation: ${pulseGlow} 4s ease-in-out infinite;
  
  /* On actual mobile, remove the frame styling */
  @media (max-width: 480px) {
    max-width: 100%;
    max-height: 100%;
    border-radius: 0;
    box-shadow: none;
    animation: none;
  }
`;

const DynamicIsland = styled.div`
  position: absolute;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  width: 126px;
  height: 37px;
  background: #000;
  border-radius: 24px;
  z-index: 1000;
  
  /* Subtle inner glow */
  box-shadow: inset 0 0 10px rgba(255,255,255,0.03);
  
  /* Camera dot */
  &::after {
    content: '';
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    width: 12px;
    height: 12px;
    background: radial-gradient(circle at 30% 30%, #1a1a1a, #0a0a0a);
    border-radius: 50%;
    box-shadow: inset 0 0 3px rgba(59, 130, 246, 0.3);
  }

  /* Hide on actual phones */
  @media (max-width: 480px) {
    display: none;
  }
`;

const StatusBar = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 54px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 16px 28px 0;
  z-index: 999;
  pointer-events: none;
  
  /* Hide on actual phones - they have real status bars */
  @media (max-width: 480px) {
    display: none;
  }
`;

const StatusTime = styled.span`
  font-size: 15px;
  font-weight: 600;
  color: #fff;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif;
`;

const StatusIcons = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 14px;
  color: #fff;
`;

const ContentArea = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  
  /* Safe area padding for the dynamic island */
  padding-top: 54px;
  
  @media (max-width: 480px) {
    padding-top: 0;
  }
`;

const HomeIndicator = styled.div`
  position: absolute;
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
  width: 134px;
  height: 5px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
  z-index: 1000;
  
  @media (max-width: 480px) {
    display: none;
  }
`;

interface PhoneShellProps {
    children: React.ReactNode;
}

export const PhoneShell = ({ children }: PhoneShellProps) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: false
    });

    return (
        <DeviceFrame>
            <DynamicIsland />
            <StatusBar>
                <StatusTime>{timeStr}</StatusTime>
                <StatusIcons>
                    <span>📶</span>
                    <span>📡</span>
                    <span>🔋</span>
                </StatusIcons>
            </StatusBar>
            <ContentArea>
                {children}
            </ContentArea>
            <HomeIndicator />
        </DeviceFrame>
    );
};

export default PhoneShell;
