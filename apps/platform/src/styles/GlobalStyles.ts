
import { createGlobalStyle } from 'styled-components';
import { COLORS, TYPOGRAPHY } from '@repo/trading-ui';

export const GlobalStyles = createGlobalStyle`
  * {
    box-sizing: border-box;
  }
  
  body {
    margin: 0;
    padding: 0;
    background: ${COLORS.bg.primary};
    color: ${COLORS.text.primary};
    font-family: ${TYPOGRAPHY.fontFamily.sans};
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  
  /* Custom scrollbar */
  ::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  ::-webkit-scrollbar-track {
    background: transparent;
  }
  ::-webkit-scrollbar-thumb {
    background: ${COLORS.border.default};
    border-radius: 3px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: ${COLORS.border.strong};
  }
  
  /* React Grid Layout overrides */
  .react-grid-layout {
    background: transparent !important;
  }
  
  .react-grid-item {
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }
  
  .react-grid-item.react-grid-placeholder {
    background: ${COLORS.semantic.info.bg} !important;
    border: 2px dashed ${COLORS.semantic.info.main} !important;
    border-radius: 8px;
    opacity: 0.5;
  }
  
  .react-grid-item > .react-resizable-handle {
    opacity: 0;
    transition: opacity 0.2s ease;
  }
  
  .react-grid-item:hover > .react-resizable-handle {
    opacity: 1;
  }
  
  .react-resizable-handle::after {
    border-color: ${COLORS.text.tertiary} !important;
  }
`;
