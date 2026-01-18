import React, { useState } from 'react';
import styled, { css } from 'styled-components';
import { COLORS, RADIUS, FONT_SIZE } from '../theme/theme';
import { Body } from './Typography';

interface InputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'number-pad' | 'decimal-pad' | 'email-address';
  style?: React.CSSProperties;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
  className?: string;
}

const Container = styled.div`
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
`;

const Label = styled(Body)`
  margin-bottom: 8px;
  color: ${COLORS.textSecondary};
  font-size: ${FONT_SIZE.caption}px;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const InputWrapper = styled.div<{ $focused: boolean }>`
  display: flex;
  align-items: center;
  background-color: ${COLORS.glass};
  border: 1px solid ${COLORS.border};
  border-radius: ${RADIUS.m}px;
  height: 50px;
  padding: 0 16px;
  transition: all 0.2s ease;

  ${({ $focused }) => $focused && css`
    border-color: ${COLORS.primary};
    background-color: rgba(77, 141, 254, 0.1);
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
`;

const IconBtn = styled.button`
  background: transparent;
  border: none;
  padding: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
`;

export const Input: React.FC<InputProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType = 'default',
  style,
  rightIcon,
  onRightIconPress,
  className
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <Container style={style} className={className}>
      <Label>{label}</Label>
      <InputWrapper $focused={isFocused}>
        <StyledInput
          value={value}
          onChange={(e) => onChangeText(e.target.value)}
          placeholder={placeholder}
          type={secureTextEntry ? 'password' : (keyboardType === 'number-pad' || keyboardType === 'decimal-pad' ? 'number' : 'text')}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
        {rightIcon && (
          <IconBtn onClick={onRightIconPress} type="button">
            {rightIcon}
          </IconBtn>
        )}
      </InputWrapper>
    </Container>
  );
};
