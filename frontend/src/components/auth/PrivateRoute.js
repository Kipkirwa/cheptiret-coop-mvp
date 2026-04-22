import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Box, CircularProgress } from '@mui/material';

// Role-based home routes — wrong role redirects here instead of /login
const roleHomeRoutes = {
  farmer:      '/farmer/dashboard',
  transporter: '/transporter/dashboard',
  admin:       '/admin/dashboard',
};

const PrivateRoute = ({ children, role }) => {
  const { isAuthenticated, user, loading, getUserRole } = useAuth();

  // Still loading auth state from storage — show spinner
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress sx={{ color: '#2e7d32' }} />
      </Box>
    );
  }

  // Get the actual role from storage or user object
  const storedRole = localStorage.getItem('role');
  const userRole = (storedRole || getUserRole() || user?.role || '').toString().trim().toLowerCase();
  const requiredRole = role ? role.toString().trim().toLowerCase() : '';
  
  console.log('🔒 PrivateRoute check:', {
    requiredRole: requiredRole,
    userRole: userRole,
    isAuthenticated: isAuthenticated(),
    hasToken: !!localStorage.getItem('token'),
    rawRequiredRole: role,
    rawStoredRole: storedRole
  });

  // Not logged in at all
  if (!isAuthenticated()) {
    console.log('🔒 Not authenticated, redirecting to /login');
    return <Navigate to="/login" replace />;
  }

  // Logged in but wrong role — send to their correct dashboard, not login
  if (requiredRole && userRole !== requiredRole) {
    const redirectTo = roleHomeRoutes[userRole] || '/login';
    console.log(`🔒 Role mismatch! "${userRole}" !== "${requiredRole}". Redirecting to ${redirectTo}`);
    return <Navigate to={redirectTo} replace />;
  }

  console.log('🔒 Access granted to', userRole);
  return children;
};

export default PrivateRoute;