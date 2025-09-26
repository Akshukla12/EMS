import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import AdminDashboard from './pages/AdminDashboard';
import VendorDashboard from './pages/VendorDashboard';
import UserDashboard from './pages/UserDashboard';
import ProductCatalog from './pages/ProductCatalog';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderHistory from './pages/OrderHistory';
import MembershipManagement from './pages/MembershipManagement';
import Layout from './components/Layout';
import './index.css';

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={!user ? <LoginPage /> : <Navigate to={`/${user.role}`} />} />
      <Route path="/signup" element={!user ? <SignUpPage /> : <Navigate to={`/${user.role}`} />} />
      
      <Route path="/admin" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <Layout><AdminDashboard /></Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/vendor" element={
        <ProtectedRoute allowedRoles={['vendor']}>
          <Layout><VendorDashboard /></Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/user" element={
        <ProtectedRoute allowedRoles={['user']}>
          <Layout><UserDashboard /></Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/products" element={
        <ProtectedRoute allowedRoles={['user', 'vendor']}>
          <Layout><ProductCatalog /></Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/cart" element={
        <ProtectedRoute allowedRoles={['user']}>
          <Layout><Cart /></Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/checkout" element={
        <ProtectedRoute allowedRoles={['user']}>
          <Layout><Checkout /></Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/orders" element={
        <ProtectedRoute allowedRoles={['user', 'vendor', 'admin']}>
          <Layout><OrderHistory /></Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/membership" element={
        <ProtectedRoute allowedRoles={['user', 'admin']}>
          <Layout><MembershipManagement /></Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/unauthorized" element={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600">Unauthorized Access</h1>
            <p className="mt-2 text-gray-600">You don't have permission to access this page.</p>
          </div>
        </div>
      } />
      
      <Route path="/" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <AppRoutes />
          </div>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
