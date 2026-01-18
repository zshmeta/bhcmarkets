import styled from 'styled-components';
import { COLORS } from '../theme';

/**
 * Mobile Typography Components
 * 
 * Type-safe styled text components with consistent styling.
 */

interface TextStyleProps {
    color?: string;
    size?: number;
    weight?: string;
    align?: 'left' | 'center' | 'right';
}

const BaseText = styled.span<TextStyleProps>`
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, sans-serif;
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
  line-height: 1.2;
`;

export const H2 = styled(BaseText).attrs({ as: 'h2' })`
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -0.3px;
  line-height: 1.25;
`;

export const H3 = styled(BaseText).attrs({ as: 'h3' })`
  font-size: 18px;
  font-weight: 600;
  line-height: 1.3;
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
  font-family: 'SF Mono', 'IBM Plex Mono', 'Courier New', monospace;
`;

export const Label = styled(Caption)`
  text-transform: uppercase;
  letter-spacing: 1px;
  font-weight: 500;
`;
