import React, { createContext, useContext } from 'react';

const ThemeContext = createContext();

const theme = {
  colors: {
    main: '#000',
    secondary: '#03dac4',
    accent: '#03dac4',
  },
  backgroundColors: {
    main: '#fff',
    secondary: '#03dac4',
  },
  other: {
    border: '#000',
  },
};

export const ThemeProvider = ({ children }) => {
  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
