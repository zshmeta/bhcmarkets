import React from 'react';
import styled from 'styled-components';
import { COLORS, RADIUS, SPACING } from '../theme/theme';
import { Caption } from './Typography';

export type TabRoute = 'markets' | 'trade' | 'wallet' | 'account';

interface TabNavigatorProps {
    currentTab: TabRoute;
    onTabChange: (route: TabRoute) => void;
}

const NavBar = styled.div`
    position: absolute;
    bottom: 34px;
    left: 16px;
    right: 16px;
    height: 64px;
    background-color: ${COLORS.glass};
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-radius: ${RADIUS.xl}px;
    border: 1px solid ${COLORS.glassBorder};
    display: flex;
    flex-direction: row;
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
    padding: 8px;
    flex: 1;
    height: 100%;
    position: relative;
    opacity: ${({ $active }) => $active ? 1 : 0.5};
    transition: all 0.2s ease;

    &:hover {
        opacity: ${({ $active }) => $active ? 1 : 0.8};
    }
`;

const IconText = styled.div`
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

export const TabNavigator: React.FC<TabNavigatorProps> = ({ currentTab, onTabChange }) => {
    const tabs = [
        { id: 'markets', label: 'Markets', icon: '📊' },
        { id: 'trade', label: 'Trade', icon: '⚡' },
        { id: 'wallet', label: 'Wallet', icon: '👛' },
        { id: 'account', label: 'Account', icon: '👤' },
    ];

    return (
        <NavBar>
            {tabs.map((tab) => {
                const isActive = currentTab === tab.id;
                return (
                    <TabButton
                        key={tab.id}
                        onClick={() => onTabChange(tab.id as TabRoute)}
                        $active={isActive}
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
};
