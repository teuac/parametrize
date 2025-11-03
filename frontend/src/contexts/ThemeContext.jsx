import React, { createContext, useContext, useEffect, useState } from 'react';
import { darkTheme, lightTheme } from '../theme';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';

const ThemeContext = createContext({ themeName: 'dark', setThemeName: () => {} });

export function useAppTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }) {
  const [themeName, setThemeName] = useState(() => {
    try {
      const v = localStorage.getItem('app_theme');
      return v || 'dark';
    } catch (e) { return 'dark'; }
  });

  useEffect(() => {
    try { localStorage.setItem('app_theme', themeName); } catch (e) {}
  }, [themeName]);

  const themeObj = themeName === 'light' ? lightTheme : darkTheme;

  return (
    <ThemeContext.Provider value={{ themeName, setThemeName }}>
      <StyledThemeProvider theme={themeObj}>{children}</StyledThemeProvider>
    </ThemeContext.Provider>
  );
}

export default ThemeContext;
