import React from 'react';
import styled from 'styled-components';
import { COLORS, SPACING } from '../theme/theme';
import { H2 } from './Typography';
// import { GlassView } from './GlassView'; // Skipping GlassView for now to keep it simple or replace it inline if GlassView isn't refactored yet.
// Actually, I should refactor GlassView. But for Header, I can just use a styled div with glass effect directly to rely less on other components if needed, or assume GlassView will be fixed.
// Let's assume GlassView will be refactored, but looking at usage, it's safer to just style the header directly for now to minimize dependencies on un-refactored components.

interface HeaderProps {
    title: string;
    rightAction?: React.ReactNode;
}

const HeaderContainer = styled.header`
    position: sticky;
    top: 0;
    z-index: 10;
    width: 100%;
    /* Glass Effect */
    background: ${COLORS.glass}; // fallback
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border-bottom: 1px solid ${COLORS.border};
`;

const Content = styled.div`
    height: 60px;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    padding: 0 ${SPACING.l}px;
`;

const RightAction = styled.div`
    display: flex;
    align-items: center;
`;

export const Header: React.FC<HeaderProps> = ({ title, rightAction }) => {
    return (
        <HeaderContainer>
            <Content>
                <H2>{title}</H2>
                {rightAction && <RightAction>{rightAction}</RightAction>}
            </Content>
        </HeaderContainer>
    );
};
