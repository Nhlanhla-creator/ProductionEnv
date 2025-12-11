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
  // Note: You might want to allow access to verification page itself
  if (!user.emailVerified && !location.pathname.includes('/verify-email')) {
    return <Navigate to="/auth?mode=verify" state={{ from: location }} replace />;
  }

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