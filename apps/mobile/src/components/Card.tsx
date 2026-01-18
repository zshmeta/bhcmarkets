import React from 'react';
import styled from 'styled-components';
import { COLORS, RADIUS, SPACING } from '../theme/theme';

// Define SPACING keys if not already imported or available as a type
type SpacingKey = keyof typeof SPACING;

interface CardProps {
    children: React.ReactNode;
    style?: React.CSSProperties;
    padding?: SpacingKey | 'none';
    className?: string; // Support className for styled-components extension
}

const getPadding = (p: string) => {
    if (p === 'none') return '0';
    // @ts-ignore
    return SPACING[p] ? `${SPACING[p]}px` : `${SPACING.m}px`;
};

const StyledCard = styled.div<{ $padding?: string }>`
  background-color: ${COLORS.bgLayer2};
  border-radius: ${RADIUS.l}px;
  padding: ${({ $padding }) => getPadding($padding || 'm')};
  border: 1px solid ${COLORS.border};
`;

export const Card = ({ children, style, padding = 'm', className }: CardProps) => {
    return (
        <StyledCard style={style} $padding={padding} className={className}>
            {children}
        </StyledCard>
    );
};
