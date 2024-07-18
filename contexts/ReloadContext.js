import React, { createContext, useContext, useState } from 'react';

const ReloadContext = createContext();

export const useReload = () => {
    return useContext(ReloadContext);
};

export const ReloadProvider = ({ children }) => {
    const [reload, setReload] = useState(false);
    const [usersData, setUsersData] = useState({});

    return (
        <ReloadContext.Provider value={{ reload, setReload, usersData, setUsersData }}>
            {children}
        </ReloadContext.Provider>
    );
};
