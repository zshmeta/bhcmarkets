import { useState } from 'react';
import styled, { css } from 'styled-components';
import { COLORS, RADIUS, FONT_SIZE, SPACING } from '../theme';
import { Caption } from './MobileTypography';

/**
 * Mobile Input Component
 * 
 * Text input with label, focus states, and optional right icon.
 */

type KeyboardType = 'default' | 'number' | 'decimal' | 'email' | 'tel' | 'url';

interface MobileInputProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    type?: 'text' | 'password' | 'email' | 'number';
    keyboardType?: KeyboardType;
    disabled?: boolean;
    error?: string;
    rightIcon?: React.ReactNode;
    onRightIconClick?: () => void;
    className?: string;
    style?: React.CSSProperties;
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${SPACING.s}px;
`;

const Label = styled(Caption)`
  text-transform: uppercase;
  letter-spacing: 1px;
  font-weight: 500;
  color: ${COLORS.textSecondary};
`;

const InputWrapper = styled.div<{ $focused: boolean; $hasError: boolean; $disabled: boolean }>`
  display: flex;
  align-items: center;
  background-color: ${COLORS.glass};
  border: 1px solid ${COLORS.border};
  border-radius: ${RADIUS.m}px;
  height: 50px;
  padding: 0 ${SPACING.m}px;
  transition: all 0.2s ease;

  ${({ $focused }) => $focused && css`
    border-color: ${COLORS.primary};
    background-color: rgba(77, 141, 254, 0.08);
    box-shadow: 0 0 0 3px rgba(77, 141, 254, 0.1);
  `}

  ${({ $hasError }) => $hasError && css`
    border-color: ${COLORS.error};
    background-color: rgba(255, 69, 96, 0.05);
  `}

  ${({ $disabled }) => $disabled && css`
    opacity: 0.5;
    cursor: not-allowed;
  `}
`;

const StyledInput = styled.input`
  flex: 1;
  background: transparent;
  border: none;
  color: ${COLORS.text};
  font-size: ${FONT_SIZE.body}px;
  height: 100%;
  outline: none;
  font-family: inherit;

  &::placeholder {
    color: ${COLORS.textTertiary};
  }

  &:disabled {
    cursor: not-allowed;
  }
`;

const IconButton = styled.button`
  background: transparent;
  border: none;
  padding: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  color: ${COLORS.textSecondary};
  
  &:hover { color: ${COLORS.text}; }
`;

const ErrorText = styled(Caption)`
  color: ${COLORS.error};
`;

const getInputType = (type?: string, keyboardType?: KeyboardType): string => {
    if (type) return type;
    switch (keyboardType) {
        case 'number':
        case 'decimal': return 'number';
        case 'email': return 'email';
        case 'tel': return 'tel';
        case 'url': return 'url';
        default: return 'text';
    }
};

export const MobileInput = ({
    label,
    value,
    onChange,
    placeholder,
    type,
    keyboardType = 'default',
    disabled = false,
    error,
    rightIcon,
    onRightIconClick,
    className,
    style,
}: MobileInputProps) => {
    const [isFocused, setIsFocused] = useState(false);

    return (
        <Container className={className} style={style}>
            <Label>{label}</Label>
            <InputWrapper $focused={isFocused} $hasError={!!error} $disabled={disabled}>
                <StyledInput
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    type={getInputType(type, keyboardType)}
                    disabled={disabled}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                />
                {rightIcon && (
                    <IconButton onClick={onRightIconClick} type="button" disabled={disabled}>
                        {rightIcon}
                    </IconButton>
                )}
            </InputWrapper>
            {error && <ErrorText>{error}</ErrorText>}
        </Container>
    );
};

export { MobileInput as Input };
