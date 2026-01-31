
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isSignedIn, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="w-10 h-10 border-t-2 border-primary rounded-full animate-spin"></div>
    </div>;
  }
  
  if (!isSignedIn) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};
