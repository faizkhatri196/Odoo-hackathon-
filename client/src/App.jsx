import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { StockProvider } from './context/StockContext';
import { AppRoutes } from './routes/AppRoutes';

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <StockProvider>
          <AppRoutes />
        </StockProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
