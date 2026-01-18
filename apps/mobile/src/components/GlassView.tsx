import React from 'react';
import styled, { css } from 'styled-components';
import { COLORS, RADIUS } from '../theme/theme';

interface GlassViewProps {
    children: React.ReactNode;
    style?: React.CSSProperties;
    intensity?: number;
    hasBorder?: boolean;
    className?: string; // Support styled-components extension
}

const Container = styled.div<{ $intensity: number; $hasBorder: boolean }>`
    background-color: ${({ $intensity }) => `rgba(22, 27, 34, ${Math.min($intensity / 100, 0.9)})`};
    backdrop-filter: blur(${({ $intensity }) => $intensity}px);
    -webkit-backdrop-filter: blur(${({ $intensity }) => $intensity}px);
    border-radius: ${RADIUS.l}px;
    overflow: hidden;
    position: relative;

    ${({ $hasBorder }) => $hasBorder && css`
        border: 1px solid ${COLORS.glassBorder};
    `}
`;

const Content = styled.div`
    position: relative;
    z-index: 1;
`;

export const GlassView: React.FC<GlassViewProps> = ({
    children,
    style,
    intensity = 20,
    hasBorder = true,
    className
}) => {
    return (
        <Container
            style={style}
            $intensity={intensity}
            $hasBorder={hasBorder}
            className={className}
        >
            <Content>{children}</Content>
        </Container>
    );
};
