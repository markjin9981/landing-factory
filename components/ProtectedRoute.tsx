import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { authService } from '../services/authService';

interface Props {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<Props> = ({ children }) => {
  const [isChecking, setIsChecking] = useState(true);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      // First quick check (sync)
      if (!authService.isAuthenticated()) {
        setIsChecking(false);
        setIsValid(false);
        return;
      }

      // Then validate with Supabase (async)
      const valid = await authService.validateSession();
      setIsValid(valid);
      setIsChecking(false);
    };

    checkAuth();

    // Subscribe to auth changes
    const { data: { subscription } } = authService.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setIsValid(false);
        window.location.href = '/admin/login';
      } else if (event === 'SIGNED_IN' && session) {
        setIsValid(true);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Still checking - show loading
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">인증 확인 중...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!isValid && !authService.isAuthenticated()) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;