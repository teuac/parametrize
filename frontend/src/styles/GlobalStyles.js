// src/styles/GlobalStyle.js
import { createGlobalStyle } from "styled-components";
import "@fontsource/montserrat";
import "@fontsource/montserrat/500.css";
import "@fontsource/montserrat/600.css";
import "@fontsource/montserrat/700.css";

export const GlobalStyle = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  html, body {
    background-color: #0b0b0b;
    color: #f5f5f5;
    font-family: 'Montserrat', sans-serif;
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
    background: #111;
  }

  ::-webkit-scrollbar-thumb {
    background: #a8892a;
    border-radius: 8px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: #b69733;
  }
`;
