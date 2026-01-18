import React from 'react';
import styled from 'styled-components';
import { COLORS } from '../theme/theme';

interface TextProps {
    children: React.ReactNode;
    color?: string;
    size?: number;
    weight?: string;
    align?: 'left' | 'center' | 'right';
    style?: React.CSSProperties;
    className?: string; // Add className prop for styled-components extension
}

const BaseText = styled.span<TextProps>`
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  color: ${({ color }) => color || COLORS.text};
  font-size: ${({ size }) => size ? `${size}px` : '14px'};
  font-weight: ${({ weight }) => weight || '400'};
  text-align: ${({ align }) => align || 'left'};
  line-height: 1.5;
  margin: 0;
  padding: 0;
`;

export const H1 = styled(BaseText).attrs({ as: 'h1' })`
  font-size: 32px;
  font-weight: 700;
  letter-spacing: -0.5px;
  color: ${({ color }) => color || COLORS.text};
`;

export const H2 = styled(BaseText).attrs({ as: 'h2' })`
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -0.3px;
  color: ${({ color }) => color || COLORS.text};
`;

export const H3 = styled(BaseText).attrs({ as: 'h3' })`
  font-size: 18px;
  font-weight: 600;
  color: ${({ color }) => color || COLORS.text};
`;

export const Body = styled(BaseText).attrs({ as: 'p' })`
  font-size: 15px;
  color: ${({ color }) => color || COLORS.textSecondary};
`;

export const Caption = styled(BaseText).attrs({ as: 'span' })`
  font-size: 12px;
  color: ${({ color }) => color || COLORS.textTertiary};
`;

export const Mono = styled(BaseText)`
  font-family: 'IBM Plex Mono', 'Courier New', Courier, monospace;
`;
