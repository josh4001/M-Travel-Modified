import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store';

interface ProtectedRouteProps {
  children: React.ReactElement;
  allowedRoles?: string[];
}

/**
 * Strict RBAC Route Gate
 * ----------------------
 * - Verifies user is authenticated.
 * - Enforces role-based permissions (RBAC) if `allowedRoles` is specified.
 * - Prevents unauthorized access across role dashboards.
 */
export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const user = useSelector((s: RootState) => s.auth.user);
  const hasToken = Boolean(localStorage.getItem('mt_access_token'));

  // Not logged in -> Redirect to login
  if (!user && !hasToken) {
    return <Navigate to="/login" replace />;
  }

  // If user object is loaded and role restrictions are set, enforce RBAC
  if (user && allowedRoles && allowedRoles.length > 0) {
    const userRole = user.role?.toUpperCase();
    const isAllowed = allowedRoles.some((role) => role.toUpperCase() === userRole);

    if (!isAllowed) {
      // Redirect unauthorized user to their designated role page
      if (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') {
        return <Navigate to="/dashboard/admin" replace />;
      }
      if (userRole === 'VEHICLE_OWNER') {
        return <Navigate to="/dashboard/owner" replace />;
      }
      return <Navigate to="/dashboard/tourist" replace />;
    }
  }

  return children;
}
