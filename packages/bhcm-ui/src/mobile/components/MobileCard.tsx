import styled, { css } from 'styled-components';
import { COLORS, RADIUS, SPACING, type SpacingKey } from '../theme';

/**
 * Mobile Card Component
 * 
 * Container with consistent styling and padding options.
 */

interface MobileCardProps {
    children: React.ReactNode;
    padding?: SpacingKey | 'none';
    variant?: 'default' | 'elevated' | 'glass';
    className?: string;
    style?: React.CSSProperties;
    onClick?: () => void;
}

const getPadding = (p: SpacingKey | 'none'): string => {
    if (p === 'none') return '0';
    return `${SPACING[p]}px`;
};

const variantStyles = {
    default: css`
    background-color: ${COLORS.bgLayer2};
    border: 1px solid ${COLORS.border};
  `,
    elevated: css`
    background-color: ${COLORS.bgLayer1};
    border: 1px solid ${COLORS.border};
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  `,
    glass: css`
    background: ${COLORS.glass};
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid ${COLORS.glassBorder};
  `,
};

const StyledCard = styled.div<{
    $padding: SpacingKey | 'none';
    $variant: 'default' | 'elevated' | 'glass';
    $clickable: boolean;
}>`
  border-radius: ${RADIUS.l}px;
  padding: ${({ $padding }) => getPadding($padding)};
  transition: all 0.2s ease;
  
  ${({ $variant }) => variantStyles[$variant]}
  
  ${({ $clickable }) => $clickable && css`
    cursor: pointer;
    &:active { transform: scale(0.98); opacity: 0.9; }
  `}
`;

export const MobileCard = ({
    children,
    padding = 'm',
    variant = 'default',
    className,
    style,
    onClick,
}: MobileCardProps) => (
    <StyledCard
        $padding={padding}
        $variant={variant}
        $clickable={!!onClick}
        className={className}
        style={style}
        onClick={onClick}
    >
        {children}
    </StyledCard>
);

export { MobileCard as Card };
