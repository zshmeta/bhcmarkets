import React from 'react';
import styled, { css, keyframes } from 'styled-components';
import { COLORS, RADIUS } from '../theme/theme';
import { H3 } from './Typography';

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'glass' | 'outline' | 'danger';
    size?: 'small' | 'medium' | 'large';
    loading?: boolean;
    disabled?: boolean;
    style?: React.CSSProperties;
    icon?: React.ReactNode;
    className?: string;
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
  animation: ${spin} 1s linear infinite;
`;

const StyledButton = styled.button<{ $variant: string; $size: string; $disabled: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  border-radius: ${RADIUS.m}px;
  transition: all 0.2s ease;
  width: 100%; // Default to full width for mobile touch targets usually, or auto

  /* Sizes */
  ${({ $size }) => $size === 'small' && css`height: 36px; padding: 0 16px;`}
  ${({ $size }) => $size === 'medium' && css`height: 48px; padding: 0 24px;`}
  ${({ $size }) => $size === 'large' && css`height: 56px; padding: 0 32px;`}

  /* Variants */
  ${({ $variant }) => $variant === 'primary' && css`
    background: linear-gradient(135deg, ${COLORS.primary} 0%, #3D7CE6 100%);
    color: white;
    &:active { opacity: 0.9; transform: scale(0.98); }
  `}

  ${({ $variant }) => $variant === 'secondary' && css`
    background: linear-gradient(135deg, ${COLORS.secondary} 0%, #00C484 100%);
    color: white;
    &:active { opacity: 0.9; transform: scale(0.98); }
  `}

  ${({ $variant }) => $variant === 'glass' && css`
    background: ${COLORS.glass};
    border: 1px solid ${COLORS.glassBorder};
    color: ${COLORS.text};
    backdrop-filter: blur(10px);
    &:active { background: rgba(255, 255, 255, 0.1); }
  `}

  ${({ $variant }) => $variant === 'outline' && css`
    background: transparent;
    border: 1.5px solid ${COLORS.primary};
    color: ${COLORS.primary};
    &:active { background: rgba(59, 130, 246, 0.1); }
  `}

  ${({ $variant }) => $variant === 'danger' && css`
    background: ${COLORS.error};
    color: white;
    &:active { opacity: 0.9; }
  `}

  /* Disabled */
  ${({ $disabled }) => $disabled && css`
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
  `}
`;

const IconWrapper = styled.div`
  margin-right: 8px;
  display: flex;
  align-items: center;
`;

export const Button: React.FC<ButtonProps> = ({
    title,
    onPress,
    variant = 'primary',
    size = 'medium',
    loading = false,
    disabled = false,
    style,
    icon,
    className
}) => {
    return (
        <StyledButton
            onClick={onPress}
            disabled={disabled || loading}
            $variant={variant}
            $size={size}
            $disabled={disabled || loading}
            style={style}
            className={className}
        >
            {loading ? <Spinner /> : (
                <>
                    {icon && <IconWrapper>{icon}</IconWrapper>}
                    <H3
                        size={16}
                        weight="600"
                        color={variant === 'outline' ? COLORS.primary : (variant === 'glass' ? COLORS.text : '#FFF')}
                        style={{ margin: 0 }}
                    >
                        {title}
                    </H3>
                </>
            )}
        </StyledButton>
    );
};
