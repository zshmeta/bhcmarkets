import styled, { css } from 'styled-components';

export const Container = styled.div`
  position: relative;
  width: 300px;
  font-family: 'Inter', sans-serif;
`;

export const TriggerButton = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: var(--surface, #1C2128);
  border: 1px solid var(--border, #30363D);
  border-radius: 4px;
  color: var(--text-primary, #E6EDF3);
  font-size: 13px;
  cursor: pointer;
  
  &:hover {
    border-color: var(--text-tertiary, #6E7681);
  }
`;

export const Dropdown = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  margin-top: 4px;
  background: var(--bg-secondary, #161B22);
  border: 1px solid var(--border, #30363D);
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.5);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 100;
  max-height: 500px;
`;

export const Tabs = styled.div`
  display: flex;
  background: var(--bg-tertiary, #1C2128);
  border-bottom: 1px solid var(--border, #30363D);
`;

export const Tab = styled.button<{ $active?: boolean }>`
  flex: 1;
  padding: 8px;
  background: none;
  border: none;
  color: ${({ $active }) => $active ? 'var(--text-primary, #E6EDF3)' : 'var(--text-tertiary, #6E7681)'};
  border-bottom: 2px solid ${({ $active }) => $active ? 'var(--buy, #3FB950)' : 'transparent'};
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  
  &:hover {
    color: var(--text-secondary, #9AA5B1);
  }
`;

export const SearchBar = styled.div`
  padding: 8px;
  border-bottom: 1px solid var(--border, #30363D);
`;

export const SearchInput = styled.input`
  width: 100%;
  padding: 6px 8px;
  padding-right: 24px;
  background: var(--bg-primary, #0D1117);
  border: 1px solid var(--border, #30363D);
  border-radius: 4px;
  color: var(--text-primary, #E6EDF3);
  font-size: 12px;
  
  &:focus {
    outline: none;
    border-color: var(--accent, #3B82F6);
  }
`;

export const CategoryList = styled.div`
  flex: 1;
  overflow-y: auto;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background: var(--border, #30363D);
    border-radius: 3px;
  }
`;

export const CategoryHeader = styled.button<{ $expanded?: boolean }>`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--surface, #1C2128);
  border: none;
  border-bottom: 1px solid var(--border-subtle, #262C36);
  color: var(--text-secondary, #9AA5B1);
  font-size: 12px;
  text-align: left;
  cursor: pointer;
  
  &:hover {
    background: var(--surface-hover, #262C36);
    color: var(--text-primary, #E6EDF3);
  }

  svg {
    transition: transform 0.2s;
    transform: ${({ $expanded }) => $expanded ? 'rotate(90deg)' : 'rotate(0deg)'};
  }
`;

export const SymbolList = styled.div`
  background: var(--bg-primary, #0D1117);
`;

export const SymbolItem = styled.button<{ $selected?: boolean }>`
  width: 100%;
  padding: 8px 12px 8px 32px; /* Indent for nested feel */
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: ${({ $selected }) => $selected ? 'rgba(59, 130, 246, 0.15)' : 'transparent'};
  border: none;
  border-bottom: 1px solid var(--border-subtle, #21262D);
  color: ${({ $selected }) => $selected ? 'var(--accent, #3B82F6)' : 'var(--text-primary, #E6EDF3)'};
  font-size: 12px;
  cursor: pointer;
  text-align: left;
  
  &:hover {
    background: ${({ $selected }) => $selected ? 'rgba(59, 130, 246, 0.2)' : 'var(--surface-hover, #161B22)'};
  }
`;
