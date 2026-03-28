import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

/**
 * ProtectedRoute - Wraps pages that require authentication.
 * Optionally restricts by role.
 *
 * @param {string[]} allowedRoles - e.g. ['patient'], ['doctor'], ['admin']
 */
export default function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return <div className="loading-spinner" />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.user_type)) {
    // Redirect to their own dashboard
    const dashboardMap = {
      patient: '/patient/dashboard',
      doctor: '/doctor/dashboard',
      admin: '/admin/dashboard',
      lab_tech: '/lab/orders',
    };
    return <Navigate to={dashboardMap[user?.user_type] || '/'} replace />;
  }

  return children;
}
