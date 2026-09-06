import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/types';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Memuat...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login page with return url
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role-based access and redirect to Forbidden
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/forbidden" state={{ from: location, allowed: allowedRoles }} replace />;
  }

  return <>{children}</>;
}

// Convenience components for specific role access
export function AdminRoute({ children }: { children: ReactNode }) {
  return <ProtectedRoute allowedRoles={['admin','admin_asset']}>{children}</ProtectedRoute>;
}

export function StaffRoute({ children }: { children: ReactNode }) {
  return <ProtectedRoute allowedRoles={['staff']}>{children}</ProtectedRoute>;
}
