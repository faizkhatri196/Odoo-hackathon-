import React from 'react';
import { Outlet } from 'react-router-dom';

export const AuthLayout = () => {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at top, #1e1b4b 0%, #0b0f19 100%)',
      padding: '24px',
    }}>
      <div style={{ width: '100%', maxWidth: '440px' }}>
        <Outlet />
      </div>
    </div>
  );
};
