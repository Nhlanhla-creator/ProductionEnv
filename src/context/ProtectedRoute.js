// components/ProtectedRoute.js
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';
import { Loader2 } from 'lucide-react';

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, userRoles, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="loading-screen">
        <Loader2 className="animate-spin" size={32} />
        <p>Loading...</p>
      </div>
    );
  }

  // If user is not authenticated, redirect to login
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // If email needs verification, redirect to verification page
  // BUT allow access to verification page itself and auth page
  // if (!user.emailVerified) {
  //   // List of pages that unverified users CAN access
  //   const allowedPages = [
  //     '/verify-email',
  //     '/auth',
  //     '/',
  //     '/LoginRegister',
  //     '/RetrieveAccount'
  //   ];
    
  //   if (!allowedPages.includes(location.pathname)) {
  //     return <Navigate to="/verify-email" state={{ from: location }} replace />;
  //   }
    
  //   // If user is already on verify-email page, allow them to stay
  //   return children;
  // }

  // If specific roles are required, check them
  if (allowedRoles.length > 0) {
    // Normalize roles for comparison (case-insensitive)
    const normalizedAllowedRoles = allowedRoles.map(role => role.toLowerCase());
    const normalizedUserRoles = userRoles.map(role => role.toLowerCase());
    
    // Check if user has any of the allowed roles
    const hasRequiredRole = normalizedUserRoles.some(userRole => 
      normalizedAllowedRoles.includes(userRole)
    );
    
    if (!hasRequiredRole) {
      // User doesn't have required role
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return children;
}