import styled, { css, keyframes } from 'styled-components';
import { COLORS, RADIUS } from '../theme';

/**
 * Mobile Button Component
 * 
 * Touch-optimized button with multiple variants and loading state.
 */

type ButtonVariant = 'primary' | 'secondary' | 'glass' | 'outline' | 'danger' | 'ghost';
type ButtonSize = 'small' | 'medium' | 'large';

interface MobileButtonProps {
    title: string;
    onClick: () => void;
    variant?: ButtonVariant;
    size?: ButtonSize;
    loading?: boolean;
    disabled?: boolean;
    icon?: React.ReactNode;
    fullWidth?: boolean;
    className?: string;
    style?: React.CSSProperties;
}

const spin = keyframes`
  to { transform: rotate(360deg); }
`;

const Spinner = styled.div`
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-left-color: #fff;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  animation: ${spin} 0.8s linear infinite;
`;

const variantStyles = {
    primary: css`
    background: linear-gradient(135deg, ${COLORS.primary} 0%, #3D7CE6 100%);
    color: white;
    &:active:not(:disabled) { opacity: 0.9; transform: scale(0.98); }
  `,
    secondary: css`
    background: linear-gradient(135deg, ${COLORS.secondary} 0%, #00C484 100%);
    color: white;
    &:active:not(:disabled) { opacity: 0.9; transform: scale(0.98); }
  `,
    glass: css`
    background: ${COLORS.glass};
    border: 1px solid ${COLORS.glassBorder};
    color: ${COLORS.text};
    backdrop-filter: blur(10px);
    &:active:not(:disabled) { background: rgba(255, 255, 255, 0.1); }
  `,
    outline: css`
    background: transparent;
    border: 1.5px solid ${COLORS.primary};
    color: ${COLORS.primary};
    &:active:not(:disabled) { background: rgba(77, 141, 254, 0.1); }
  `,
    danger: css`
    background: ${COLORS.error};
    color: white;
    &:active:not(:disabled) { opacity: 0.9; }
  `,
    ghost: css`
    background: transparent;
    color: ${COLORS.textSecondary};
    &:active:not(:disabled) { color: ${COLORS.text}; }
  `,
};

const sizeStyles = {
    small: css`height: 36px; padding: 0 16px; font-size: 14px;`,
    medium: css`height: 48px; padding: 0 24px; font-size: 16px;`,
    large: css`height: 56px; padding: 0 32px; font-size: 18px;`,
};

const StyledButton = styled.button<{
    $variant: ButtonVariant;
    $size: ButtonSize;
    $fullWidth: boolean;
}>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: none;
  cursor: pointer;
  border-radius: ${RADIUS.m}px;
  transition: all 0.2s ease;
  width: ${({ $fullWidth }) => $fullWidth ? '100%' : 'auto'};
  font-family: inherit;
  font-weight: 600;
  
  ${({ $size }) => sizeStyles[$size]}
  ${({ $variant }) => variantStyles[$variant]}
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
  }
`;

const IconWrapper = styled.span`
  display: flex;
  align-items: center;
`;

export const MobileButton = ({
    title,
    onClick,
    variant = 'primary',
    size = 'medium',
    loading = false,
    disabled = false,
    icon,
    fullWidth = true,
    className,
    style,
}: MobileButtonProps) => (
    <StyledButton
        onClick={onClick}
        disabled={disabled || loading}
        $variant={variant}
        $size={size}
        $fullWidth={fullWidth}
        className={className}
        style={style}
    >
        {loading ? <Spinner /> : (
            <>
                {icon && <IconWrapper>{icon}</IconWrapper>}
                <span>{title}</span>
            </>
        )}
    </StyledButton>
);

export { MobileButton as Button };
