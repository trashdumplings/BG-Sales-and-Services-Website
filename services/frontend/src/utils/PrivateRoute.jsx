import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../stores/AuthProvider';

export default function PrivateRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: '#0f172a',
        color: '#fff'
      }}>
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Basic role-based access control
  const roles = ['superadmin', 'admin', 'hr', 'employee'];
  const pathParts = location.pathname.split('/').filter(Boolean);
  
  // If at root /dashboard, redirect to the user's role dashboard
  if (pathParts.length === 1 && pathParts[0] === 'dashboard') {
    return <Navigate to={`/dashboard/${user.role}`} replace />;
  }

  // If trying to access another core role dashboard directly, redirect to own
  const potentialRole = pathParts[1];
  if (roles.includes(potentialRole) && potentialRole !== user.role) {
    return <Navigate to={`/dashboard/${user.role}`} replace />;
  }

  return <Outlet />;
}
