import React, { createContext, useState } from 'react';

export const StockContext = createContext();

export const StockProvider = ({ children }) => {
  const [activeWarehouse, setActiveWarehouse] = useState('ALL');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const triggerRefresh = () => setRefreshTrigger((prev) => prev + 1);

  return (
    <StockContext.Provider
      value={{
        activeWarehouse,
        setActiveWarehouse,
        refreshTrigger,
        triggerRefresh,
      }}
    >
      {children}
    </StockContext.Provider>
  );
};
