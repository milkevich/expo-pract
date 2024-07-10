import React, { createContext, useContext } from 'react';

const ThemeContext = createContext();

const theme = {
  colors: {
    main: '#1A1A1A',
    main2: '#fff',
    secondary: '#D5D5D5',
    third: '#646464',
    accent: '#03dac4',
  },
  backgroundColors: {
    main: '#F9F9F9',
    main2: '#fff',
    secondary: '#EDEDED',
    highlight: '#1A1A1A',
  },
  other: {
    border: '#D5D5D5',
    borderRadius: {
      btn: '10px',
      container: '35px',
    }
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
