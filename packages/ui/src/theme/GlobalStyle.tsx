import { createGlobalStyle } from "styled-components";
import { radii, typography, toRgba } from "./tokens";

const GlobalStyle = createGlobalStyle`
  :root {
    color-scheme: dark;
  }

  @import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap");

  *, *::before, *::after {
    box-sizing: border-box;
  }

  body {
    margin: 0;
    min-height: 100vh;
    background: ${({ theme }) => `
      linear-gradient(180deg, ${toRgba(theme.colors.surfaceInverted, 0.04)} 0%, transparent 55%),
      ${theme.colors.backgrounds.app}
    `};
    font-family: ${typography.fontFamily};
    color: ${({ theme }) => theme.colors.text.primary};
    line-height: ${typography.lineHeights.normal};
    overflow-x: hidden;
  }

  #root {
    min-height: 100vh;
    isolation: isolate;
  }

  h1, h2, h3, h4, h5, h6 {
    margin: 0;
    font-family: ${typography.headingsFamily};
    font-weight: ${typography.weightSemiBold};
    letter-spacing: -0.01em;
  }

  p {
    margin: 0;
  }

  a {
    color: inherit;
  }

  ::selection {
    background: ${({ theme }) => toRgba(theme.colors.primary, 0.35)};
    color: ${({ theme }) => theme.colors.backgrounds.app};
  }

  :focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 3px;
  }

  ::-webkit-scrollbar {
    width: 10px;
    height: 10px;
  }

  ::-webkit-scrollbar-track {
    background: ${({ theme }) => toRgba(theme.colors.surfaceInverted, 0.04)};
  }

  ::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.gradients.primary};
    border-radius: ${radii.md};
  }
`;

export default GlobalStyle;