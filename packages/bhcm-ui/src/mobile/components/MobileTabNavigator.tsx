import styled from 'styled-components';
import { COLORS, RADIUS, SPACING } from '../theme';
import { Caption } from './MobileTypography';

/**
 * Mobile Tab Navigator Component
 * 
 * Floating bottom tab bar for mobile navigation.
 */

export type TabRoute = 'markets' | 'trade' | 'wallet' | 'account';

interface TabItem {
    id: TabRoute;
    label: string;
    icon: string;
}

interface MobileTabNavigatorProps {
    currentTab: TabRoute;
    onTabChange: (route: TabRoute) => void;
    tabs?: TabItem[];
}

const DEFAULT_TABS: TabItem[] = [
    { id: 'markets', label: 'Markets', icon: '📊' },
    { id: 'trade', label: 'Trade', icon: '⚡' },
    { id: 'wallet', label: 'Wallet', icon: '👛' },
    { id: 'account', label: 'Account', icon: '👤' },
];

const NavBar = styled.nav`
  position: absolute;
  bottom: 24px;
  left: ${SPACING.m}px;
  right: ${SPACING.m}px;
  height: 64px;
  background-color: ${COLORS.glass};
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: ${RADIUS.xl}px;
  border: 1px solid ${COLORS.glassBorder};
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 0 ${SPACING.s}px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4);
  z-index: 100;
`;

const TabButton = styled.button<{ $active: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: ${SPACING.s}px;
  flex: 1;
  height: 100%;
  position: relative;
  opacity: ${({ $active }) => $active ? 1 : 0.5};
  transition: all 0.2s ease;

  &:active {
    transform: scale(0.95);
  }
`;

const IconText = styled.span`
  font-size: 20px;
  margin-bottom: 4px;
`;

const ActiveDot = styled.div`
  width: 4px;
  height: 4px;
  background-color: ${COLORS.primary};
  border-radius: 50%;
  position: absolute;
  bottom: 8px;
`;

export const MobileTabNavigator = ({
    currentTab,
    onTabChange,
    tabs = DEFAULT_TABS,
}: MobileTabNavigatorProps) => (
    <NavBar>
        {tabs.map((tab) => {
            const isActive = currentTab === tab.id;
            return (
                <TabButton
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    $active={isActive}
                    aria-label={tab.label}
                    aria-current={isActive ? 'page' : undefined}
                >
                    <IconText>{tab.icon}</IconText>
                    <Caption
                        size={10}
                        weight={isActive ? '600' : '500'}
                        color={isActive ? COLORS.primary : COLORS.textTertiary}
                    >
                        {tab.label}
                    </Caption>
                    {isActive && <ActiveDot />}
                </TabButton>
            );
        })}
    </NavBar>
);

export { MobileTabNavigator as TabNavigator };
