import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRole }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading application...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && user.role !== allowedRole) {
    // If a customer tries to access agent routes, redirect to customer dashboard
    if (user.role === 'customer') {
      return <Navigate to="/dashboard" replace />;
    }
    // If an agent tries to access customer routes, redirect to agent dashboard
    return <Navigate to="/agent/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
