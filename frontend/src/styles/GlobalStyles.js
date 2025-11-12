// src/styles/GlobalStyle.js
import { createGlobalStyle } from "styled-components";
// Use Google Fonts Inter for the whole application. We import it via
// the CSS @import inside the global style so no additional npm packages
// are required.

export const GlobalStyle = createGlobalStyle`
  /* Inter is loaded via <link> in index.html to avoid runtime @import issues */
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  html, body {
    background-color: ${({ theme }) => theme.colors.bg};
    color: ${({ theme }) => theme.colors.text};
    font-family: 'Inter', sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    font-weight: 400;
    height: 100%;
  }

  button, input, textarea, select {
    font-family: inherit;
  }

  #root {
    min-height: 100vh;
  }

  /* === Scrollbar estilizada === */
  ::-webkit-scrollbar {
    width: 8px;
  }

  ::-webkit-scrollbar-track {
    background: ${({ theme }) => theme.colors.scrollbarTrack};
  }

  ::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.colors.scrollbarThumb};
    border-radius: 8px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: ${({ theme }) => theme.colors.scrollbarThumb};
  }
`;
