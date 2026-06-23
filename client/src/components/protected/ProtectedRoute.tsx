import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-athlix-dark text-athlix-text">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-athlix-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-athlix-dark px-4 text-center">
        <h1 className="text-3xl font-extrabold text-athlix-primary font-bebas tracking-wide">Access Restricted 🥋</h1>
        <p className="mt-4 text-athlix-muted">
          Your user profile role ({user.role}) is not authorized to view this page.
        </p>
        <a
          href="/"
          className="mt-6 rounded-md bg-athlix-card border border-athlix-primary border-opacity-30 px-6 py-2.5 text-sm font-medium text-athlix-text hover:bg-opacity-80 transition-all duration-200"
        >
          Go Back Home
        </a>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
