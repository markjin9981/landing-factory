import React from 'react';
import { Navigate } from 'react-router-dom';
import { authService } from '../services/authService';

interface Props {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<Props> = ({ children }) => {
  if (!authService.isAuthenticated()) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;