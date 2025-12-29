import React from 'react';
import { Navigate } from 'react-router-dom';
import { authService } from '../services/authService';

interface Props {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<Props> = ({ children }) => {
  const [isChecking, setIsChecking] = React.useState(true);

  React.useEffect(() => {
    // 1. Check local existence immediately
    if (!authService.isAuthenticated()) {
      // handled below
    } else {
      // 2. Async check remote validity
      authService.validateSession().then(isValid => {
        if (!isValid) {
          // Logout happened inside validateSession
          // Force re-render/redirect?
          // Since validateSession clears storage, re-render will catch it?
          // We need to trigger re-render or explicit navigation here.
          window.location.href = '/admin/login'; // Hard reload might be safer for cleanup
        }
        setIsChecking(false);
      });
    }
  }, []);

  if (!authService.isAuthenticated()) {
    return <Navigate to="/admin/login" replace />;
  }

  // Optional: Show loading spinner if STRICT security is required.
  // For UX, show content immediately (optimistic) and kick if invalid.
  // So just return children.
  return <>{children}</>;
};

export default ProtectedRoute;