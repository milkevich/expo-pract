import React, { createContext, useContext, useState } from 'react';

const StatusBarContext = createContext();

export const StatusBarProvider = ({ children }) => {
  const [status, setStatus] = useState('dark');

  return (
    <StatusBarContext.Provider value={{ status, setStatus }}>
      {children}
    </StatusBarContext.Provider>
  );
};

export const useStatusBar = () => useContext(StatusBarContext);
