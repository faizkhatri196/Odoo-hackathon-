import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { AuthLayout } from '../layouts/AuthLayout';

// Auth Pages
import { Login } from '../pages/auth/Login';
import { Signup } from '../pages/auth/Signup';
import { ForgotPassword } from '../pages/auth/ForgotPassword';

// Dashboard & Functional Modules
import { Dashboard } from '../pages/dashboard/Dashboard';
import { Products } from '../pages/products/Products';
import { ProductDetails } from '../pages/products/ProductDetails';
import { ProductForm } from '../pages/products/ProductForm';

import { Receipts } from '../pages/receipts/Receipts';
import { ReceiptDetails } from '../pages/receipts/ReceiptDetails';
import { ReceiptForm } from '../pages/receipts/ReceiptForm';

import { Deliveries } from '../pages/deliveries/Deliveries';
import { DeliveryDetails } from '../pages/deliveries/DeliveryDetails';
import { DeliveryForm } from '../pages/deliveries/DeliveryForm';

import { Transfers } from '../pages/transfers/Transfers';
import { TransferDetails } from '../pages/transfers/TransferDetails';
import { TransferForm } from '../pages/transfers/TransferForm';

import { Adjustments } from '../pages/adjustments/Adjustments';
import { AdjustmentForm } from '../pages/adjustments/AdjustmentForm';

import { StockLedger } from '../pages/ledger/StockLedger';
import { LedgerDetails } from '../pages/ledger/LedgerDetails';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
      </Route>

      {/* Main Dashboard Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />

        {/* Products */}
        <Route path="products" element={<Products />} />
        <Route path="products/new" element={<ProductForm />} />
        <Route path="products/:id" element={<ProductDetails />} />

        {/* Receipts */}
        <Route path="receipts" element={<Receipts />} />
        <Route path="receipts/new" element={<ReceiptForm />} />
        <Route path="receipts/:id" element={<ReceiptDetails />} />

        {/* Deliveries */}
        <Route path="deliveries" element={<Deliveries />} />
        <Route path="deliveries/new" element={<DeliveryForm />} />
        <Route path="deliveries/:id" element={<DeliveryDetails />} />

        {/* Transfers */}
        <Route path="transfers" element={<Transfers />} />
        <Route path="transfers/new" element={<TransferForm />} />
        <Route path="transfers/:id" element={<TransferDetails />} />

        {/* Adjustments */}
        <Route path="adjustments" element={<Adjustments />} />
        <Route path="adjustments/new" element={<AdjustmentForm />} />

        {/* Ledger */}
        <Route path="ledger" element={<StockLedger />} />
        <Route path="ledger/:id" element={<LedgerDetails />} />
      </Route>

      {/* Catch-all fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
